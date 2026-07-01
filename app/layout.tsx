import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const dynamic = 'force-dynamic'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600'],
})

const BASE = '/apps/yoracle'

export const metadata: Metadata = {
  title: 'Yoracle — Business Intelligence',
  description: 'Autonomous AI insights for executive decision-making',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yoracle',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f5f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      proxyUrl={`${BASE}/__clerk`}
      signInUrl={`${BASE}/sign-in`}
      signUpUrl={`${BASE}/sign-up`}
      signInFallbackRedirectUrl="/digest"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignInUrl="/digest"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en">
        <body className={`${sans.variable} ${serif.variable} font-sans`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
