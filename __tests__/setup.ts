import { vi } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123', orgId: 'org_test123' })),
  currentUser: vi.fn(() => ({ id: 'user_test123', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
}))

// Mock AI client
vi.mock('@/lib/ai', () => ({
  generateInsights: vi.fn(),
  streamChat: vi.fn(),
  getAIClient: vi.fn(),
}))
