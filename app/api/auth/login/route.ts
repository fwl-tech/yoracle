import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/users'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from '@/lib/simple-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await verifyPassword(email, password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(user.clerk_user_id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
  return res
}
