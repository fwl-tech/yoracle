// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import DashboardClient from '@/components/DashboardClient'
import { getSupabaseClient } from '@/lib/supabase'
import { DASHBOARDS, KPI_DEFINITIONS } from '@/lib/dashboards'
import type { UserRole, KpiData, ConnectorType } from '@/types'

export default async function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role, org_id').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect('/onboarding')

  const dashboard = DASHBOARDS.find(d => d.id === id)
  if (!dashboard || !dashboard.roles.includes(user.role as UserRole)) redirect('/dashboards')

  const { data: connectors } = await db.from('connectors').select('id, system_type').eq('org_id', user.org_id)
  const connectorIds = (connectors ?? []).map(c => c.id)
  const connectorMap = new Map((connectors ?? []).map(c => [c.id, c.system_type as ConnectorType]))

  let snapshots: { entity_type: string; raw_data: Record<string, unknown>; synced_at: string; connector_id: string }[] = []
  if (connectorIds.length > 0) {
    const { data } = await db
      .from('data_snapshots')
      .select('entity_type, raw_data, synced_at, connector_id')
      .in('connector_id', connectorIds)
      .order('synced_at', { ascending: false })
      .limit(50)
    snapshots = (data ?? []) as typeof snapshots
  }

  const kpiData: KpiData[] = dashboard.kpi_ids.map(kpiId => {
    const def = KPI_DEFINITIONS.find(k => k.id === kpiId)!
    const snapshot = snapshots.find(s => (s.raw_data as Record<string, unknown>)[kpiId] !== undefined)
    const current = snapshot ? Number((snapshot.raw_data as Record<string, unknown>)[kpiId]) : 0
    const previous = current * 0.9
    const delta = current - previous
    return {
      definition: def,
      current,
      previous,
      delta,
      delta_pct: previous > 0 ? (delta / previous) * 100 : 0,
      sparkline: Array.from({ length: 7 }, (_, i) => previous + (delta / 7) * i),
      source: snapshot ? connectorMap.get(snapshot.connector_id) ?? null : null,
      updated_at: snapshot?.synced_at ?? new Date().toISOString(),
    }
  })

  return (
    <AppShell active="dashboards" showAdmin={user.role === 'admin'}>
      <div className="px-4 sm:px-8 py-3 border-b border-ink-faint/40 bg-surface-raised/50">
        <Link href="/dashboards" className="text-ink-secondary hover:text-ink text-sm transition inline-flex items-center gap-1 min-h-9 font-medium">
          ← All dashboards
        </Link>
      </div>
      <DashboardClient dashboard={dashboard} kpiData={kpiData} />
    </AppShell>
  )
}
