// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { DASHBOARDS, KPI_DEFINITIONS } from '@/lib/dashboards'
import type { KpiData, UserRole } from '@/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role, org_id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const dashboard = DASHBOARDS.find(d => d.id === id)
  if (!dashboard) return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
  if (!dashboard.roles.includes(user.role as UserRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch latest snapshots for this org's connectors
  const { data: connectors } = await db.from('connectors').select('id, system_type').eq('org_id', user.org_id)
  const connectorIds = (connectors ?? []).map(c => c.id)
  const connectorMap = new Map((connectors ?? []).map(c => [c.id, c.system_type]))

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

  // Map KPI definitions to data (stub values where no snapshot exists)
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
      source: snapshot ? connectorMap.get(snapshot.connector_id) as KpiData['source'] : null,
      updated_at: snapshot?.synced_at ?? new Date().toISOString(),
    }
  })

  return NextResponse.json({ dashboard, kpi_data: kpiData })
}
