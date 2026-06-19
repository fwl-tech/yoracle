'use client'

import { useState } from 'react'
import KpiSparkline from '@/components/KpiSparkline'
import type { Dashboard, KpiData } from '@/types'

function formatValue(value: number, format: string, unit: string): string {
  if (format === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)
  if (format === 'percentage') return `${value.toFixed(1)}%`
  if (format === 'number') return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
  return `${value}${unit}`
}

const TIME_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
]

const SEGMENTS = ['All segments', 'Enterprise', 'Mid-market', 'SMB']
const BUSINESS_UNITS = ['All units', 'North America', 'EMEA', 'APAC']

interface DashboardClientProps {
  dashboard: Dashboard
  kpiData: KpiData[]
}

export default function DashboardClient({ dashboard, kpiData }: DashboardClientProps) {
  const [timeRange, setTimeRange] = useState('30d')
  const [segment, setSegment] = useState('All segments')
  const [businessUnit, setBusinessUnit] = useState('All units')
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null)

  const multiplier = timeRange === '7d' ? 0.7 : timeRange === '90d' ? 1.2 : 1

  return (
    <div className="page-main space-y-6">
      <header className="page-header !mb-4">
        <p className="section-label">Dashboard</p>
        <h1 className="page-title">{dashboard.label}</h1>
        <p className="page-subtitle">{dashboard.description}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="select-field w-full">
          {TIME_RANGES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <select value={segment} onChange={e => setSegment(e.target.value)} className="select-field w-full">
          {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={businessUnit} onChange={e => setBusinessUnit(e.target.value)} className="select-field w-full">
          {BUSINESS_UNITS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {kpiData.map(kpi => {
          const adjusted = kpi.current * multiplier
          const isPositive = kpi.delta_pct >= 0
          const isExpanded = expandedKpi === kpi.definition.id

          return (
            <button
              key={kpi.definition.id}
              onClick={() => setExpandedKpi(isExpanded ? null : kpi.definition.id)}
              className="card-interactive p-4 sm:p-5 space-y-3 text-left w-full"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="section-label !normal-case !tracking-wide">{kpi.definition.label}</p>
                  <p className="text-xl sm:text-2xl font-medium text-ink mt-1 font-heading tracking-tight">
                    {formatValue(adjusted, kpi.definition.format, kpi.definition.unit)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                  isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {isPositive ? '+' : ''}{kpi.delta_pct.toFixed(1)}%
                </span>
              </div>
              <KpiSparkline data={kpi.sparkline} positive={isPositive} />
              {isExpanded && (
                <div className="pt-2 border-t border-ink-faint/50 space-y-1">
                  <p className="text-xs text-ink-secondary">{kpi.definition.description}</p>
                  <p className="text-xs text-ink-muted">Previous: {formatValue(kpi.previous * multiplier, kpi.definition.format, kpi.definition.unit)}</p>
                  {kpi.source && <p className="text-xs text-ink-muted">Source: {kpi.source}</p>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
