import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher([
  '/apps/yoracle/health',
  '/apps/yoracle/sign-in(.*)',
  '/apps/yoracle/sign-up(.*)',
  '/health',
])

const isAuthPage = createRouteMatcher([
  '/apps/yoracle/sign-in(.*)',
  '/apps/yoracle/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  // If the user is already authenticated and lands on a Clerk auth page,
  // redirect them to the digest before the page renders. Without this,
  // Clerk's server component calls Next.js redirect(signInFallbackRedirectUrl)
  // which auto-prepends basePath and produces a double-prefix 500.
  const { userId } = auth()
  if (userId && isAuthPage(req)) {
    const url = req.nextUrl.clone()
    url.pathname = '/apps/yoracle/digest'
    return NextResponse.redirect(url)
  }

  if (!isPublic(req)) {
    auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/apps/yoracle',
    '/apps/yoracle/',
    '/apps/yoracle/((?!_next/static|_next/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2?|ttf)).*)',
    '/api/(.*)',
  ],
}
