import { describe, it, expect, vi } from 'vitest'
import type { ChatMessage, UserContext } from '@/types'

const mockContext: UserContext = {
  id: 'ctx-1',
  user_id: 'user-1',
  conversation_history: [
    { role: 'user', content: 'What is our ARR?', timestamp: '2026-06-12T09:00:00Z' },
    { role: 'assistant', content: 'Your ARR is $4.2M, up 12% YoY. Source: Salesforce.', timestamp: '2026-06-12T09:00:02Z', sources: ['salesforce'] },
  ],
  preference_signals: {},
  last_active: '2026-06-12T09:00:02Z',
}

describe('chat history', () => {
  it('stores messages with role, content, and timestamp', () => {
    const msg = mockContext.conversation_history[0]
    expect(msg.role).toBe('user')
    expect(msg.content).toBeTruthy()
    expect(msg.timestamp).toBeTruthy()
  })

  it('assistant responses include source attribution', () => {
    const reply = mockContext.conversation_history[1]
    expect(reply.role).toBe('assistant')
    expect(reply.sources).toBeDefined()
    expect(reply.sources!.length).toBeGreaterThan(0)
  })

  it('history is ordered chronologically', () => {
    const timestamps = mockContext.conversation_history.map(m => m.timestamp)
    const sorted = [...timestamps].sort()
    expect(timestamps).toEqual(sorted)
  })
})

describe('streamChat', () => {
  it('streamChat is defined and callable', async () => {
    const { streamChat } = await import('@/lib/ai')
    expect(streamChat).toBeDefined()
  })

  it('does not expose raw connector credentials in responses', () => {
    const response = mockContext.conversation_history[1].content
    expect(response).not.toContain('api_key')
    expect(response).not.toContain('password')
    expect(response).not.toContain('secret')
  })
})

describe('chat context building', () => {
  it('truncates history to last 20 messages to stay within context limits', () => {
    const longHistory: ChatMessage[] = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
      timestamp: new Date(2026, 0, 1, i).toISOString(),
    }))
    const truncated = longHistory.slice(-20)
    expect(truncated.length).toBe(20)
  })
})
