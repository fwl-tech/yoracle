import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Smoke Tests - Critical Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Health Check', () => {
    it('health endpoint responds', async () => {
      const { GET } = await import('@/app/health/route')
      const response = await GET()
      expect(response).toBeDefined()
      expect(response.data).toEqual({ status: 'ok', app: 'yoracle' })
    })
  })

  describe('Core Library Functions', () => {
    it('AI client can be instantiated', async () => {
      const { getAIClient } = await import('@/lib/ai')
      const client = getAIClient()
      expect(client).toBeDefined()
    })

    it('Supabase client can be instantiated', async () => {
      const { getSupabaseClient } = await import('@/lib/supabase')
      const client = getSupabaseClient()
      expect(client).toBeDefined()
    })

    it('encryption/decryption works', async () => {
      const { encryptAuthConfig, decryptAuthConfig } = await import('@/lib/encrypt')
      const data = { token: 'secret123' }
      const encrypted = encryptAuthConfig(data, 'test-key-32-characters-long!!!')
      const decrypted = decryptAuthConfig(encrypted, 'test-key-32-characters-long!!!')
      expect(decrypted).toEqual(data)
    })
  })

  describe('Connectors', () => {
    it('SUPPORTED_CONNECTORS is defined and has expected systems', async () => {
      const { SUPPORTED_CONNECTORS } = await import('@/lib/connectors')
      expect(SUPPORTED_CONNECTORS.length).toBeGreaterThan(0)
      const ids = SUPPORTED_CONNECTORS.map((c: { id: string }) => c.id)
      expect(ids).toContain('salesforce')
      expect(ids).toContain('hubspot')
    })

    it('each connector has required fields', async () => {
      const { SUPPORTED_CONNECTORS } = await import('@/lib/connectors')
      for (const connector of SUPPORTED_CONNECTORS) {
        expect(connector.required_fields).toBeDefined()
        expect(connector.required_fields.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Dashboards', () => {
    it('KPI_DEFINITIONS has expected KPIs', async () => {
      const { KPI_DEFINITIONS } = await import('@/lib/dashboards')
      expect(KPI_DEFINITIONS.length).toBe(16)
      const ids = KPI_DEFINITIONS.map((k: { id: string }) => k.id)
      expect(ids).toContain('arr')
      expect(ids).toContain('mrr')
      expect(ids).toContain('customer-count')
    })

    it('DASHBOARDS has expected dashboards', async () => {
      const { DASHBOARDS } = await import('@/lib/dashboards')
      expect(DASHBOARDS.length).toBe(5)
      const ids = DASHBOARDS.map((d: { id: string }) => d.id)
      expect(ids).toContain('revenue-health')
      expect(ids).toContain('customer-base')
    })

    it('getDashboardsForRole returns correct dashboards for CEO', async () => {
      const { getDashboardsForRole } = await import('@/lib/dashboards')
      const dashboards = getDashboardsForRole('ceo')
      expect(dashboards.length).toBeGreaterThan(0)
      const ids = dashboards.map((d: { id: string }) => d.id)
      expect(ids).toContain('revenue-health')
    })
  })

  describe('Insights', () => {
    it('filterInsightsByRole works for different roles', async () => {
      const { filterInsightsByRole } = await import('@/lib/insights')
      const mockInsights = [
        { id: '1', category: 'revenue', title: 'Test', body: 'Test', severity: 'info', metric_refs: [], suggested_actions: [], status: 'new', org_id: 'org1', user_id: 'u1', generated_at: '2026-01-01' },
        { id: '2', category: 'operations', title: 'Test', body: 'Test', severity: 'info', metric_refs: [], suggested_actions: [], status: 'new', org_id: 'org1', user_id: 'u1', generated_at: '2026-01-01' },
      ]
      const ceoInsights = filterInsightsByRole(mockInsights, 'ceo')
      expect(ceoInsights.length).toBe(2)

      const vp_ops_insights = filterInsightsByRole(mockInsights, 'vp_operations')
      expect(vp_ops_insights.length).toBe(1)
      expect(vp_ops_insights[0].category).toBe('operations')
    })
  })

  describe('Ontology', () => {
    it('ONBOARDING_QUESTIONS has expected questions', async () => {
      const { ONBOARDING_QUESTIONS } = await import('@/lib/ontology')
      expect(ONBOARDING_QUESTIONS.length).toBe(6)
    })

    it('applyOnboardingAnswer works for customer type', async () => {
      const { applyOnboardingAnswer } = await import('@/lib/ontology')
      const result = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
      expect(result.customer_definition).toEqual({ 'q-customer-type': 'B2B' })
    })

    it('evaluateCompleteness calculates completion percentage', async () => {
      const { evaluateCompleteness, applyOnboardingAnswer } = await import('@/lib/ontology')
      const emptyOntology = {}
      const emptyResult = evaluateCompleteness(emptyOntology)
      expect(emptyResult.completion_pct).toBe(0)
      expect(emptyResult.complete).toBe(false)

      const partialOntology = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
      const partialResult = evaluateCompleteness(partialOntology)
      expect(partialResult.completion_pct).toBe(30)
    })
  })

  describe('Workflow Triggers', () => {
    it('triggerWorkflowAction returns error for unsupported systems', async () => {
      const { triggerWorkflowAction } = await import('@/lib/connectors')
      const { encryptAuthConfig } = await import('@/lib/encrypt')
      
      const authConfig = { account_id: 'NS123', consumer_key: 'ck', consumer_secret: 'cs', token_id: 'ti', token_secret: 'ts' }
      const encrypted = encryptAuthConfig(authConfig, 'test-encryption-key-32-chars-long!')
      
      const result = await triggerWorkflowAction('netsuite', 'create_task', {}, encrypted)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/netsuite/i)
    })
  })
})
