import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { applyOnboardingAnswer, evaluateCompleteness, getNextOnboardingQuestion } from '@/lib/ontology'
import type { UserRole } from '@/types'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question_id, answer } = await req.json()
  const db = getSupabaseClient()

  const { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: existing } = await db.from('ontologies').select('*').eq('org_id', user.org_id).order('version', { ascending: false }).limit(1).maybeSingle()

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
