import 'server-only'
import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'yoracle_session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret) throw new Error('Missing AUTH_SESSION_SECRET')
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4)
  return new Uint8Array([...atob(padded)].map(c => c.charCodeAt(0)))
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

// Edge-safe (Web Crypto only, no `next/headers`) — usable from both middleware
// and route handlers/server components.
export async function createSessionToken(userId: string): Promise<string> {
  const payload = JSON.stringify({ sub: userId, exp: Date.now() + SESSION_TTL_MS })
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload))
  const key = await getHmacKey()
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  return `${payloadB64}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return null

  const key = await getHmacKey()
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(sigB64),
    new TextEncoder().encode(payloadB64),
  )
  if (!valid) return null

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)))
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    if (Date.now() > payload.exp) return null
    return payload.sub
  } catch {
    return null
  }
}

// Mirrors the shape of Clerk's `auth()` (`const { userId } = await auth()`) so
// route handlers and server components didn't need to change beyond the import.
// Only usable in route handlers / server components — middleware must read
// `req.cookies` directly and call verifySessionToken() itself.
export async function auth(): Promise<{ userId: string | null }> {
  const store = await cookies()
  const userId = await verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value)
  return { userId }
}
