import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SCHEMA = 'yoracle'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: SCHEMA } }
    )
  }
  return client
}

export function getSupabaseClientForUser(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SCHEMA },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  )
}
