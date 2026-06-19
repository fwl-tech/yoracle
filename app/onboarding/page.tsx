'use client'

import { useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

interface Question {
  id: string
  question: string
  hint: string
}

export default function OnboardingPage() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [completionPct, setCompletionPct] = useState(0)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setStarted(true)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE}/api/onboarding/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: '__init__', answer: '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setCurrentQuestion(data.next_question ?? null)
      setCompletionPct(data.completeness?.completion_pct ?? 0)
      if (!data.next_question) setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please refresh and try again.')
      setStarted(false)
    } finally {
      setLoading(false)
    }
  }

  async function submitAnswer() {
    if (!currentQuestion || !answer.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/onboarding/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: currentQuestion.id, answer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setAnswer('')
      setCompletionPct(data.completeness?.completion_pct ?? completionPct)
      if (data.next_question) {
        setCurrentQuestion(data.next_question)
      } else {
        setDone(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save answer. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!started) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-base px-4 pb-safe">
        <div className="max-w-lg text-center space-y-6 w-full">
          <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center mx-auto font-heading text-2xl text-surface-raised font-medium">
            Y
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-ink tracking-tight">Welcome to Yoracle</h1>
          <p className="text-ink-secondary text-base sm:text-lg leading-relaxed">
            I&apos;ll ask you a few questions about your business to build your intelligence layer. Takes about 3 minutes.
          </p>
          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}
          <button onClick={start} disabled={loading} className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
            {loading ? 'Setting up…' : 'Get started'}
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-base px-4 pb-safe">
        <div className="max-w-lg text-center space-y-6 w-full">
          <div className="w-14 h-14 rounded-2xl bg-accent-500 flex items-center justify-center mx-auto text-white text-2xl">
            ✓
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-medium text-ink tracking-tight">Your intelligence layer is ready</h1>
          <p className="text-ink-secondary text-sm sm:text-base">Yoracle will now surface insights tailored to your role and business context.</p>
          <a href={`${BASE}/digest`} className="inline-block btn-primary text-base px-8 py-3 w-full sm:w-auto">
            See today&apos;s insights
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-base px-4 py-8 pb-safe">
      <div className="w-full max-w-xl space-y-5 sm:space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-ink-secondary">
            <span>Building your intelligence layer</span>
            <span className="font-medium text-ink">{Math.round(completionPct)}%</span>
          </div>
          <div className="h-1.5 bg-surface-inset rounded-full overflow-hidden">
            <div className="h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {currentQuestion && (
          <div className="card p-5 sm:p-8 space-y-4 shadow-card">
            <p className="font-heading text-xl sm:text-2xl font-medium text-ink leading-snug">{currentQuestion.question}</p>
            <p className="text-sm text-ink-muted">{currentQuestion.hint}</p>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Your answer…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <button onClick={submitAnswer} disabled={loading || !answer.trim()} className="w-full btn-primary py-3">
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        )}

        {!currentQuestion && !error && (
          <div className="text-center text-ink-muted text-sm">Loading your first question…</div>
        )}
      </div>
    </div>
  )
}
