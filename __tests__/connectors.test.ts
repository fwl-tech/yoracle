import { describe, it, expect } from 'vitest'
import { SUPPORTED_CONNECTORS, encryptAuthConfig, decryptAuthConfig } from '@/lib/connectors'

describe('SUPPORTED_CONNECTORS', () => {
  const expected = ['salesforce', 'hubspot', 'netsuite', 'sap', 'zendesk']

  it('includes all five v1 connectors', () => {
    const ids = SUPPORTED_CONNECTORS.map(c => c.id)
    expected.forEach(id => expect(ids).toContain(id))
  })

  it('each connector has a label, icon, and required_fields list', () => {
    SUPPORTED_CONNECTORS.forEach(c => {
      expect(c.label).toBeTruthy()
      expect(c.required_fields.length).toBeGreaterThan(0)
    })
  })
})

describe('encryptAuthConfig / decryptAuthConfig', () => {
  const secret = 'test-encryption-key-32-chars-long!'
  const config = { api_key: 'sk_live_abc123', instance_url: 'https://myorg.salesforce.com' }

  it('encrypts and decrypts round-trip correctly', () => {
    const encrypted = encryptAuthConfig(config, secret)
    expect(encrypted).not.toContain('api_key')
    expect(encrypted).not.toContain('sk_live_abc123')
    const decrypted = decryptAuthConfig(encrypted, secret)
    expect(decrypted).toEqual(config)
  })

  it('encrypted output is a string', () => {
    const encrypted = encryptAuthConfig(config, secret)
    expect(typeof encrypted).toBe('string')
  })

  it('throws on decrypt with wrong key', () => {
    const encrypted = encryptAuthConfig(config, secret)
    expect(() => decryptAuthConfig(encrypted, 'wrong-key')).toThrow()
  })
})
