// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('org_id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { error } = await db.from('connectors').delete().eq('id', id).eq('org_id', user.org_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
