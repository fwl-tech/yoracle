import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Paths are relative to basePath (/apps/yoracle) — do NOT include the basePath prefix.
const isPublic = createRouteMatcher([
  '/health',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/cron(.*)',
  '/api/slack(.*)',
])

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
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
})

export const config = {
  matcher: [
    // Clerk default matcher — paths omit basePath (Next.js adds it automatically)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
