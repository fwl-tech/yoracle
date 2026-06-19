import { SignIn } from '@clerk/nextjs'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function SignInPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-base px-4 pb-safe">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center mx-auto mb-4 font-heading text-xl text-surface-raised font-medium">
          Y
        </div>
        <h1 className="font-heading text-2xl font-medium text-ink tracking-tight">Sign in to Yoracle</h1>
        <p className="text-ink-secondary text-sm mt-1">Business intelligence for your team</p>
      </div>
      <SignIn path={`${BASE}/sign-in`} />
    </div>
  )
}
