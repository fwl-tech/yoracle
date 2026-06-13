import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher([
  '/apps/yoracle/health',
  '/apps/yoracle/sign-in(.*)',
  '/apps/yoracle/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req)) {
    auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/apps/yoracle/(.*)', '/(api|trpc)(.*)'],
}
