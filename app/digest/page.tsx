// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DigestClient from '@/components/DigestClient'
import { getSupabaseClient } from '@/lib/supabase'
import { filterInsightsByRole } from '@/lib/insights'
import type { UserRole, Insight } from '@/types'

export default async function DigestPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).maybeSingle()
  if (!user) redirect('/onboarding')

  const today = new Date().toISOString().split('T')[0]
  const { data: raw } = await db
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .gte('generated_at', `${today}T00:00:00Z`)
    .order('generated_at', { ascending: false })

  const insights = filterInsightsByRole((raw ?? []) as Insight[], user.role as UserRole)
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <AppShell active="digest" showAdmin={user.role === 'admin'}>
      <DigestClient insights={insights} dateLabel={dateLabel} />
    </AppShell>
  )
}
