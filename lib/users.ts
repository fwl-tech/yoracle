import bcrypt from 'bcryptjs'
import { getSupabaseClient } from '@/lib/supabase'
import type { User } from '@/types'

const BCRYPT_ROUNDS = 12

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// Bcrypt hash of a random, unknown string — compared against when no user/password_hash
// exists so a login attempt takes the same time whether or not the email is registered.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOZTG5m6xaoLzC1MEr9nDzTbXNJvpS5xy'

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('*').eq('email', email).maybeSingle()

  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH)
  return valid && user ? (user as User) : null
}
