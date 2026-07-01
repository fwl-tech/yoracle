// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  // Authenticated — digest page handles the Supabase user/ontology check
  // and redirects to /onboarding if setup isn't complete.
  redirect('/digest')
}
