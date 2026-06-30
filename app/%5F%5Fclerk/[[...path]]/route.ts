import type { NextRequest } from 'next/server'
import { proxyClerkFrontendApi } from '@/lib/clerk-proxy'

type RouteContext = { params: Promise<{ path?: string[] }> }

async function handle(req: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params
  return proxyClerkFrontendApi(req, path)
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
