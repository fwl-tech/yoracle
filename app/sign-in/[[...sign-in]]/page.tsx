import { SignIn } from '@clerk/nextjs'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignIn path={`${BASE}/sign-in`} />
    </div>
  )
}
