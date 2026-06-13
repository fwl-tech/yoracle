import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: context } = await db.from('user_contexts').select('conversation_history, last_active').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ history: context?.conversation_history ?? [], last_active: context?.last_active })
}
