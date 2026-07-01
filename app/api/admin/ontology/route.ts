// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const EDITABLE_FIELDS = [
  'customer_definition',
  'revenue_model',
  'cost_structure',
  'departments',
  'saas_connections',
] as const

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: admin } = await db.from('users').select('org_id, role').eq('clerk_user_id', userId).single()
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  for (const field of EDITABLE_FIELDS) {
    if (field in body) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data: existing } = await db
    .from('ontologies')
    .select('*')
    .eq('org_id', admin.org_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('ontologies')
      .update({ ...updates, version: existing.version + 1 })
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await db
      .from('ontologies')
      .insert({ org_id: admin.org_id, ...updates, version: 1 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
