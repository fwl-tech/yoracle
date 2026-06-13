import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase'
import { filterInsightsByRole } from '@/lib/insights'
import type { UserRole, Insight } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

function severityColor(s: Insight['severity']) {
  return s === 'critical' ? 'border-red-500 bg-red-950/20'
    : s === 'warning'  ? 'border-amber-500 bg-amber-950/20'
    : 'border-brand-500 bg-brand-950/10'
}

function severityDot(s: Insight['severity']) {
  return s === 'critical' ? 'bg-red-500'
    : s === 'warning'  ? 'bg-amber-500'
    : 'bg-brand-500'
}

export default async function DigestPage() {
  const { userId } = await auth()
  if (!userId) redirect(`${BASE}/sign-in`)

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect(`${BASE}/onboarding`)

  const today = new Date().toISOString().split('T')[0]
  const { data: raw } = await db
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .gte('generated_at', `${today}T00:00:00Z`)
    .order('generated_at', { ascending: false })

  const insights = filterInsightsByRole((raw ?? []) as Insight[], user.role as UserRole)

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">&#x1F52E;</span>
          <span className="font-semibold text-white">Yoracle</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`${BASE}/dashboards`} className="text-gray-400 hover:text-white transition">Dashboards</Link>
          <Link href={`${BASE}/chat`} className="text-gray-400 hover:text-white transition">Ask AI</Link>
          <Link href={`${BASE}/connectors`} className="text-gray-400 hover:text-white transition">Connectors</Link>
          <Link href={`${BASE}/settings`} className="text-gray-400 hover:text-white transition">Settings</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
          <p className="text-gray-400 mt-1">
            {insights.length > 0 ? `${insights.length} insight${insights.length !== 1 ? 's' : ''} for you today` : 'No new insights today — check back tomorrow.'}
          </p>
        </div>

        {insights.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-500">
            <p>Insights are generated each morning. Come back tomorrow, or <Link href={`${BASE}/chat`} className="text-brand-500 hover:underline">ask the AI</Link> a question now.</p>
          </div>
        )}

        <div className="space-y-4">
          {insights.map(insight => (
            <Link key={insight.id} href={`${BASE}/insights/${insight.id}`}>
              <div className={`border rounded-2xl p-6 space-y-3 hover:border-gray-600 transition cursor-pointer ${severityColor(insight.severity)}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${severityDot(insight.severity)}`} />
                  <span className="text-xs uppercase tracking-wide text-gray-400">{insight.category}</span>
                </div>
                <h2 className="font-semibold text-white text-lg">{insight.title}</h2>
                <p className="text-gray-300 text-sm leading-relaxed">{insight.body}</p>
                {insight.suggested_actions.length > 0 && (
                  <p className="text-xs text-brand-400">{insight.suggested_actions.length} suggested action{insight.suggested_actions.length !== 1 ? 's' : ''} →</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
