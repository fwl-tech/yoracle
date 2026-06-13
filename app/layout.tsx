import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

// Clerk requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY at render time.
// Railway only injects env vars at runtime, not build time, so we must
// opt every page out of static generation.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Yoracle — Business Intelligence',
  description: 'Autonomous AI insights for executive decision-making',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-950 text-gray-100 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
