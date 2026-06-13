import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { DASHBOARDS, KPI_DEFINITIONS } from '@/lib/dashboards'
import type { UserRole, KpiData } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

function formatValue(value: number, format: string, unit: string): string {
  if (format === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)
  if (format === 'percentage') return `${value.toFixed(1)}%`
  if (format === 'number') return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
  return `${value}${unit}`
}

export default async function DashboardDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role, org_id').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect('/onboarding')

  const dashboard = DASHBOARDS.find(d => d.id === params.id)
  if (!dashboard || !dashboard.roles.includes(user.role as UserRole)) redirect('/dashboards')

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}${BASE}/api/dashboards/${params.id}/data`, {
    headers: { Cookie: '' },
    cache: 'no-store',
  })
  const { kpi_data } = res.ok ? await res.json() : { kpi_data: [] }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboards" className="text-gray-400 hover:text-white text-sm transition">&larr; Dashboards</Link>
        <span className="font-semibold text-white">{dashboard!.label}</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{dashboard!.label}</h1>
          <p className="text-gray-400 mt-1">{dashboard!.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(kpi_data as KpiData[]).map(kpi => (
            <div key={kpi.definition.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.definition.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatValue(kpi.current, kpi.definition.format, kpi.definition.unit)}</p>
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  kpi.delta_pct >= 0 ? 'text-green-400 bg-green-950/40' : 'text-red-400 bg-red-950/40'
                }`}>
                  {kpi.delta_pct >= 0 ? '+' : ''}{kpi.delta_pct.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-500">{kpi.definition.description}</p>
              {kpi.source && <p className="text-xs text-gray-600">Source: {kpi.source}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
