import { getSupabaseClient } from '@/lib/supabase'
import type { User } from '@/types'

export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  const db = getSupabaseClient()
  const { data } = await db.from('users').select('*').eq('clerk_user_id', clerkUserId).maybeSingle()
  return data as User | null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getSupabaseClient()
  const { data } = await db.from('users').select('*').eq('email', email).maybeSingle()
  return data as User | null
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getSupabaseClient()
  const { data } = await db.from('users').select('*').eq('id', id).maybeSingle()
  return data as User | null
}
