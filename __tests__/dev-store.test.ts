import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, rmSync } from 'fs'
import { join } from 'path'
import { createDevSupabaseClient } from '../lib/dev-store'

const STORE_PATH = join(process.cwd(), '.dev-data', 'store.json')

describe('dev store', () => {
  afterEach(() => {
    if (existsSync(STORE_PATH)) rmSync(join(process.cwd(), '.dev-data'), { recursive: true, force: true })
  })

  it('creates organisation and user on onboarding flow', async () => {
    const db = createDevSupabaseClient()

    const { data: org, error: orgErr } = await db
      .from('organisations')
      .insert({ name: "Alice's Organisation" })
      .select()
      .single()

    expect(orgErr).toBeNull()
    expect(org?.name).toBe("Alice's Organisation")
    expect(org?.id).toBeTruthy()

    const { data: user, error: userErr } = await db
      .from('users')
      .insert({ clerk_user_id: 'user_123', org_id: org!.id, email: 'alice@example.com', name: 'Alice', role: 'admin' })
      .select()
      .single()

    expect(userErr).toBeNull()
    expect(user?.clerk_user_id).toBe('user_123')

    const { data: found } = await db.from('users').select('*').eq('clerk_user_id', 'user_123').maybeSingle()
    expect(found?.email).toBe('alice@example.com')
  })
})
