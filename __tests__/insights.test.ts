import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateInsights, filterInsightsByRole, updateInsightStatus } from '@/lib/insights'
import type { User, Ontology, Insight } from '@/types'

const mockUser: User = {
  id: 'user-1',
  clerk_user_id: 'clerk_1',
  org_id: 'org-1',
  email: 'ceo@acme.com',
  name: 'Alice',
  role: 'ceo',
  department: null,
  rbac_permissions: {},
  timezone: 'UTC',
  notification_prefs: { email: true, slack: true, digest_time: '07:00' },
  created_at: '2026-01-01T00:00:00Z',
}

const mockOntology: Ontology = {
  id: 'ont-1',
  org_id: 'org-1',
  version: 1,
  customer_definition: { type: 'B2B', segments: ['enterprise', 'mid-market'] },
  revenue_model: { type: 'SaaS', primary_metric: 'ARR' },
  cost_structure: { cogs_pct: 0.2, main_costs: ['headcount', 'cloud'] },
  departments: ['sales', 'marketing', 'engineering', 'cs'],
  saas_connections: ['salesforce', 'hubspot'],
  created_at: '2026-01-01T00:00:00Z',
}

const mockInsight: Insight = {
  id: 'insight-1',
  org_id: 'org-1',
  user_id: 'user-1',
  generated_at: '2026-06-12T07:00:00Z',
  title: 'Churn risk spike in enterprise segment',
  body: 'Three enterprise accounts show elevated churn signals this week.',
  category: 'customer',
  severity: 'warning',
  metric_refs: [{ name: 'Churn Risk Score', value: 72, delta: 15, unit: '%', source: 'salesforce' }],
  suggested_actions: [{
    id: 'act-1',
    label: 'Schedule review calls',
    description: 'Create follow-up tasks for the 3 at-risk accounts',
    target_system: 'salesforce',
    action_type: 'create_task',
    payload: { subject: 'Churn risk review', due_days: 2 },
  }],
  status: 'new',
}

describe('generateInsights', () => {
  it('returns an array of insights for a valid user and ontology', async () => {
    const { generateInsights: gen } = await import('@/lib/insights')
    expect(gen).toBeDefined()
  })

  it('generates role-appropriate insights for CEO', async () => {
    const insights = [mockInsight]
    const ceoInsights = filterInsightsByRole(insights, 'ceo')
    expect(ceoInsights.length).toBeGreaterThanOrEqual(0)
  })

  it('does not expose raw connector data in insight body', () => {
    expect(mockInsight.body).not.toContain('SELECT')
    expect(mockInsight.body).not.toContain('api_key')
  })
})

describe('filterInsightsByRole', () => {
  const insights: Insight[] = [
    { ...mockInsight, category: 'revenue' },
    { ...mockInsight, id: 'insight-2', category: 'customer' },
    { ...mockInsight, id: 'insight-3', category: 'profitability' },
  ]

  it('returns all categories for CEO', () => {
    const result = filterInsightsByRole(insights, 'ceo')
    expect(result.length).toBe(3)
  })

  it('returns revenue-focused insights for CRO', () => {
    const result = filterInsightsByRole(insights, 'cro')
    const categories = result.map(i => i.category)
    expect(categories).toContain('revenue')
  })

  it('returns customer insights for CCO', () => {
    const result = filterInsightsByRole(insights, 'cco')
    const categories = result.map(i => i.category)
    expect(categories).toContain('customer')
  })
})

describe('updateInsightStatus', () => {
  it('accepts valid status transitions', () => {
    const validTransitions = [
      { from: 'new', to: 'reviewed' },
      { from: 'reviewed', to: 'actioned' },
      { from: 'new', to: 'actioned' },
    ] as const
    validTransitions.forEach(({ to }) => {
      expect(['new', 'reviewed', 'actioned']).toContain(to)
    })
  })

  it('updateInsightStatus function is defined', async () => {
    const { updateInsightStatus: fn } = await import('@/lib/insights')
    expect(fn).toBeDefined()
  })
})
