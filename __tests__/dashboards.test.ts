import { describe, it, expect } from 'vitest'
import { KPI_DEFINITIONS, DASHBOARDS, getDashboardsForRole, getKpisForRole } from '@/lib/dashboards'
import type { UserRole } from '@/types'

const ALL_ROLES: UserRole[] = [
  'ceo', 'cro', 'cmo', 'coo', 'cfo', 'cco',
  'vp_sales', 'vp_marketing', 'vp_operations', 'vp_finance', 'vp_customer_success', 'admin',
]

// ─── KPI_DEFINITIONS integrity ─────────────────────────────────────────────

describe('KPI_DEFINITIONS', () => {
  it('has exactly 16 definitions', () => {
    expect(KPI_DEFINITIONS).toHaveLength(16)
  })

  it('all ids are unique', () => {
    const ids = KPI_DEFINITIONS.map(k => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all formats are valid', () => {
    const valid = ['currency', 'percentage', 'number', 'duration']
    for (const k of KPI_DEFINITIONS) {
      expect(valid).toContain(k.format)
    }
  })

  it('all categories are valid', () => {
    const valid = ['revenue', 'customer', 'profitability', 'operations']
    for (const k of KPI_DEFINITIONS) {
      expect(valid).toContain(k.category)
    }
  })

  it('each KPI has at least one role assigned', () => {
    for (const k of KPI_DEFINITIONS) {
      expect(k.roles.length).toBeGreaterThan(0)
    }
  })
})

// ─── DASHBOARDS integrity ───────────────────────────────────────────────────

describe('DASHBOARDS', () => {
  it('has exactly 5 dashboards', () => {
    expect(DASHBOARDS).toHaveLength(5)
  })

  it('all dashboard ids are unique', () => {
    const ids = DASHBOARDS.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all kpi_ids in dashboards reference valid KPI ids', () => {
    const kpiIds = new Set(KPI_DEFINITIONS.map(k => k.id))
    for (const d of DASHBOARDS) {
      for (const kid of d.kpi_ids) {
        expect(kpiIds.has(kid), `Dashboard "${d.id}" references unknown KPI id "${kid}"`).toBe(true)
      }
    }
  })

  it('each dashboard has at least one role', () => {
    for (const d of DASHBOARDS) {
      expect(d.roles.length).toBeGreaterThan(0)
    }
  })
})

// ─── getDashboardsForRole ───────────────────────────────────────────────────

describe('getDashboardsForRole', () => {
  it('ceo gets all 4 cross-functional dashboards', () => {
    const result = getDashboardsForRole('ceo')
    const ids = result.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('customer-base')
    expect(ids).toContain('profitability')
    // CEO is not in operations or sales-performance
    expect(ids).not.toContain('operations')
    expect(ids).not.toContain('sales-performance')
  })

  it('cro gets revenue-health, customer-base, and sales-performance', () => {
    const result = getDashboardsForRole('cro')
    const ids = result.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('customer-base')
    expect(ids).toContain('sales-performance')
  })

  it('cfo gets revenue-health and profitability', () => {
    const result = getDashboardsForRole('cfo')
    const ids = result.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('profitability')
  })

  it('cmo gets profitability only', () => {
    const result = getDashboardsForRole('cmo')
    const ids = result.map(d => d.id)
    expect(ids).toContain('profitability')
    expect(ids).not.toContain('revenue-health')
  })

  it('coo gets profitability and operations', () => {
    const result = getDashboardsForRole('coo')
    const ids = result.map(d => d.id)
    expect(ids).toContain('profitability')
    expect(ids).toContain('operations')
  })

  it('cco gets customer-base and operations', () => {
    const result = getDashboardsForRole('cco')
    const ids = result.map(d => d.id)
    expect(ids).toContain('customer-base')
    expect(ids).toContain('operations')
  })

  it('vp_sales gets revenue-health and sales-performance', () => {
    const result = getDashboardsForRole('vp_sales')
    const ids = result.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('sales-performance')
  })

  it('vp_marketing gets profitability', () => {
    const result = getDashboardsForRole('vp_marketing')
    const ids = result.map(d => d.id)
    expect(ids).toContain('profitability')
  })

  it('vp_finance gets revenue-health and profitability', () => {
    const result = getDashboardsForRole('vp_finance')
    const ids = result.map(d => d.id)
    expect(ids).toContain('revenue-health')
    expect(ids).toContain('profitability')
  })

  it('vp_customer_success gets customer-base and operations', () => {
    const result = getDashboardsForRole('vp_customer_success')
    const ids = result.map(d => d.id)
    expect(ids).toContain('customer-base')
    expect(ids).toContain('operations')
  })

  it('vp_operations returns no dashboards', () => {
    const result = getDashboardsForRole('vp_operations')
    expect(result).toHaveLength(0)
  })

  it('admin returns no dashboards', () => {
    const result = getDashboardsForRole('admin')
    expect(result).toHaveLength(0)
  })
})

// ─── getKpisForRole ─────────────────────────────────────────────────────────

describe('getKpisForRole', () => {
  it('ceo gets arr, mrr, customer-count, churn-rate, nrr, gross-margin, ebitda, ltv, ltv-cac', () => {
    const result = getKpisForRole('ceo')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arr')
    expect(ids).toContain('mrr')
    expect(ids).toContain('customer-count')
    expect(ids).toContain('nrr')
    expect(ids).toContain('gross-margin')
    expect(ids).toContain('ebitda')
    expect(ids).toContain('ltv')
    expect(ids).toContain('ltv-cac')
  })

  it('cro gets revenue and customer KPIs', () => {
    const result = getKpisForRole('cro')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arr')
    expect(ids).toContain('arpu')
    expect(ids).toContain('win-rate')
    expect(ids).toContain('customer-count')
    expect(ids).toContain('nrr')
  })

  it('cfo gets financial KPIs', () => {
    const result = getKpisForRole('cfo')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arr')
    expect(ids).toContain('mrr')
    expect(ids).toContain('nrr')
    expect(ids).toContain('gross-margin')
    expect(ids).toContain('ebitda')
    expect(ids).toContain('cac')
    expect(ids).toContain('ltv')
    expect(ids).toContain('ltv-cac')
  })

  it('coo gets operational and profitability KPIs', () => {
    const result = getKpisForRole('coo')
    const ids = result.map(k => k.id)
    expect(ids).toContain('gross-margin')
    expect(ids).toContain('ticket-volume')
    expect(ids).toContain('ticket-resolution-time')
  })

  it('cco gets customer and operations KPIs', () => {
    const result = getKpisForRole('cco')
    const ids = result.map(k => k.id)
    expect(ids).toContain('customer-count')
    expect(ids).toContain('churn-rate')
    expect(ids).toContain('nrr')
    expect(ids).toContain('nps')
    expect(ids).toContain('ticket-volume')
  })

  it('cmo gets marketing KPIs', () => {
    const result = getKpisForRole('cmo')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arpu')
    expect(ids).toContain('cac')
    expect(ids).toContain('ltv')
    expect(ids).toContain('ltv-cac')
    expect(ids).toContain('nps')
  })

  it('vp_sales gets sales KPIs', () => {
    const result = getKpisForRole('vp_sales')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arr')
    expect(ids).toContain('mrr')
    expect(ids).toContain('arpu')
    expect(ids).toContain('win-rate')
    expect(ids).toContain('pipeline-coverage')
  })

  it('vp_marketing gets marketing KPIs', () => {
    const result = getKpisForRole('vp_marketing')
    const ids = result.map(k => k.id)
    expect(ids).toContain('cac')
    expect(ids).toContain('ltv')
  })

  it('vp_finance gets financial KPIs', () => {
    const result = getKpisForRole('vp_finance')
    const ids = result.map(k => k.id)
    expect(ids).toContain('arr')
    expect(ids).toContain('mrr')
    expect(ids).toContain('gross-margin')
    expect(ids).toContain('ebitda')
  })

  it('vp_customer_success gets customer + ops KPIs', () => {
    const result = getKpisForRole('vp_customer_success')
    const ids = result.map(k => k.id)
    expect(ids).toContain('customer-count')
    expect(ids).toContain('churn-rate')
    expect(ids).toContain('nrr')
    expect(ids).toContain('nps')
    expect(ids).toContain('ticket-volume')
    expect(ids).toContain('ticket-resolution-time')
  })

  it('vp_operations returns no KPIs', () => {
    const result = getKpisForRole('vp_operations')
    expect(result).toHaveLength(0)
  })

  it('admin returns no KPIs', () => {
    const result = getKpisForRole('admin')
    expect(result).toHaveLength(0)
  })

  it('all 12 roles return an array (no throws)', () => {
    for (const role of ALL_ROLES) {
      expect(() => getKpisForRole(role)).not.toThrow()
    }
  })
})
