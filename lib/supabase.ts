import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SCHEMA = 'yoracle'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

let client: AnySupabaseClient | null = null

export function getSupabaseClient(): AnySupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: SCHEMA } }
    ) as AnySupabaseClient
  }
  return client
}

export function getSupabaseClientForUser(accessToken: string): AnySupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SCHEMA },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  ) as AnySupabaseClient
}
