import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SCHEMA = 'yoracle'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

let client: AnySupabaseClient | null = null

export function getSupabaseClient(): AnySupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !key) {
      throw new Error(
        `Missing Supabase env vars: URL=${!!url}, KEY=${!!key}. ` +
        'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway.'
      )
    }
    
    client = createClient(url, key, { db: { schema: SCHEMA } }) as AnySupabaseClient
  }
  return client
}

export function getSupabaseClientForUser(accessToken: string): AnySupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error(
      `Missing Supabase env vars: URL=${!!url}, ANON_KEY=${!!key}. ` +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Railway.'
    )
  }
  
  return createClient(url, key, {
    db: { schema: SCHEMA },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  }) as AnySupabaseClient
}
