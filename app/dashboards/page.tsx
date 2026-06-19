import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { getSupabaseClient } from '@/lib/supabase'
import { getDashboardsForRole } from '@/lib/dashboards'
import type { UserRole } from '@/types'

export default async function DashboardsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect('/onboarding')

  const dashboards = getDashboardsForRole(user.role as UserRole)

  return (
    <AppShell active="dashboards" showAdmin={user.role === 'admin'}>
      <main className="page-main">
        <header className="page-header">
          <p className="section-label">Analytics</p>
          <h1 className="page-title">Your dashboards</h1>
          <p className="page-subtitle">Role-specific KPIs from your connected data sources.</p>
        </header>
        {dashboards.length === 0 ? (
          <p className="text-ink-muted text-sm sm:text-base">No dashboards available for your role. Contact your admin.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {dashboards.map(d => (
              <Link key={d.id} href={`/dashboards/${d.id}`}>
                <div className="card-interactive p-5 sm:p-6 space-y-2 h-full">
                  <h2 className="font-medium text-ink text-lg">{d.label}</h2>
                  <p className="text-sm text-ink-secondary">{d.description}</p>
                  <p className="text-xs text-accent-600 font-medium">{d.kpi_ids.length} KPIs →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}
