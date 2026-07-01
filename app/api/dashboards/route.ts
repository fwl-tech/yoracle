// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { getDashboardsForRole } from '@/lib/dashboards'
import type { UserRole } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const dashboards = getDashboardsForRole(user.role as UserRole)
  return NextResponse.json({ dashboards })
}
