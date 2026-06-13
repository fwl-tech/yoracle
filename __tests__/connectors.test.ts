import { describe, it, expect, vi, beforeEach } from 'vitest'
import { triggerWorkflowAction, SUPPORTED_CONNECTORS } from '@/lib/connectors'

// Mock encrypt so we can control what auth config decrypts to
vi.mock('@/lib/encrypt', () => ({
  encryptAuthConfig: vi.fn((data: Record<string, unknown>) => JSON.stringify(data)),
  decryptAuthConfig: vi.fn((encrypted: string) => JSON.parse(encrypted)),
}))

function makeEncryptedAuth(auth: Record<string, unknown>): string {
  return JSON.stringify(auth)
}

// ─── SUPPORTED_CONNECTORS integrity ────────────────────────────────────────

describe('SUPPORTED_CONNECTORS', () => {
  it('contains salesforce, hubspot, netsuite, sap, zendesk', () => {
    const ids = SUPPORTED_CONNECTORS.map(c => c.id)
    expect(ids).toContain('salesforce')
    expect(ids).toContain('hubspot')
    expect(ids).toContain('netsuite')
    expect(ids).toContain('sap')
    expect(ids).toContain('zendesk')
  })

  it('each connector has at least one required field', () => {
    for (const c of SUPPORTED_CONNECTORS) {
      expect(c.required_fields.length).toBeGreaterThan(0)
    }
  })

  it('all required field types are text, password, or url', () => {
    const valid = ['text', 'password', 'url']
    for (const c of SUPPORTED_CONNECTORS) {
      for (const f of c.required_fields) {
        expect(valid).toContain(f.type)
      }
    }
  })
})

// ─── triggerWorkflowAction ──────────────────────────────────────────────────

describe('triggerWorkflowAction', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  // ── Salesforce ────────────────────────────────────────────────────────────

  it('salesforce create_task: returns success when both fetches succeed', async () => {
    const auth = { instance_url: 'https://sf.example.com', client_id: 'cid', client_secret: 'csec' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: async () => ({ access_token: 'tok123' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'task1' }) } as Response)

    const result = await triggerWorkflowAction('salesforce', 'create_task', { Subject: 'Follow up' }, makeEncryptedAuth(auth))
    expect(result.success).toBe(true)
    expect(result.result).toEqual({ id: 'task1' })
  })

  it('salesforce create_task: returns success=false when task POST fails', async () => {
    const auth = { instance_url: 'https://sf.example.com', client_id: 'cid', client_secret: 'csec' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: async () => ({ access_token: 'tok123' }) } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ errorCode: 'FIELD_MISSING' }) } as Response)

    const result = await triggerWorkflowAction('salesforce', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
  })

  it('salesforce unknown action: returns error string', async () => {
    const auth = { instance_url: 'https://sf.example.com', client_id: 'cid', client_secret: 'csec' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: async () => ({ access_token: 'tok123' }) } as Response)

    const result = await triggerWorkflowAction('salesforce', 'delete_record', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unknown Salesforce action/)
  })

  it('salesforce: handles network error (fetch throws)', async () => {
    const auth = { instance_url: 'https://sf.example.com', client_id: 'cid', client_secret: 'csec' }
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const result = await triggerWorkflowAction('salesforce', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Network error/)
  })

  // ── HubSpot ───────────────────────────────────────────────────────────────

  it('hubspot create_task: returns success when fetch succeeds', async () => {
    const auth = { access_token: 'hs-token' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'hs-task1' }) } as Response)

    const result = await triggerWorkflowAction('hubspot', 'create_task', { hs_task_subject: 'Call' }, makeEncryptedAuth(auth))
    expect(result.success).toBe(true)
  })

  it('hubspot create_task: returns success=false when fetch fails', async () => {
    const auth = { access_token: 'hs-token' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Unauthorized' }) } as Response)

    const result = await triggerWorkflowAction('hubspot', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
  })

  it('hubspot unknown action: returns error string', async () => {
    const auth = { access_token: 'hs-token' }
    const result = await triggerWorkflowAction('hubspot', 'update_deal', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unknown HubSpot action/)
  })

  it('hubspot: handles network error', async () => {
    const auth = { access_token: 'hs-token' }
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await triggerWorkflowAction('hubspot', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/ECONNREFUSED/)
  })

  // ── Zendesk ───────────────────────────────────────────────────────────────

  it('zendesk create_ticket: returns success when fetch succeeds', async () => {
    const auth = { subdomain: 'acme', email: 'agent@acme.com', api_token: 'zd-token' }
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ticket: { id: 999 } }) } as Response)

    const result = await triggerWorkflowAction('zendesk', 'create_ticket', { subject: 'Issue' }, makeEncryptedAuth(auth))
    expect(result.success).toBe(true)
    expect((result.result as { ticket: { id: number } }).ticket.id).toBe(999)
  })

  it('zendesk unknown action: returns error string', async () => {
    const auth = { subdomain: 'acme', email: 'agent@acme.com', api_token: 'zd-token' }
    const result = await triggerWorkflowAction('zendesk', 'close_ticket', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Unknown Zendesk action/)
  })

  // ── Unsupported systems ───────────────────────────────────────────────────

  it('netsuite: returns unsupported error without calling fetch', async () => {
    const auth = { account_id: 'NS123', consumer_key: 'ck', consumer_secret: 'cs', token_id: 'ti', token_secret: 'ts' }
    const result = await triggerWorkflowAction('netsuite', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/netsuite/i)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sap: returns unsupported error without calling fetch', async () => {
    const auth = { base_url: 'https://sap.example.com', username: 'user', password: 'pass' }
    const result = await triggerWorkflowAction('sap', 'create_task', {}, makeEncryptedAuth(auth))
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/sap/i)
    expect(fetch).not.toHaveBeenCalled()
  })
})
