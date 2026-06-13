import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  let userId: string | null = null
  try {
    const session = await auth()
    userId = session.userId
  } catch {
    // auth() throws if clerkMiddleware didn't run — treat as unauthenticated
  }

  if (!userId) redirect('/sign-in')

  // Authenticated — digest page handles the Supabase user/ontology check
  // and redirects to /onboarding if setup isn't complete.
  redirect('/digest')
}
