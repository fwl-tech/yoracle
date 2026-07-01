// import { SignUp } from '@clerk/nextjs' // disabled — replaced with simple email/password auth
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to sign up')
        return
      }
      router.push('/onboarding')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-surface-base px-4 pb-safe">
      <div className="mb-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center mx-auto mb-4 font-heading text-xl text-surface-raised font-medium">
          Y
        </div>
        <h1 className="font-heading text-2xl font-medium text-ink tracking-tight">Create your account</h1>
        <p className="text-ink-secondary text-sm mt-1">Get started with Yoracle</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="text"
          autoComplete="name"
          placeholder="Name"
          className="input-field"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          className="input-field"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Password (min. 8 characters)"
          className="input-field"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-ink-secondary text-sm text-center mt-2">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
