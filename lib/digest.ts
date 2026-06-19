import { getSupabaseClient } from '@/lib/supabase'
import { generateInsights, filterInsightsByRole } from '@/lib/insights'
import { buildDigestEmailHtml, sendEmail } from '@/lib/email'
import { sendSlackDigest } from '@/lib/slack'
import type { User, Insight, DigestChannel } from '@/types'

function getLocalHour(timezone: string): number {
  try {
    const hour = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
    return parseInt(hour, 10)
  } catch {
    return new Date().getUTCHours()
  }
}

function parseDigestHour(digestTime: string): number {
  const [h] = digestTime.split(':')
  return parseInt(h, 10)
}

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

export async function getTodaysInsightsForUser(user: User): Promise<Insight[]> {
  const db = getSupabaseClient()
  const today = todayInTimezone(user.timezone)

  const { data } = await db
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .gte('generated_at', `${today}T00:00:00Z`)
    .order('generated_at', { ascending: false })

  return filterInsightsByRole((data ?? []) as Insight[], user.role)
}

export async function ensureTodaysInsights(user: User): Promise<Insight[]> {
  const existing = await getTodaysInsightsForUser(user)
  if (existing.length > 0) return existing
  return generateInsights(user.id, user.org_id, user.role)
}

async function recordDelivery(
  userId: string,
  date: string,
  channel: DigestChannel,
  insightIds: string[],
): Promise<void> {
  const db = getSupabaseClient()
  await db.from('digest_deliveries').insert({
    user_id: userId,
    date,
    channel,
    insight_ids: insightIds,
  })
}

export async function deliverDigestToUser(user: User, insights: Insight[]): Promise<void> {
  const db = getSupabaseClient()
  const today = todayInTimezone(user.timezone)
  const prefs = user.notification_prefs
  const insightIds = insights.map(i => i.id)

  // Web delivery is implicit — record it
  const { data: webDelivery } = await db
    .from('digest_deliveries')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', today)
    .eq('channel', 'web')
    .maybeSingle()

  if (!webDelivery) {
    await recordDelivery(user.id, today, 'web', insightIds)
  }

  if (prefs.email) {
    const { data: emailDelivery } = await db
      .from('digest_deliveries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('channel', 'email')
      .maybeSingle()

    if (!emailDelivery && insights.length > 0) {
      const result = await sendEmail({
        to: user.email,
        subject: `Your Yoracle digest — ${insights.length} insight${insights.length !== 1 ? 's' : ''}`,
        html: buildDigestEmailHtml(user.name ?? user.email, insights),
      })
      if (result.success) {
        await recordDelivery(user.id, today, 'email', insightIds)
      }
    }
  }

  if (prefs.slack) {
    const { data: slackDelivery } = await db
      .from('digest_deliveries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('channel', 'slack')
      .maybeSingle()

    if (!slackDelivery && insights.length > 0) {
      const result = await sendSlackDigest(user.email, insights)
      if (result.success) {
        await recordDelivery(user.id, today, 'slack', insightIds)
      }
    }
  }
}

export async function runScheduledDigests(): Promise<{ processed: number; delivered: number }> {
  const db = getSupabaseClient()
  const { data: users } = await db.from('users').select('*')

  let processed = 0
  let delivered = 0

  for (const user of (users ?? []) as User[]) {
    const localHour = getLocalHour(user.timezone)
    const digestHour = parseDigestHour(user.notification_prefs.digest_time)

    // Run within the digest hour window
    if (localHour !== digestHour) continue

    processed++
    const insights = await ensureTodaysInsights(user)
    if (insights.length > 0) {
      await deliverDigestToUser(user, insights)
      delivered++
    }
  }

  return { processed, delivered }
}
