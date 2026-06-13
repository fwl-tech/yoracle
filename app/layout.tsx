import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

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
