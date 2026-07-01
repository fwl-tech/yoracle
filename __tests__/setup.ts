import { vi } from 'vitest'

// Mock Next.js server-only guard (not available in Vitest)
vi.mock('server-only', () => ({}))

// Mock Next.js server internals (not available in Vitest node env)
vi.mock('next/server', () => ({
  NextResponse: { json: vi.fn((data: unknown, init?: ResponseInit) => ({ data, init })) },
  NextRequest: vi.fn(),
}))

// Mock Supabase client library
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Mock Supabase lib module
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
  getSupabaseClientForUser: vi.fn(),
}))

// Mock Clerk (disabled — kept only for __tests__/provisioning.test.ts which no longer imports it)
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', orgId: 'org_test123' })),
  currentUser: vi.fn(() => ({ id: 'user_test123', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
  clerkMiddleware: vi.fn(),
  createRouteMatcher: vi.fn(() => vi.fn(() => false)),
}))

// Mock simple email/password auth session
vi.mock('@/lib/simple-auth', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123' })),
  createSessionToken: vi.fn(() => Promise.resolve('test-session-token')),
  verifySessionToken: vi.fn(() => Promise.resolve('user_test123')),
  SESSION_COOKIE_NAME: 'yoracle_session',
  SESSION_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}))

// Mock Anthropic SDK — must use function/class for `new Anthropic()` in vitest 4
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function (this: unknown) {
    return {
      messages: {
        create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '[]' }] }),
        stream: vi.fn().mockReturnValue({ [Symbol.asyncIterator]: async function* () {} }),
      },
    }
  }),
}))

// Provide required env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.CONNECTOR_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!'
process.env.ANTHROPIC_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_BASE_PATH = '/apps/yoracle'
