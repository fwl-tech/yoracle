import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { applyOnboardingAnswer, evaluateCompleteness, getNextOnboardingQuestion } from '@/lib/ontology'
import type { UserRole } from '@/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id, answer } = await req.json()
  const db = getSupabaseClient()

  let { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).maybeSingle()

  // New user — provision organisation and user record on the first onboarding call
  if (!user) {
    if (question_id !== '__init__') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@unknown.com`
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || email

    const { data: org, error: orgErr } = await db
      .from('organisations')
      .insert({ name: `${name}'s Organisation` })
      .select()
      .single()

    if (orgErr || !org) {
      console.error('Failed to create organisation:', orgErr)
      return NextResponse.json({ error: 'Failed to create organisation' }, { status: 500 })
    }

    const { data: newUser, error: userErr } = await db
      .from('users')
      .insert({ clerk_user_id: userId, org_id: org.id, email, name, role: 'admin' })
      .select()
      .single()

    if (userErr || !newUser) {
      console.error('Failed to create user:', userErr)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    user = newUser
  }

  const { data: existing } = await db
    .from('ontologies')
    .select('*')
    .eq('org_id', user.org_id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const updated = applyOnboardingAnswer(existing ?? {}, question_id, answer)
  const completeness = evaluateCompleteness(updated)

  if (existing) {
    await db.from('ontologies').update({ ...updated, version: existing.version + 1 }).eq('id', existing.id)
  } else {
    await db.from('ontologies').insert({ org_id: user.org_id, ...updated, version: 1 })
  }

  const nextQuestion = getNextOnboardingQuestion(updated, user.role as UserRole)

  return NextResponse.json({ completeness, next_question: nextQuestion })
}
