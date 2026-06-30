import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn((handler) => handler),
  createRouteMatcher: vi.fn((paths) => (req: { url: string }) => {
    const url = new URL(req.url)
    return paths.some((path: string) => {
      const pattern = path.replace('(.*)', '.*')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(url.pathname)
    })
  }),
}))

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('middleware module can be imported', async () => {
    const middleware = await import('@/middleware')
    expect(middleware.default).toBeDefined()
  })

  it('config has correct matcher patterns', async () => {
    const middleware = await import('@/middleware')
    expect(middleware.config).toBeDefined()
    expect(middleware.config.matcher).toBeDefined()
    expect(Array.isArray(middleware.config.matcher)).toBe(true)
    expect(middleware.config.matcher.length).toBeGreaterThan(0)
  })

  it('config includes /api/(.*) pattern', async () => {
    const middleware = await import('@/middleware')
    expect(middleware.config.matcher).toContain('/api/(.*)')
  })

  it('config includes /apps/yoracle patterns', async () => {
    const middleware = await import('@/middleware')
    const hasYoraclePattern = middleware.config.matcher.some((pattern: string) => 
      pattern.includes('/apps/yoracle')
    )
    expect(hasYoraclePattern).toBe(true)
  })
})
