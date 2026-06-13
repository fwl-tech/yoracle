import type { KpiDefinition, Dashboard, UserRole } from '@/types'

export const KPI_DEFINITIONS: KpiDefinition[] = [
  // Revenue
  { id: 'arr', label: 'ARR', description: 'Annual Recurring Revenue', category: 'revenue', roles: ['ceo','cro','cfo','vp_sales','vp_finance'], unit: 'USD', format: 'currency' },
  { id: 'mrr', label: 'MRR', description: 'Monthly Recurring Revenue', category: 'revenue', roles: ['ceo','cro','cfo','vp_sales','vp_finance'], unit: 'USD', format: 'currency' },
  { id: 'arpu', label: 'ARPU', description: 'Average Revenue Per User', category: 'revenue', roles: ['cro','cmo','vp_sales'], unit: 'USD', format: 'currency' },
  { id: 'win-rate', label: 'Win Rate', description: 'Percentage of deals closed won', category: 'revenue', roles: ['cro','vp_sales'], unit: '%', format: 'percentage' },
  { id: 'pipeline-coverage', label: 'Pipeline Coverage', description: 'Pipeline / Quota ratio', category: 'revenue', roles: ['cro','vp_sales'], unit: 'x', format: 'number' },
  // Customer
  { id: 'customer-count', label: 'Active Customers', description: 'Total active paying customers', category: 'customer', roles: ['ceo','cco','cro','vp_customer_success'], unit: '', format: 'number' },
  { id: 'churn-rate', label: 'Churn Rate', description: 'Monthly customer churn rate', category: 'customer', roles: ['ceo','cco','vp_customer_success'], unit: '%', format: 'percentage' },
  { id: 'nrr', label: 'NRR', description: 'Net Revenue Retention', category: 'customer', roles: ['ceo','cco','cfo','vp_customer_success'], unit: '%', format: 'percentage' },
  { id: 'nps', label: 'NPS', description: 'Net Promoter Score', category: 'customer', roles: ['cco','cmo','vp_customer_success'], unit: '', format: 'number' },
  // Profitability
  { id: 'gross-margin', label: 'Gross Margin', description: 'Gross profit as % of revenue', category: 'profitability', roles: ['ceo','cfo','coo','vp_finance'], unit: '%', format: 'percentage' },
  { id: 'ebitda', label: 'EBITDA', description: 'Earnings before interest, taxes, depreciation', category: 'profitability', roles: ['ceo','cfo','vp_finance'], unit: 'USD', format: 'currency' },
  { id: 'cac', label: 'CAC', description: 'Customer Acquisition Cost', category: 'profitability', roles: ['cmo','cfo','vp_marketing','vp_finance'], unit: 'USD', format: 'currency' },
  { id: 'ltv', label: 'LTV', description: 'Customer Lifetime Value', category: 'profitability', roles: ['ceo','cmo','cfo','vp_marketing'], unit: 'USD', format: 'currency' },
  { id: 'ltv-cac', label: 'LTV:CAC', description: 'Lifetime value to acquisition cost ratio', category: 'profitability', roles: ['ceo','cmo','cfo'], unit: 'x', format: 'number' },
  // Operations
  { id: 'ticket-volume', label: 'Support Tickets', description: 'Open support tickets', category: 'operations', roles: ['coo','cco','vp_customer_success'], unit: '', format: 'number' },
  { id: 'ticket-resolution-time', label: 'Avg Resolution Time', description: 'Average time to resolve support tickets', category: 'operations', roles: ['coo','cco','vp_customer_success'], unit: 'hrs', format: 'duration' },
]

export const DASHBOARDS: Dashboard[] = [
  {
    id: 'revenue-health',
    label: 'Revenue Health',
    description: 'ARR, MRR, pipeline, and win rate',
    roles: ['ceo','cro','cfo','vp_sales','vp_finance'],
    kpi_ids: ['arr','mrr','arpu','win-rate','pipeline-coverage'],
  },
  {
    id: 'customer-base',
    label: 'Customer Base',
    description: 'Customer count, churn, NRR, and NPS',
    roles: ['ceo','cco','cro','vp_customer_success'],
    kpi_ids: ['customer-count','churn-rate','nrr','nps'],
  },
  {
    id: 'profitability',
    label: 'Profitability',
    description: 'Gross margin, EBITDA, CAC, and LTV',
    roles: ['ceo','cfo','coo','cmo','vp_finance','vp_marketing'],
    kpi_ids: ['gross-margin','ebitda','cac','ltv','ltv-cac'],
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Support tickets, resolution time, and SLAs',
    roles: ['coo','cco','vp_customer_success'],
    kpi_ids: ['ticket-volume','ticket-resolution-time'],
  },
  {
    id: 'sales-performance',
    label: 'Sales Performance',
    description: 'Win rate, pipeline coverage, and deal velocity',
    roles: ['cro','vp_sales'],
    kpi_ids: ['win-rate','pipeline-coverage','arpu'],
  },
]

export function getDashboardsForRole(role: UserRole): Dashboard[] {
  return DASHBOARDS.filter(d => d.roles.includes(role))
}

export function getKpisForRole(role: UserRole): KpiDefinition[] {
  return KPI_DEFINITIONS.filter(k => k.roles.includes(role))
}
