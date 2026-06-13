import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Public routes — matched against the path as seen by middleware.
// Pages include the basePath prefix (/apps/yoracle/...).
// API routes do NOT include the basePath prefix in middleware (/api/...).
const isPublic = createRouteMatcher([
  '/apps/yoracle/health',
  '/apps/yoracle/sign-in(.*)',
  '/apps/yoracle/sign-up(.*)',
  '/health',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req)) {
    auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Pages — Next.js middleware sees the full path including basePath for pages.
    // Skip _next internals and static file extensions.
    '/apps/yoracle/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?|ttf)).*)',
    // API routes — middleware sees these WITHOUT the basePath prefix.
    '/api/(.*)',
  ],
}
