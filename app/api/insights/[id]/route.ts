// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { updateInsightStatus } from '@/lib/insights'
import type { InsightStatus } from '@/types'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: insight } = await db.from('insights').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ insight })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()
  const valid: InsightStatus[] = ['new', 'reviewed', 'actioned']
  if (!valid.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: insight } = await db.from('insights').select('id').eq('id', id).eq('user_id', user.id).single()
  if (!insight) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await updateInsightStatus(id, status)
  return NextResponse.json({ success: true })
}
