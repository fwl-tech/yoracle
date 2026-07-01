// Clerk Frontend API proxy — disabled — replaced with simple email/password auth (see lib/simple-auth.ts).
//
// import 'server-only'
//
// import type { NextRequest } from 'next/server'
//
// const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/apps/yoracle'
//
// // The Frontend API host is instance-specific and encoded in the publishable
// // key itself (base64 of "<fapi-host>$") — it is NOT a fixed Clerk-wide host.
// // Hardcoding a generic host here silently sends every request to the wrong
// // Clerk instance, which Clerk rejects with a "host_invalid" error.
// function getFapiOrigin(): string {
//   const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
//   if (!publishableKey) {
//     throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
//   }
//   const encoded = publishableKey.replace(/^pk_(test|live)_/, '')
//   const host = Buffer.from(encoded, 'base64').toString('utf-8').replace(/\$+$/, '')
//   if (!host) {
//     throw new Error('Unable to derive Frontend API host from NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
//   }
//   return `https://${host}`
// }
//
// export function clerkProxyUrl(req: NextRequest): string {
//   const proto = req.headers.get('x-forwarded-proto') ?? 'https'
//   const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost'
//   return `${proto}://${host}${BASE_PATH}/__clerk`
// }
//
// export async function proxyClerkFrontendApi(req: NextRequest, pathSegments: string[] = []): Promise<Response> {
//   const secretKey = process.env.CLERK_SECRET_KEY
//   if (!secretKey) {
//     return new Response('Missing CLERK_SECRET_KEY', { status: 500 })
//   }
//
//   let fapiOrigin: string
//   try {
//     fapiOrigin = getFapiOrigin()
//   } catch (err) {
//     return new Response(err instanceof Error ? err.message : 'Invalid Clerk publishable key', { status: 500 })
//   }
//
//   const path = pathSegments.join('/')
//   const target = new URL(path, `${fapiOrigin}/`)
//   target.search = req.nextUrl.search
//
//   const headers = new Headers(req.headers)
//   headers.set('Clerk-Proxy-Url', clerkProxyUrl(req))
//   headers.set('Clerk-Secret-Key', secretKey)
//   headers.set(
//     'X-Forwarded-For',
//     req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1',
//   )
//   headers.delete('host')
//
//   const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
//   const upstream = await fetch(target.toString(), {
//     method: req.method,
//     headers,
//     body: hasBody ? await req.arrayBuffer() : undefined,
//     redirect: 'manual',
//   })
//
//   return new Response(upstream.body, {
//     status: upstream.status,
//     statusText: upstream.statusText,
//     headers: upstream.headers,
//   })
// }

export async function proxyClerkFrontendApi(_req: unknown, _pathSegments?: string[]): Promise<Response> {
  return new Response('Clerk auth is disabled', { status: 404 })
}
