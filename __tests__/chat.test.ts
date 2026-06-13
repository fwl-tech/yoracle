import { describe, it, expect, vi, beforeEach } from 'vitest'

// Do NOT import from @/lib/ai at top level — we need to control module state.
// The global setup mocks @anthropic-ai/sdk so the real lib/ai.ts uses a mock client.

describe('getAIClient', () => {
  it('returns an Anthropic instance', async () => {
    const { getAIClient } = await import('@/lib/ai')
    const client = getAIClient()
    expect(client).toBeDefined()
  })

  it('returns the same singleton on repeated calls', async () => {
    const { getAIClient } = await import('@/lib/ai')
    const a = getAIClient()
    const b = getAIClient()
    expect(a).toBe(b)
  })
})

describe('streamChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = { id: 'u1', org_id: 'org1', name: 'Alice', email: 'alice@example.com', role: 'ceo' as const, clerk_user_id: 'clerk1' }
  const mockOntology = {
    id: 'ont1',
    org_id: 'org1',
    version: 1,
    customer_definition: { 'q-customer-type': 'B2B' },
    revenue_model: { 'q-revenue-model': 'Subscription' },
    cost_structure: {},
    departments: ['Sales', 'Engineering'],
    saas_connections: [],
  }

  it('yields text chunks from content_block_delta events', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: vi.fn(),
        stream: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } }
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' world' } }
            yield { type: 'message_stop' }
          },
        }),
      },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    // Reset the singleton so the new mock is picked up
    vi.resetModules()
    const { streamChat } = await import('@/lib/ai')
    const chunks: string[] = []
    for await (const chunk of streamChat(mockUser, mockOntology, [], 'What is ARR?')) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual(['Hello', ' world'])
  })

  it('skips non-text_delta chunks', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        create: vi.fn(),
        stream: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'message_start', message: {} }
            yield { type: 'content_block_start', index: 0 }
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Answer' } }
            yield { type: 'content_block_stop' }
          },
        }),
      },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { streamChat } = await import('@/lib/ai')
    const chunks: string[] = []
    for await (const chunk of streamChat(mockUser, null, [], 'Hi')) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual(['Answer'])
  })

  it('appends dataContext to user message when provided', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const streamMock = vi.fn().mockReturnValue({ [Symbol.asyncIterator]: async function* () {} })
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: vi.fn(), stream: streamMock },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { streamChat } = await import('@/lib/ai')
    // Exhaust the generator
    for await (const _ of streamChat(mockUser, null, [], 'question', 'data-snapshot')) { /* noop */ }
    const callArgs = streamMock.mock.calls[0][0]
    const lastMsg = callArgs.messages[callArgs.messages.length - 1]
    expect(lastMsg.content).toContain('data-snapshot')
    expect(lastMsg.content).toContain('question')
  })

  it('does not append dataContext when not provided', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const streamMock = vi.fn().mockReturnValue({ [Symbol.asyncIterator]: async function* () {} })
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: vi.fn(), stream: streamMock },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { streamChat } = await import('@/lib/ai')
    for await (const _ of streamChat(mockUser, null, [], 'question')) { /* noop */ }
    const callArgs = streamMock.mock.calls[0][0]
    const lastMsg = callArgs.messages[callArgs.messages.length - 1]
    expect(lastMsg.content).toBe('question')
  })

  it('truncates history to last 20 messages', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const streamMock = vi.fn().mockReturnValue({ [Symbol.asyncIterator]: async function* () {} })
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: vi.fn(), stream: streamMock },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { streamChat } = await import('@/lib/ai')
    const history = Array.from({ length: 30 }, (_, i) => ({
      id: String(i), role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `msg ${i}`, org_id: 'org1', user_id: 'u1', created_at: '',
    }))
    for await (const _ of streamChat(mockUser, null, history, 'new')) { /* noop */ }
    const callArgs = streamMock.mock.calls[0][0]
    // 20 history + 1 new message
    expect(callArgs.messages).toHaveLength(21)
  })
})

describe('generateInsightsForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = { id: 'u1', org_id: 'org1', name: 'Alice', email: 'alice@example.com', role: 'ceo' as const, clerk_user_id: 'clerk1' }
  const mockOntology = {
    id: 'ont1', org_id: 'org1', version: 1,
    customer_definition: {}, revenue_model: {}, cost_structure: {},
    departments: [], saas_connections: [],
  }

  it('parses and returns JSON insights when content type is text', async () => {
    const mockInsights = [{ title: 'ARR growing', body: 'Up 20% QoQ', category: 'revenue', severity: 'info', metric_refs: [], suggested_actions: [] }]
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        stream: vi.fn(),
        create: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(mockInsights) }] }),
      },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { generateInsightsForUser } = await import('@/lib/ai')
    const result = await generateInsightsForUser(mockUser, mockOntology, [])
    expect(result).toEqual(mockInsights)
  })

  it('returns empty array when content type is not text', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: {
        stream: vi.fn(),
        create: vi.fn().mockResolvedValue({ content: [{ type: 'tool_use', id: 'tu1', name: 'fn', input: {} }] }),
      },
    }) as ReturnType<InstanceType<typeof Anthropic>['messages']['stream']>)

    vi.resetModules()
    const { generateInsightsForUser } = await import('@/lib/ai')
    const result = await generateInsightsForUser(mockUser, mockOntology, [])
    expect(result).toEqual([])
  })
})
