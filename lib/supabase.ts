import { createClient } from '@supabase/supabase-js'

const SCHEMA = 'yoracle'

type SupabaseClientType = ReturnType<typeof createClient>

let client: SupabaseClientType | null = null

export function getSupabaseClient(): SupabaseClientType {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: SCHEMA } }
    )
  }
  return client
}

export function getSupabaseClientForUser(accessToken: string): SupabaseClientType {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: SCHEMA },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  )
}
