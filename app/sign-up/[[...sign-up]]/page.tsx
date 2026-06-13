import { SignUp } from '@clerk/nextjs'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <SignUp path={`${BASE}/sign-up`} />
    </div>
  )
}
