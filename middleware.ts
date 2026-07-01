// --- Clerk-based auth (disabled — replaced with a simple email/password session cookie) ---
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// import { NextResponse } from 'next/server'
//
// const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '/apps/yoracle'
//
// // Paths are relative to basePath (/apps/yoracle) — do NOT include the basePath prefix.
// const isPublic = createRouteMatcher([
//   '/health',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/__clerk(.*)',
//   '/api/cron(.*)',
//   '/api/slack(.*)',
// ])
//
// const isAuthPage = createRouteMatcher([
//   '/sign-in(.*)',
//   '/sign-up(.*)',
// ])
//
// function isClerkFapiPath(pathname: string): boolean {
//   return pathname === '/__clerk' || pathname.startsWith('/__clerk/') || pathname.endsWith('/__clerk') || pathname.includes('/__clerk/')
// }
//
// export default clerkMiddleware(async (auth, req) => {
//   // Clerk Frontend API proxy — must bypass auth.protect() (path may include basePath behind reverse proxies).
//   if (isClerkFapiPath(req.nextUrl.pathname)) {
//     return NextResponse.next()
//   }
//
//   // If the user is already authenticated and lands on a Clerk auth page,
//   // redirect them to the digest before the page renders. Without this,
//   // Clerk's server component calls Next.js redirect(signInFallbackRedirectUrl)
//   // which auto-prepends basePath and produces a double-prefix 500.
//   const { userId } = await auth()
//   if (userId && isAuthPage(req)) {
//     const url = req.nextUrl.clone()
//     url.pathname = '/digest'
//     return NextResponse.redirect(url)
//   }
//
//   if (!isPublic(req)) {
//     await auth.protect()
//   }
//   return NextResponse.next()
// }, {
//   proxyUrl: `${BASE}/__clerk`,
// })

import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/simple-auth'

// Paths are relative to basePath (/apps/yoracle) — do NOT include the basePath prefix.
const PUBLIC_PATHS = [
  '/health',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/auth(.*)',
  '/api/cron(.*)',
  '/api/slack(.*)',
]

const AUTH_PAGES = ['/sign-in(.*)', '/sign-up(.*)']

function matchesAny(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => new RegExp(`^${pattern.replace('(.*)', '.*')}$`).test(pathname))
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value)

  // Already signed in and landing on a sign-in/sign-up page — send to the digest.
  if (userId && matchesAny(pathname, AUTH_PAGES)) {
    const url = req.nextUrl.clone()
    url.pathname = '/digest'
    return NextResponse.redirect(url)
  }

  if (!userId && !matchesAny(pathname, PUBLIC_PATHS)) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Clerk default matcher — paths omit basePath (Next.js adds it automatically)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
