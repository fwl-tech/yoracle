import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { hashPassword } from '@/lib/users'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from '@/lib/simple-auth'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const db = getSupabaseClient()
  const { data: existing } = await db.from('users').select('id').eq('email', email).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const displayName = typeof name === 'string' && name.trim() ? name.trim() : email

  const { data: org, error: orgErr } = await db
    .from('organisations')
    .insert({ name: `${displayName}'s Organisation` })
    .select()
    .single()

  if (orgErr || !org) {
    console.error('Failed to create organisation:', orgErr)
    return NextResponse.json({ error: 'Failed to create organisation', detail: orgErr?.message }, { status: 500 })
  }

  const password_hash = await hashPassword(password)

  // `clerk_user_id` is the generic external-auth identifier (see lib/simple-auth.ts) — holds email now.
  const { data: user, error: userErr } = await db
    .from('users')
    .insert({ clerk_user_id: email, org_id: org.id, email, name: displayName, role: 'admin', password_hash })
    .select()
    .single()

  if (userErr || !user) {
    console.error('Failed to create user:', userErr)
    return NextResponse.json({ error: 'Failed to create user', detail: userErr?.message }, { status: 500 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
  return res
}
