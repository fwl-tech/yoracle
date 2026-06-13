import { describe, it, expect } from 'vitest'
import { encryptAuthConfig, decryptAuthConfig } from '@/lib/encrypt'

const SECRET = 'test-encryption-key-32-chars-long!'

describe('encryptAuthConfig / decryptAuthConfig', () => {
  it('round-trips a simple auth config', () => {
    const config = { access_token: 'my-secret-token', subdomain: 'acme' }
    const encrypted = encryptAuthConfig(config, SECRET)
    const decrypted = decryptAuthConfig(encrypted, SECRET)
    expect(decrypted).toEqual(config)
  })

  it('round-trips an empty object', () => {
    const config = {}
    const encrypted = encryptAuthConfig(config, SECRET)
    const decrypted = decryptAuthConfig(encrypted, SECRET)
    expect(decrypted).toEqual(config)
  })

  it('produces different ciphertext on each call (random IV)', () => {
    const config = { access_token: 'token' }
    const enc1 = encryptAuthConfig(config, SECRET)
    const enc2 = encryptAuthConfig(config, SECRET)
    expect(enc1).not.toBe(enc2)
  })

  it('returns a non-empty string', () => {
    const encrypted = encryptAuthConfig({ key: 'value' }, SECRET)
    expect(typeof encrypted).toBe('string')
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('throws (or returns garbage) when decrypted with wrong secret', () => {
    const config = { access_token: 'my-secret' }
    const encrypted = encryptAuthConfig(config, SECRET)
    expect(() => decryptAuthConfig(encrypted, 'wrong-secret-key-32-chars-long!!')).toThrow()
  })
})
