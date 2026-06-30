import 'server-only'

import type { NextRequest } from 'next/server'

const FAPI_ORIGIN = 'https://frontend-api.clerk.dev'
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/apps/yoracle'

export function clerkProxyUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost'
  return `${proto}://${host}${BASE_PATH}/__clerk`
}

export async function proxyClerkFrontendApi(req: NextRequest, pathSegments: string[] = []): Promise<Response> {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) {
    return new Response('Missing CLERK_SECRET_KEY', { status: 500 })
  }

  const path = pathSegments.join('/')
  const target = new URL(path, `${FAPI_ORIGIN}/`)
  target.search = req.nextUrl.search

  const headers = new Headers(req.headers)
  headers.set('Clerk-Proxy-Url', clerkProxyUrl(req))
  headers.set('Clerk-Secret-Key', secretKey)
  headers.set(
    'X-Forwarded-For',
    req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1',
  )
  headers.delete('host')

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const upstream = await fetch(target.toString(), {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  })

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  })
}
