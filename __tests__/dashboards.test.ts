import { describe, it, expect } from 'vitest'
import { getDashboardsForRole, KPI_DEFINITIONS, DASHBOARDS } from '@/lib/dashboards'
import type { UserRole, KpiDefinition } from '@/types'

describe('getDashboardsForRole', () => {
  const roles: UserRole[] = ['ceo', 'cro', 'cmo', 'coo', 'cfo', 'cco']

  it('returns at least one dashboard for every C-suite role', () => {
    roles.forEach(role => {
      const dashboards = getDashboardsForRole(role)
      expect(dashboards.length).toBeGreaterThan(0)
    })
  })

  it('CEO sees all three core dashboards', () => {
    const dashboards = getDashboardsForRole('ceo')
    const ids = dashboards.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('customer-base')
    expect(ids).toContain('profitability')
  })

  it('CRO sees revenue-health dashboard', () => {
    const dashboards = getDashboardsForRole('cro')
    expect(dashboards.some(d => d.id === 'revenue-health')).toBe(true)
  })

  it('CFO sees profitability dashboard', () => {
    const dashboards = getDashboardsForRole('cfo')
    expect(dashboards.some(d => d.id === 'profitability')).toBe(true)
  })

  it('CCO sees customer-base dashboard', () => {
    const dashboards = getDashboardsForRole('cco')
    expect(dashboards.some(d => d.id === 'customer-base')).toBe(true)
  })
})

describe('KPI_DEFINITIONS', () => {
  it('every KPI has required fields', () => {
    KPI_DEFINITIONS.forEach((kpi: KpiDefinition) => {
      expect(kpi.id).toBeTruthy()
      expect(kpi.label).toBeTruthy()
      expect(kpi.roles.length).toBeGreaterThan(0)
      expect(['currency', 'percentage', 'number', 'duration']).toContain(kpi.format)
    })
  })

  it('includes ARR for revenue-facing roles', () => {
    const arr = KPI_DEFINITIONS.find(k => k.id === 'arr')
    expect(arr).toBeDefined()
    expect(arr!.roles).toContain('ceo')
    expect(arr!.roles).toContain('cro')
    expect(arr!.roles).toContain('cfo')
  })

  it('includes churn rate for customer-facing roles', () => {
    const churn = KPI_DEFINITIONS.find(k => k.id === 'churn-rate')
    expect(churn).toBeDefined()
    expect(churn!.roles).toContain('cco')
  })
})
