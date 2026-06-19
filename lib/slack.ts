import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseClient } from '@/lib/supabase'
import { getUserByEmail } from '@/lib/users'
import { streamChat } from '@/lib/ai'
import type { ChatMessage, Insight } from '@/types'

const SLACK_API = 'https://slack.com/api'

export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string,
): boolean {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false

  const sigBasestring = `v0:${timestamp}:${body}`
  const hmac = createHmac('sha256', signingSecret).update(sigBasestring).digest('hex')
  const computed = `v0=${hmac}`

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  } catch {
    return false
  }
}

async function slackApi(method: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) throw new Error('SLACK_BOT_TOKEN not configured')

  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<Record<string, unknown>>
}

export async function getSlackUserEmail(slackUserId: string): Promise<string | null> {
  const result = await slackApi('users.info', { user: slackUserId })
  if (!result.ok) return null
  const profile = (result.user as { profile?: { email?: string } })?.profile
  return profile?.email ?? null
}

export async function sendSlackMessage(channel: string, text: string): Promise<{ success: boolean; error?: string }> {
  const result = await slackApi('chat.postMessage', { channel, text })
  return result.ok ? { success: true } : { success: false, error: String(result.error) }
}

export async function sendSlackDigest(email: string, insights: Insight[]): Promise<{ success: boolean; error?: string }> {
  const userResult = await slackApi('users.lookupByEmail', { email })
  if (!userResult.ok) return { success: false, error: `Slack user not found for ${email}` }

  const slackUserId = (userResult.user as { id: string }).id
  const lines = insights.map(i => {
    const icon = i.severity === 'critical' ? ':red_circle:' : i.severity === 'warning' ? ':large_orange_circle:' : ':large_blue_circle:'
    return `${icon} *${i.title}*\n${i.body}`
  })

  const text = `*Your Yoracle digest*\n\n${lines.join('\n\n')}\n\n<https://hatchai.fairwaterlabs.com/apps/yoracle/digest|Open in Yoracle>`
  return sendSlackMessage(slackUserId, text)
}

export async function handleSlackMessage(
  slackUserId: string,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<void> {
  const email = await getSlackUserEmail(slackUserId)
  if (!email) {
    await sendSlackMessage(channel, "I couldn't find your email in Slack. Please make sure your Slack profile has an email that matches your Yoracle account.")
    return
  }

  const user = await getUserByEmail(email)
  if (!user) {
    await sendSlackMessage(channel, "I couldn't find a Yoracle account for your email. Sign up at https://hatchai.fairwaterlabs.com/apps/yoracle")
    return
  }

  const db = getSupabaseClient()
  const { data: ontology } = await db
    .from('ontologies')
    .select('*')
    .eq('org_id', user.org_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: context } = await db
    .from('user_contexts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const history: ChatMessage[] = context?.conversation_history ?? []
  const timestamp = new Date().toISOString()

  let fullResponse = ''
  for await (const chunk of streamChat(user, ontology, history, text)) {
    fullResponse += chunk
  }

  const newHistory: ChatMessage[] = [
    ...history,
    { role: 'user', content: text, timestamp },
    { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
  ]

  if (context) {
    await db.from('user_contexts').update({ conversation_history: newHistory, last_active: new Date().toISOString() }).eq('user_id', user.id)
  } else {
    await db.from('user_contexts').insert({ user_id: user.id, conversation_history: newHistory })
  }

  await slackApi('chat.postMessage', {
    channel,
    text: fullResponse,
    ...(threadTs ? { thread_ts: threadTs } : {}),
  })
}

export function stripBotMention(text: string, botUserId?: string): string {
  if (!botUserId) return text.trim()
  return text.replace(new RegExp(`<@${botUserId}>`, 'g'), '').trim()
}
