import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filterInsightsByRole, generateInsights, updateInsightStatus } from '@/lib/insights'
import type { Insight, UserRole } from '@/types'

// Local mock for @/lib/ai — keeps insights tests isolated from AI client
vi.mock('@/lib/ai', () => ({
  generateInsightsForUser: vi.fn().mockResolvedValue([]),
}))

const ALL_ROLES: UserRole[] = [
  'ceo', 'cro', 'cmo', 'coo', 'cfo', 'cco',
  'vp_sales', 'vp_marketing', 'vp_operations', 'vp_finance', 'vp_customer_success', 'admin',
]

function makeInsight(category: Insight['category']): Insight {
  return {
    id: crypto.randomUUID(),
    org_id: 'org1',
    user_id: 'u1',
    title: `${category} insight`,
    body: 'body',
    category,
    severity: 'info',
    metric_refs: [],
    suggested_actions: [],
    status: 'new',
    generated_at: new Date().toISOString(),
  }
}

const ALL_INSIGHTS: Insight[] = [
  makeInsight('revenue'),
  makeInsight('customer'),
  makeInsight('profitability'),
  makeInsight('operations'),
  makeInsight('general'),
]

// ─── filterInsightsByRole ───────────────────────────────────────────────────

describe('filterInsightsByRole', () => {
  it('ceo sees all 5 categories', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'ceo')
    expect(result).toHaveLength(5)
  })

  it('admin sees all 5 categories', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'admin')
    expect(result).toHaveLength(5)
  })

  it('cro sees revenue, customer, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'cro')
    const cats = result.map(i => i.category)
    expect(cats).toContain('revenue')
    expect(cats).toContain('customer')
    expect(cats).toContain('general')
    expect(cats).not.toContain('profitability')
    expect(cats).not.toContain('operations')
  })

  it('cmo sees revenue, customer, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'cmo')
    const cats = result.map(i => i.category)
    expect(cats).toContain('revenue')
    expect(cats).toContain('customer')
    expect(cats).toContain('general')
    expect(result).toHaveLength(3)
  })

  it('coo sees operations, profitability, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'coo')
    const cats = result.map(i => i.category)
    expect(cats).toContain('operations')
    expect(cats).toContain('profitability')
    expect(cats).toContain('general')
    expect(cats).not.toContain('revenue')
    expect(cats).not.toContain('customer')
  })

  it('cfo sees profitability, revenue, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'cfo')
    const cats = result.map(i => i.category)
    expect(cats).toContain('profitability')
    expect(cats).toContain('revenue')
    expect(cats).toContain('general')
    expect(result).toHaveLength(3)
  })

  it('cco sees customer, operations, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'cco')
    const cats = result.map(i => i.category)
    expect(cats).toContain('customer')
    expect(cats).toContain('operations')
    expect(cats).toContain('general')
    expect(result).toHaveLength(3)
  })

  it('vp_sales sees revenue, customer, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'vp_sales')
    expect(result).toHaveLength(3)
  })

  it('vp_marketing sees revenue, customer, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'vp_marketing')
    expect(result).toHaveLength(3)
  })

  it('vp_operations sees operations, general (2)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'vp_operations')
    const cats = result.map(i => i.category)
    expect(cats).toContain('operations')
    expect(cats).toContain('general')
    expect(result).toHaveLength(2)
  })

  it('vp_finance sees profitability, revenue, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'vp_finance')
    expect(result).toHaveLength(3)
  })

  it('vp_customer_success sees customer, operations, general (3)', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'vp_customer_success')
    expect(result).toHaveLength(3)
  })

  it('unknown role falls back to ["general"] — only general insight returned', () => {
    const result = filterInsightsByRole(ALL_INSIGHTS, 'unknown_role' as UserRole)
    expect(result).toHaveLength(1)
    expect(result[0].category).toBe('general')
  })

  it('returns empty array when no insights match role categories', () => {
    const revenueOnly = [makeInsight('revenue')]
    const result = filterInsightsByRole(revenueOnly, 'vp_operations')
    expect(result).toHaveLength(0)
  })
})

// ─── generateInsights ───────────────────────────────────────────────────────

describe('generateInsights', () => {
  let mockDb: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    const { getSupabaseClient } = await import('@/lib/supabase')
    mockDb = vi.mocked(getSupabaseClient)
    vi.clearAllMocks()
  })

  it('returns [] when ontologyRes.data is null', async () => {
    mockDb.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })
    const result = await generateInsights('user1', 'org1', 'ceo')
    expect(result).toEqual([])
  })

  it('calls generateInsightsForUser when ontology is present and filters by role', async () => {
    const { generateInsightsForUser } = await import('@/lib/ai')
    const mockOntology = { id: 'ont1', org_id: 'org1', version: 1 }
    const rawInsights: Omit<Insight, 'id' | 'org_id' | 'user_id' | 'generated_at' | 'status'>[] = [
      { title: 'Rev insight', body: 'body', category: 'revenue', severity: 'info', metric_refs: [], suggested_actions: [] },
      { title: 'Ops insight', body: 'body', category: 'operations', severity: 'info', metric_refs: [], suggested_actions: [] },
    ]
    vi.mocked(generateInsightsForUser).mockResolvedValueOnce(rawInsights as Insight[])

    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })
    mockDb.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'ontologies') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOntology, error: null }),
          }
        }
        if (table === 'data_snapshots') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        if (table === 'connectors') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return { insert: insertMock }
      }),
    })

    const result = await generateInsights('user1', 'org1', 'coo')
    // coo sees operations + profitability + general; revenue insight should be filtered out
    expect(result.every(i => ['operations', 'profitability', 'general'].includes(i.category))).toBe(true)
    expect(generateInsightsForUser).toHaveBeenCalled()
  })
})

// ─── updateInsightStatus ────────────────────────────────────────────────────

describe('updateInsightStatus', () => {
  it('calls supabase update with correct args', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const { getSupabaseClient } = await import('@/lib/supabase')
    vi.mocked(getSupabaseClient).mockReturnValue({
      from: vi.fn(() => ({ update: updateMock, eq: eqMock })),
    } as ReturnType<typeof getSupabaseClient>)

    await updateInsightStatus('insight-123', 'actioned')
    expect(updateMock).toHaveBeenCalledWith({ status: 'actioned' })
  })
})
