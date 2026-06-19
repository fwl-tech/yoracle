import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { encryptAuthConfig } from '@/lib/connectors'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('org_id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: connectors } = await db
    .from('connectors')
    .select('id, system_type, last_synced, status, created_at')
    .eq('org_id', user.org_id)

  return NextResponse.json({ connectors: connectors ?? [] })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { system_type, auth_config } = await req.json()
  const db = getSupabaseClient()

  const { data: user } = await db.from('users').select('org_id, rbac_permissions').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const secret = process.env.CONNECTOR_ENCRYPTION_KEY!
  const encrypted = encryptAuthConfig(auth_config, secret)

  const { data, error } = await db.from('connectors').insert({
    org_id: user.org_id,
    system_type,
    auth_config_encrypted: encrypted,
    status: 'active',
  }).select('id, system_type, status, created_at').single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  import('@/lib/connectors/sync').then(({ syncConnector }) => {
    syncConnector(data.id).catch(console.error)
  })

  return NextResponse.json({ connector: data }, { status: 201 })
}
