import { describe, it, expect, beforeEach, vi } from 'vitest'

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
    expect(Array.isArray(middleware.config.matcher)).toBe(true)
    expect(middleware.config.matcher.length).toBeGreaterThan(0)
  })

  it('config includes API route matcher', async () => {
    const middleware = await import('@/middleware')
    expect(middleware.config.matcher.some((p: string) => p.includes('api'))).toBe(true)
  })
})
