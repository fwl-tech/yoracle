import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default async function Home() {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch {
    // auth() throws if clerkMiddleware didn't run — treat as unauthenticated
  }

  if (!userId) redirect(`${BASE}/sign-in`)

  // Authenticated — digest page handles the Supabase user/ontology check
  // and redirects to /onboarding if setup isn't complete.
  redirect(`${BASE}/digest`)
}
