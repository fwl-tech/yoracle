import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { getDashboardsForRole } from '@/lib/dashboards'
import type { UserRole } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default async function DashboardsPage() {
  const { userId } = await auth()
  if (!userId) redirect(`${BASE}/sign-in`)

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect(`${BASE}/onboarding`)

  const dashboards = getDashboardsForRole(user.role as UserRole)

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href={`${BASE}/digest`} className="text-gray-400 hover:text-white text-sm transition">← Digest</Link>
        <span className="font-semibold text-white">Dashboards</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">Your dashboards</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboards.map(d => (
            <Link key={d.id} href={`${BASE}/dashboards/${d.id}`}>
              <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 cursor-pointer transition space-y-2">
                <h2 className="font-semibold text-white">{d.label}</h2>
                <p className="text-sm text-gray-400">{d.description}</p>
                <p className="text-xs text-brand-400">{d.kpi_ids.length} KPIs →</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
