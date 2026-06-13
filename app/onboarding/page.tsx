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

  async function start() {
    setStarted(true)
    const res = await fetch(`${BASE}/api/onboarding/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: '__init__', answer: '' }),
    })
    const data = await res.json()
    setCurrentQuestion(data.next_question)
    setCompletionPct(data.completeness.completion_pct)
    if (!data.next_question) setDone(true)
  }

  async function submitAnswer() {
    if (!currentQuestion || !answer.trim()) return
    setLoading(true)
    const res = await fetch(`${BASE}/api/onboarding/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: currentQuestion.id, answer }),
    })
    const data = await res.json()
    setAnswer('')
    setCompletionPct(data.completeness.completion_pct)
    if (data.next_question) {
      setCurrentQuestion(data.next_question)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-lg text-center space-y-6 px-6">
          <div className="text-5xl">&#x1F52E;</div>
          <h1 className="text-3xl font-bold text-white">Welcome to Yoracle</h1>
          <p className="text-gray-400 text-lg">I’ll ask you a few questions about your business to build your intelligence layer. Takes about 3 minutes.</p>
          <button onClick={start} className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-medium text-lg transition">
            Get started
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="max-w-lg text-center space-y-6 px-6">
          <div className="text-5xl">&#x2728;</div>
          <h1 className="text-3xl font-bold text-white">Your intelligence layer is ready</h1>
          <p className="text-gray-400">Yoracle will now surface insights tailored to your role and business context.</p>
          <a href={`${BASE}/digest`} className="inline-block bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-medium text-lg transition">
            See today’s insights
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Building your intelligence layer</span>
            <span>{Math.round(completionPct)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
        </div>

        {/* Question card */}
        {currentQuestion && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-4">
            <p className="text-xl font-medium text-white">{currentQuestion.question}</p>
            <p className="text-sm text-gray-500">{currentQuestion.hint}</p>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand-500 transition"
              rows={3}
              placeholder="Your answer…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitAnswer() }}
            />
            <button
              onClick={submitAnswer}
              disabled={loading || !answer.trim()}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
