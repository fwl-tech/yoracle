import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default async function Home() {
  const { userId } = await auth()
  if (!userId) redirect(`${BASE}/sign-in`)

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('id').eq('clerk_user_id', userId).maybeSingle()

  // First time — go to onboarding
  if (!user) redirect(`${BASE}/onboarding`)

  const { data: ontology } = await db.from('ontologies').select('id').eq('org_id', (await db.from('users').select('org_id').eq('clerk_user_id', userId).single()).data?.org_id ?? '').maybeSingle()

  // No ontology yet — start wizard
  if (!ontology) redirect(`${BASE}/onboarding`)

  redirect(`${BASE}/digest`)
}
