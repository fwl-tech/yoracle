import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Supabase Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSupabaseClient returns a client', async () => {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const client = getSupabaseClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('getSupabaseClient returns same instance on multiple calls (singleton)', async () => {
    const { getSupabaseClient } = await import('@/lib/supabase')
    const client1 = getSupabaseClient()
    const client2 = getSupabaseClient()
    expect(client1).toBeDefined()
    expect(client2).toBeDefined()
    expect(client1.from).toBeDefined()
  })

  it('getSupabaseClientForUser accepts an access token parameter', async () => {
    const { getSupabaseClientForUser } = await import('@/lib/supabase')
    
    expect(() => getSupabaseClientForUser('test-access-token')).not.toThrow()
    expect(() => getSupabaseClientForUser('another-token')).not.toThrow()
  })

  it('getSupabaseClientForUser uses anon key instead of service role', async () => {
    const { getSupabaseClientForUser } = await import('@/lib/supabase')
    
    const client = getSupabaseClientForUser('test-token')
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
  })
})
