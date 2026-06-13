import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { filterInsightsByRole } from '@/lib/insights'
import type { UserRole } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()

  const { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]
  const { data: insights } = await db
    .from('insights')
    .select('*')
    .eq('user_id', user.id)
    .gte('generated_at', `${today}T00:00:00Z`)
    .order('generated_at', { ascending: false })

  const filtered = filterInsightsByRole(insights ?? [], user.role as UserRole)
  return NextResponse.json({ insights: filtered })
}
