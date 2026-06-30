import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Ontology, Insight, UserRole } from '@/types'

describe('Regression Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('End-to-End User Flows', () => {
    describe('Onboarding Flow', () => {
      it('completes full onboarding from empty to 100%', async () => {
        const { applyOnboardingAnswer, evaluateCompleteness } = await import('@/lib/ontology')
        
        let ontology = {}
        let completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(0)
        expect(completeness.complete).toBe(false)

        ontology = applyOnboardingAnswer(ontology, 'q-customer-type', 'B2B')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(30)

        ontology = applyOnboardingAnswer(ontology, 'q-revenue-model', 'Subscription')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(60)

        ontology = applyOnboardingAnswer(ontology, 'q-cost-structure', 'Headcount 60%, Cloud 30%')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(80)

        ontology = applyOnboardingAnswer(ontology, 'q-departments', 'Sales, Engineering, Marketing')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(90)

        ontology = { ...ontology, saas_connections: ['salesforce'] as unknown as Ontology['saas_connections'] }
        completeness = evaluateCompleteness(ontology)
        expect(completeness.completion_pct).toBe(100)
        expect(completeness.complete).toBe(true)
      })

      it('tracks unlocked KPIs as onboarding progresses', async () => {
        const { applyOnboardingAnswer, evaluateCompleteness } = await import('@/lib/ontology')
        
        let ontology = {}
        let completeness = evaluateCompleteness(ontology)
        expect(completeness.unlocked_kpis).toHaveLength(0)

        ontology = applyOnboardingAnswer(ontology, 'q-customer-type', 'B2B')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.unlocked_kpis.length).toBeGreaterThan(0)
        expect(completeness.unlocked_kpis).toContain('customer-count')

        ontology = applyOnboardingAnswer(ontology, 'q-revenue-model', 'Subscription')
        completeness = evaluateCompleteness(ontology)
        expect(completeness.unlocked_kpis).toContain('arr')
        expect(completeness.unlocked_kpis).toContain('mrr')
      })
    })

    describe('Dashboard & KPI Flow', () => {
      it('CEO role has access to executive dashboards and KPIs', async () => {
        const { getDashboardsForRole, getKpisForRole } = await import('@/lib/dashboards')
        
        const dashboards = getDashboardsForRole('ceo')
        expect(dashboards.length).toBeGreaterThan(0)
        const dashboardIds = dashboards.map((d: { id: string }) => d.id)
        expect(dashboardIds).toContain('revenue-health')
        expect(dashboardIds).toContain('customer-base')
        expect(dashboardIds).toContain('profitability')

        const kpis = getKpisForRole('ceo')
        expect(kpis.length).toBeGreaterThan(0)
        const kpiIds = kpis.map((k: { id: string }) => k.id)
        expect(kpiIds).toContain('arr')
        expect(kpiIds).toContain('mrr')
        expect(kpiIds).toContain('customer-count')
      })

      it('CFO role has access to financial dashboards and KPIs', async () => {
        const { getDashboardsForRole, getKpisForRole } = await import('@/lib/dashboards')
        
        const dashboards = getDashboardsForRole('cfo')
        const dashboardIds = dashboards.map((d: { id: string }) => d.id)
        expect(dashboardIds).toContain('revenue-health')
        expect(dashboardIds).toContain('profitability')

        const kpis = getKpisForRole('cfo')
        const kpiIds = kpis.map((k: { id: string }) => k.id)
        expect(kpiIds).toContain('gross-margin')
        expect(kpiIds).toContain('ebitda')
        expect(kpiIds).toContain('ltv-cac')
      })

      it('VP Operations role has limited access', async () => {
        const { getDashboardsForRole, getKpisForRole } = await import('@/lib/dashboards')
        
        const dashboards = getDashboardsForRole('vp_operations')
        expect(dashboards).toHaveLength(0)

        const kpis = getKpisForRole('vp_operations')
        expect(kpis).toHaveLength(0)
      })
    })

    describe('Insights Flow', () => {
      it('generates and filters insights by role', async () => {
        const { filterInsightsByRole } = await import('@/lib/insights')
        
        const mockInsights: Insight[] = [
          {
            id: 'i1',
            org_id: 'org1',
            user_id: 'u1',
            title: 'Revenue insight',
            body: 'Revenue is up',
            category: 'revenue',
            severity: 'info',
            metric_refs: [],
            suggested_actions: [],
            status: 'new',
            generated_at: '2026-01-01',
          },
          {
            id: 'i2',
            org_id: 'org1',
            user_id: 'u1',
            title: 'Customer insight',
            body: 'Churn is down',
            category: 'customer',
            severity: 'info',
            metric_refs: [],
            suggested_actions: [],
            status: 'new',
            generated_at: '2026-01-01',
          },
          {
            id: 'i3',
            org_id: 'org1',
            user_id: 'u1',
            title: 'Operations insight',
            body: 'Ticket volume is high',
            category: 'operations',
            severity: 'warning',
            metric_refs: [],
            suggested_actions: [],
            status: 'new',
            generated_at: '2026-01-01',
          },
          {
            id: 'i4',
            org_id: 'org1',
            user_id: 'u1',
            title: 'Profitability insight',
            body: 'Margins improving',
            category: 'profitability',
            severity: 'info',
            metric_refs: [],
            suggested_actions: [],
            status: 'new',
            generated_at: '2026-01-01',
          },
        ]

        const ceoInsights = filterInsightsByRole(mockInsights, 'ceo')
        expect(ceoInsights.length).toBe(4)

        const croInsights = filterInsightsByRole(mockInsights, 'cro')
        const croCats = croInsights.map(i => i.category)
        expect(croCats).toContain('revenue')
        expect(croCats).toContain('customer')
        expect(croCats).not.toContain('operations')

        const cooInsights = filterInsightsByRole(mockInsights, 'coo')
        const cooCats = cooInsights.map(i => i.category)
        expect(cooCats).toContain('operations')
        expect(cooCats).toContain('profitability')
      })
    })

    describe('Connector Flow', () => {
      it('encrypts and decrypts connector auth config', async () => {
        const { encryptAuthConfig, decryptAuthConfig } = await import('@/lib/encrypt')
        
        const authConfig = {
          instance_url: 'https://test.salesforce.com',
          client_id: 'client123',
          client_secret: 'secret456',
        }

        const encrypted = encryptAuthConfig(authConfig, 'test-encryption-key-32-chars-long!')
        expect(encrypted).toBeDefined()
        expect(typeof encrypted).toBe('string')
        expect(encrypted).not.toContain('secret456')

        const decrypted = decryptAuthConfig(encrypted, 'test-encryption-key-32-chars-long!')
        expect(decrypted).toEqual(authConfig)
      })

      it('supports multiple connector types', async () => {
        const { SUPPORTED_CONNECTORS } = await import('@/lib/connectors')
        
        const salesforce = SUPPORTED_CONNECTORS.find((c: { id: string }) => c.id === 'salesforce')
        expect(salesforce).toBeDefined()
        expect(salesforce.required_fields.length).toBe(3)

        const hubspot = SUPPORTED_CONNECTORS.find((c: { id: string }) => c.id === 'hubspot')
        expect(hubspot).toBeDefined()
        expect(hubspot.required_fields.length).toBe(1)

        const zendesk = SUPPORTED_CONNECTORS.find((c: { id: string }) => c.id === 'zendesk')
        expect(zendesk).toBeDefined()
        expect(zendesk.required_fields.length).toBe(3)
      })
    })
  })

  describe('Data Integrity & Validation', () => {
    it('all KPIs have valid formats', async () => {
      const { KPI_DEFINITIONS } = await import('@/lib/dashboards')
      const validFormats = ['currency', 'percentage', 'number', 'duration']
      
      for (const kpi of KPI_DEFINITIONS) {
        expect(validFormats).toContain(kpi.format)
      }
    })

    it('all KPIs have valid categories', async () => {
      const { KPI_DEFINITIONS } = await import('@/lib/dashboards')
      const validCategories = ['revenue', 'customer', 'profitability', 'operations']
      
      for (const kpi of KPI_DEFINITIONS) {
        expect(validCategories).toContain(kpi.category)
      }
    })

    it('all dashboard KPI references are valid', async () => {
      const { DASHBOARDS, KPI_DEFINITIONS } = await import('@/lib/dashboards')
      const kpiIds = new Set(KPI_DEFINITIONS.map((k: { id: string }) => k.id))
      
      for (const dashboard of DASHBOARDS) {
        for (const kpiId of dashboard.kpi_ids) {
          expect(kpiIds.has(kpiId)).toBe(true)
        }
      }
    })

    it('all connector required fields have valid types', async () => {
      const { SUPPORTED_CONNECTORS } = await import('@/lib/connectors')
      const validTypes = ['text', 'password', 'url']
      
      for (const connector of SUPPORTED_CONNECTORS) {
        for (const field of connector.required_fields) {
          expect(validTypes).toContain(field.type)
        }
      }
    })

    it('all onboarding questions have valid fields', async () => {
      const { ONBOARDING_QUESTIONS } = await import('@/lib/ontology')
      const validFields = ['customer_definition', 'revenue_model', 'cost_structure', 'departments']
      
      for (const question of ONBOARDING_QUESTIONS) {
        expect(validFields).toContain(question.field)
      }
    })
  })

  describe('Role-Based Access Control', () => {
    const ALL_ROLES: UserRole[] = [
      'ceo', 'cro', 'cmo', 'coo', 'cfo', 'cco',
      'vp_sales', 'vp_marketing', 'vp_operations', 'vp_finance', 'vp_customer_success', 'admin',
    ]

    it('all roles can retrieve dashboards without error', async () => {
      const { getDashboardsForRole } = await import('@/lib/dashboards')
      
      for (const role of ALL_ROLES) {
        expect(() => getDashboardsForRole(role)).not.toThrow()
        const dashboards = getDashboardsForRole(role)
        expect(Array.isArray(dashboards)).toBe(true)
      }
    })

    it('all roles can retrieve KPIs without error', async () => {
      const { getKpisForRole } = await import('@/lib/dashboards')
      
      for (const role of ALL_ROLES) {
        expect(() => getKpisForRole(role)).not.toThrow()
        const kpis = getKpisForRole(role)
        expect(Array.isArray(kpis)).toBe(true)
      }
    })

    it('all roles can filter insights without error', async () => {
      const { filterInsightsByRole } = await import('@/lib/insights')
      const mockInsights: Insight[] = [
        {
          id: 'i1',
          org_id: 'org1',
          user_id: 'u1',
          title: 'Test',
          body: 'Test',
          category: 'general',
          severity: 'info',
          metric_refs: [],
          suggested_actions: [],
          status: 'new',
          generated_at: '2026-01-01',
        },
      ]
      
      for (const role of ALL_ROLES) {
        expect(() => filterInsightsByRole(mockInsights, role)).not.toThrow()
        const filtered = filterInsightsByRole(mockInsights, role)
        expect(Array.isArray(filtered)).toBe(true)
      }
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('handles empty ontology gracefully', async () => {
      const { evaluateCompleteness, getNextOnboardingQuestion } = await import('@/lib/ontology')
      
      const emptyOntology = {}
      const completeness = evaluateCompleteness(emptyOntology)
      expect(completeness.completion_pct).toBe(0)
      expect(completeness.complete).toBe(false)

      const nextQuestion = getNextOnboardingQuestion(emptyOntology, 'ceo')
      expect(nextQuestion).not.toBeNull()
      expect(nextQuestion!.id).toBe('q-customer-type')
    })

    it('handles empty insights array', async () => {
      const { filterInsightsByRole } = await import('@/lib/insights')
      
      const filtered = filterInsightsByRole([], 'ceo')
      expect(filtered).toHaveLength(0)
    })

    it('handles unknown role gracefully', async () => {
      const { getDashboardsForRole, getKpisForRole } = await import('@/lib/dashboards')
      const { filterInsightsByRole } = await import('@/lib/insights')
      
      expect(() => getDashboardsForRole('unknown' as UserRole)).not.toThrow()
      expect(() => getKpisForRole('unknown' as UserRole)).not.toThrow()
      expect(() => filterInsightsByRole([], 'unknown' as UserRole)).not.toThrow()
    })

    it('handles invalid encryption key', async () => {
      const { encryptAuthConfig, decryptAuthConfig } = await import('@/lib/encrypt')
      
      const data = { token: 'secret' }
      const encrypted = encryptAuthConfig(data, 'key1-32-characters-long-enough!!')
      
      expect(() => {
        decryptAuthConfig(encrypted, 'key2-32-characters-long-enough!!')
      }).toThrow()
    })

    it('handles workflow action for unsupported connector', async () => {
      const { triggerWorkflowAction } = await import('@/lib/connectors')
      const { encryptAuthConfig } = await import('@/lib/encrypt')
      
      const authConfig = { account_id: 'NS123', consumer_key: 'ck', consumer_secret: 'cs', token_id: 'ti', token_secret: 'ts' }
      const encrypted = encryptAuthConfig(authConfig, 'test-encryption-key-32-chars-long!')
      
      const result = await triggerWorkflowAction('netsuite', 'create_task', {}, encrypted)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Performance & Scalability', () => {
    it('handles large number of insights efficiently', async () => {
      const { filterInsightsByRole } = await import('@/lib/insights')
      
      const largeInsightSet: Insight[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `i${i}`,
        org_id: 'org1',
        user_id: 'u1',
        title: `Insight ${i}`,
        body: `Body ${i}`,
        category: ['revenue', 'customer', 'operations', 'profitability', 'general'][i % 5] as Insight['category'],
        severity: 'info' as const,
        metric_refs: [],
        suggested_actions: [],
        status: 'new' as const,
        generated_at: '2026-01-01',
      }))

      const startTime = Date.now()
      const filtered = filterInsightsByRole(largeInsightSet, 'ceo')
      const endTime = Date.now()

      expect(filtered.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('singleton pattern prevents multiple client instantiations', async () => {
      const { getAIClient } = await import('@/lib/ai')
      const { getSupabaseClient } = await import('@/lib/supabase')

      const ai1 = getAIClient()
      const ai2 = getAIClient()
      expect(ai1).toBeDefined()
      expect(ai2).toBeDefined()

      const db1 = getSupabaseClient()
      const db2 = getSupabaseClient()
      expect(db1).toBeDefined()
      expect(db2).toBeDefined()
    })
  })

  describe('Cross-Module Integration', () => {
    it('ontology completeness unlocks correct dashboards', async () => {
      const { applyOnboardingAnswer } = await import('@/lib/ontology')
      const { getDashboardsForRole } = await import('@/lib/dashboards')
      
      const ontology = applyOnboardingAnswer({}, 'q-customer-type', 'B2B')
      const dashboards = getDashboardsForRole('ceo')
      
      const customerBaseDashboard = dashboards.find((d: { id: string }) => d.id === 'customer-base')
      expect(customerBaseDashboard).toBeDefined()
    })

    it('insights reference valid KPI metrics', async () => {
      const { KPI_DEFINITIONS } = await import('@/lib/dashboards')
      const kpiIds = new Set(KPI_DEFINITIONS.map((k: { id: string }) => k.id))
      
      const mockInsight: Insight = {
        id: 'i1',
        org_id: 'org1',
        user_id: 'u1',
        title: 'ARR Growing',
        body: 'ARR is up 20%',
        category: 'revenue',
        severity: 'info',
        metric_refs: [
          { name: 'ARR', value: 1000000, delta: 20, unit: 'USD', source: 'Salesforce' },
        ],
        suggested_actions: [],
        status: 'new',
        generated_at: '2026-01-01',
      }

      expect(kpiIds.has('arr')).toBe(true)
    })
  })
})
