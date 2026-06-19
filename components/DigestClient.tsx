'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Insight, InsightCategory } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

const CATEGORIES: { id: InsightCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'customer', label: 'Customer' },
  { id: 'profitability', label: 'Profitability' },
]

function severityStyles(s: Insight['severity']) {
  return s === 'critical'
    ? 'border-l-red-500 bg-red-50/80'
    : s === 'warning'
      ? 'border-l-amber-500 bg-amber-50/80'
      : 'border-l-accent-500 bg-accent-50/50'
}

function severityDot(s: Insight['severity']) {
  return s === 'critical' ? 'bg-red-500' : s === 'warning' ? 'bg-amber-500' : 'bg-accent-500'
}

interface DigestClientProps {
  insights: Insight[]
  dateLabel: string
}

export default function DigestClient({ insights, dateLabel }: DigestClientProps) {
  const [filter, setFilter] = useState<InsightCategory | 'all'>('all')
  const [reviewed, setReviewed] = useState<Set<string>>(new Set(
    insights.filter(i => i.status === 'reviewed' || i.status === 'actioned').map(i => i.id),
  ))

  const filtered = filter === 'all' ? insights : insights.filter(i => i.category === filter)

  async function markReviewed(id: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await fetch(`${BASE}/api/insights/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed' }),
    })
    setReviewed(prev => new Set([...prev, id]))
  }

  return (
    <div className="page-main-narrow space-y-6">
      <header className="page-header">
        <p className="section-label">Today&apos;s digest</p>
        <h1 className="page-title">{dateLabel}</h1>
        <p className="page-subtitle">
          {filtered.length > 0
            ? `${filtered.length} insight${filtered.length !== 1 ? 's' : ''} ready for review`
            : 'No insights in this category today.'}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={filter === c.id ? 'pill-active' : 'pill-inactive'}
          >
            {c.label}
          </button>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="card p-8 sm:p-10 text-center text-ink-secondary text-sm sm:text-base">
          <p>Insights are generated each morning. Come back tomorrow, or{' '}
            <Link href="/chat" className="text-accent-600 hover:underline font-medium">ask the AI</Link> a question now.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(insight => (
          <article key={insight.id} className="relative group">
            <Link href={`/insights/${insight.id}`} className="block">
              <div
                className={`card-interactive border-l-4 p-4 sm:p-5 space-y-2.5 ${severityStyles(insight.severity)} ${
                  reviewed.has(insight.id) ? 'opacity-55' : ''
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap pr-20">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${severityDot(insight.severity)}`} />
                  <span className="text-[11px] uppercase tracking-widest text-ink-muted font-medium">{insight.category}</span>
                  {reviewed.has(insight.id) && (
                    <span className="text-[11px] text-ink-muted ml-auto">Reviewed</span>
                  )}
                </div>
                <h2 className="font-medium text-ink text-base sm:text-lg leading-snug pr-2">{insight.title}</h2>
                <p className="text-ink-secondary text-sm leading-relaxed line-clamp-3 sm:line-clamp-none">{insight.body}</p>
                {insight.suggested_actions.length > 0 && (
                  <p className="text-xs text-accent-600 font-medium">
                    {insight.suggested_actions.length} suggested action{insight.suggested_actions.length !== 1 ? 's' : ''} →
                  </p>
                )}
              </div>
            </Link>
            {!reviewed.has(insight.id) && (
              <button
                onClick={e => markReviewed(insight.id, e)}
                className="absolute top-3 right-3 btn-secondary text-xs py-1.5 px-2.5 min-h-8 shadow-sm"
              >
                Done
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
