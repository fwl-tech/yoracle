import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '/apps/yoracle'

// Paths are relative to basePath (/apps/yoracle) — do NOT include the basePath prefix.
const isPublic = createRouteMatcher([
  '/health',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/__clerk(.*)',
  '/api/cron(.*)',
  '/api/slack(.*)',
])

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // If the user is already authenticated and lands on a Clerk auth page,
  // redirect them to the digest before the page renders. Without this,
  // Clerk's server component calls Next.js redirect(signInFallbackRedirectUrl)
  // which auto-prepends basePath and produces a double-prefix 500.
  const { userId } = await auth()
  if (userId && isAuthPage(req)) {
    const url = req.nextUrl.clone()
    url.pathname = '/digest'
    return NextResponse.redirect(url)
  }

  if (!isPublic(req)) {
    await auth.protect()
  }
  return NextResponse.next()
}, {
  proxyUrl: `${BASE}/__clerk`,
})

export const config = {
  matcher: [
    // Clerk default matcher — paths omit basePath (Next.js adds it automatically)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
