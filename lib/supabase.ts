import 'server-only'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SCHEMA = 'yoracle'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

let client: AnySupabaseClient | null = null

function shouldUseDevStore(): boolean {
  if (process.env.USE_DEV_STORE === 'true') return true
  if (process.env.USE_SUPABASE === 'true') return false
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url || url.includes('placeholder')) return true
  return url.includes('127.0.0.1') || url.includes('localhost')
}

function createDevClient(): AnySupabaseClient {
  // Lazy require keeps Node-only modules out of the client bundle.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createDevSupabaseClient } = require('./dev-store') as typeof import('./dev-store')
  return createDevSupabaseClient() as unknown as AnySupabaseClient
}

export function getSupabaseClient(): AnySupabaseClient {
  if (!client) {
    if (shouldUseDevStore()) {
      client = createDevClient()
    } else {
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
