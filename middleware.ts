import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const BASE = '/apps/yoracle'

const isPublic = createRouteMatcher([
  `${BASE}/health`,
  `${BASE}/sign-in(.*)`,
  `${BASE}/sign-up(.*)`,
])

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req)) {
    auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all paths under /apps/yoracle EXCEPT:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimisation)
     *   - favicon.ico, sitemap.xml, robots.txt
     *   - files with an extension (js, css, png, etc.)
     */
    '/apps/yoracle/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)).*)',
  ],
}
