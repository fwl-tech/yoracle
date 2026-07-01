// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { triggerWorkflowAction } from '@/lib/connectors'
import type { SuggestedAction } from '@/types'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action_id } = await req.json()
  const db = getSupabaseClient()

  const { data: user } = await db.from('users').select('id, org_id').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: insight } = await db.from('insights').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!insight) return NextResponse.json({ error: 'Insight not found' }, { status: 404 })

  const action = (insight.suggested_actions as SuggestedAction[]).find((a: SuggestedAction) => a.id === action_id)
  if (!action) return NextResponse.json({ error: 'Action not found' }, { status: 404 })

  const { data: connector } = await db
    .from('connectors')
    .select('auth_config_encrypted')
    .eq('org_id', user.org_id)
    .eq('system_type', action.target_system)
    .single()

  if (!connector) return NextResponse.json({ error: `No ${action.target_system} connector configured` }, { status: 400 })

  const result = await triggerWorkflowAction(action.target_system, action.action_type, action.payload, connector.auth_config_encrypted)

  await db.from('workflow_triggers').insert({
    user_id: user.id,
    insight_id: id,
    action_type: action.action_type,
    target_system: action.target_system,
    payload: action.payload,
    status: result.success ? 'success' : 'failed',
  })

  if (result.success) {
    await db.from('insights').update({ status: 'actioned' }).eq('id', id)
  }

  return NextResponse.json(result)
}
