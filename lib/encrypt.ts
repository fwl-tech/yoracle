import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN   = 32
const IV_LEN    = 16
const TAG_LEN   = 16

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'yoracle-salt', KEY_LEN)
}

export function encryptAuthConfig(config: Record<string, unknown>, secret: string): string {
  const key = deriveKey(secret)
  const iv  = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const plain = JSON.stringify(config)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptAuthConfig(ciphertext: string, secret: string): Record<string, unknown> {
  const key  = deriveKey(secret)
  const data = Buffer.from(ciphertext, 'base64')
  const iv   = data.subarray(0, IV_LEN)
  const tag  = data.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc  = data.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
  return JSON.parse(plain)
}
