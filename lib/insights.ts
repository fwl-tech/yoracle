import type { Insight, InsightStatus, UserRole } from '@/types'

const ROLE_CATEGORIES: Record<UserRole, string[]> = {
  ceo:                 ['revenue', 'customer', 'profitability', 'operations', 'general'],
  cro:                 ['revenue', 'customer', 'general'],
  cmo:                 ['revenue', 'customer', 'general'],
  coo:                 ['operations', 'profitability', 'general'],
  cfo:                 ['profitability', 'revenue', 'general'],
  cco:                 ['customer', 'operations', 'general'],
  vp_sales:            ['revenue', 'customer', 'general'],
  vp_marketing:        ['revenue', 'customer', 'general'],
  vp_operations:       ['operations', 'general'],
  vp_finance:          ['profitability', 'revenue', 'general'],
  vp_customer_success: ['customer', 'operations', 'general'],
  admin:               ['revenue', 'customer', 'profitability', 'operations', 'general'],
}

export function filterInsightsByRole(insights: Insight[], role: UserRole): Insight[] {
  const allowedCategories = ROLE_CATEGORIES[role] ?? ['general']
  return insights.filter(i => allowedCategories.includes(i.category))
}

export async function generateInsights(
  userId: string,
  orgId: string,
  role: UserRole,
): Promise<Insight[]> {
  const { generateInsightsForUser } = await import('@/lib/ai')
  const { getSupabaseClient } = await import('@/lib/supabase')
  const db = getSupabaseClient()

  const [ontologyRes, snapshotsRes] = await Promise.all([
    db.from('ontologies').select('*').eq('org_id', orgId).order('version', { ascending: false }).limit(1).single(),
    db.from('data_snapshots').select('entity_type, raw_data').eq('connector_id', orgId).order('synced_at', { ascending: false }).limit(20),
  ])

  if (!ontologyRes.data) return []

  const rawInsights = await generateInsightsForUser(
    { id: userId, org_id: orgId, role } as Parameters<typeof generateInsightsForUser>[0],
    ontologyRes.data,
    snapshotsRes.data ?? [],
  )

  const filtered = filterInsightsByRole(
    rawInsights.map(i => ({ ...i, id: crypto.randomUUID(), org_id: orgId, user_id: userId, generated_at: new Date().toISOString(), status: 'new' as InsightStatus })),
    role,
  )

  if (filtered.length > 0) {
    await db.from('insights').insert(filtered)
  }

  return filtered
}

export async function updateInsightStatus(
  insightId: string,
  status: InsightStatus,
): Promise<void> {
  const { getSupabaseClient } = await import('@/lib/supabase')
  const db = getSupabaseClient()
  await db.from('insights').update({ status }).eq('id', insightId)
}
