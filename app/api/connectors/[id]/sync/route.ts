// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { syncConnector } from '@/lib/connectors/sync'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('org_id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: connector } = await db
    .from('connectors')
    .select('id')
    .eq('id', id)
    .eq('org_id', user.org_id)
    .single()

  if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

  const result = await syncConnector(id)
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
