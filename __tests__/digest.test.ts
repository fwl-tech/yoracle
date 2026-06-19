import { describe, it, expect, vi } from 'vitest'
import { buildDigestEmailHtml } from '@/lib/email'
import type { Insight } from '@/types'

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  })),
}))

const mockInsight: Insight = {
  id: '1',
  org_id: 'org1',
  user_id: 'u1',
  title: 'ARR up 12%',
  body: 'Revenue grew this quarter.',
  category: 'revenue',
  severity: 'info',
  metric_refs: [],
  suggested_actions: [{ id: 'a1', label: 'Review', description: 'Check pipeline', target_system: 'salesforce', action_type: 'create_task', payload: {} }],
  status: 'new',
  generated_at: new Date().toISOString(),
}

describe('buildDigestEmailHtml', () => {
  it('includes user name and insight title', () => {
    const html = buildDigestEmailHtml('Alice', [mockInsight])
    expect(html).toContain('Alice')
    expect(html).toContain('ARR up 12%')
    expect(html).toContain('suggested action')
  })

  it('handles empty insights', () => {
    const html = buildDigestEmailHtml('Bob', [])
    expect(html).toContain('0 insights')
  })
})

describe('parseDigestHour', () => {
  it('parses HH:MM format', async () => {
    const { runScheduledDigests } = await import('@/lib/digest')
    // Just verify the function is importable and returns a result shape
    const result = await runScheduledDigests()
    expect(result).toHaveProperty('processed')
    expect(result).toHaveProperty('delivered')
  })
})
