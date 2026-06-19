'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import type { Insight, SuggestedAction } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [triggered, setTriggered] = useState<string[]>([])
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    fetch(`${BASE}/api/insights/${id}`)
      .then(r => r.json())
      .then(d => setInsight(d.insight))
  }, [id])

  async function triggerAction(action: SuggestedAction) {
    setTriggering(action.id)
    const res = await fetch(`${BASE}/api/insights/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: action.id }),
    })
    const data = await res.json()
    if (data.success) {
      setTriggered(prev => [...prev, action.id])
      setInsight(prev => prev ? { ...prev, status: 'actioned' } : prev)
    }
    setTriggering(null)
  }

  async function markReviewed() {
    setReviewing(true)
    await fetch(`${BASE}/api/insights/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed' }),
    })
    setInsight(prev => prev ? { ...prev, status: 'reviewed' } : prev)
    setReviewing(false)
  }

  if (!insight) {
    return (
      <div className="min-h-dvh bg-surface-base flex items-center justify-center">
        <div className="text-ink-muted text-sm">Loading…</div>
      </div>
    )
  }

  const severityBadge = insight.severity === 'critical'
    ? 'bg-red-50 text-red-700 border-red-200'
    : insight.severity === 'warning'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-accent-50 text-accent-700 border-accent-200'

  return (
    <div className="min-h-dvh bg-surface-base flex flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-faint/50 bg-surface-base/90 backdrop-blur-md pt-safe-top">
        <div className="px-4 sm:px-8 h-14 flex items-center justify-between gap-3 max-w-3xl mx-auto w-full">
          <Link href="/digest" className="text-ink-secondary hover:text-ink text-sm transition min-h-11 flex items-center font-medium">
            ← Digest
          </Link>
          {insight.status === 'new' && (
            <button onClick={markReviewed} disabled={reviewing} className="btn-secondary text-sm py-2 min-h-10 shrink-0">
              {reviewing ? 'Saving…' : 'Mark reviewed'}
            </button>
          )}
          {insight.status === 'reviewed' && <span className="text-xs text-ink-muted shrink-0">Reviewed</span>}
          {insight.status === 'actioned' && <span className="text-xs text-emerald-600 font-medium shrink-0">Action taken</span>}
        </div>
      </header>

      <main className="page-main-tight space-y-6 sm:space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-widest ${severityBadge}`}>
              {insight.severity}
            </span>
            <span className="text-[11px] text-ink-muted uppercase tracking-widest font-medium">{insight.category}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-medium text-ink leading-snug tracking-tight">{insight.title}</h1>
          <p className="text-ink-secondary leading-relaxed text-sm sm:text-base">{insight.body}</p>
        </div>

        {insight.metric_refs.length > 0 && (
          <div className="space-y-3">
            <h2 className="section-label">Key metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insight.metric_refs.map((m, i) => (
                <div key={i} className="card p-4">
                  <p className="text-xs text-ink-muted font-medium">{m.name}</p>
                  <p className="text-xl font-medium text-ink mt-1 font-heading">{m.value}{m.unit}</p>
                  {m.delta !== null && (
                    <p className={`text-xs mt-1 font-medium ${m.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.delta >= 0 ? '+' : ''}{m.delta}{m.unit} vs last period
                    </p>
                  )}
                  <p className="text-xs text-ink-muted mt-1">Source: {m.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {insight.suggested_actions.length > 0 && (
          <div className="space-y-3">
            <h2 className="section-label">Suggested actions</h2>
            <div className="space-y-3">
              {insight.suggested_actions.map(action => (
                <div key={action.id} className="card p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm">{action.label}</p>
                    <p className="text-xs text-ink-secondary mt-1">{action.description}</p>
                    <p className="text-xs text-ink-muted mt-1">via {action.target_system}</p>
                  </div>
                  <button
                    onClick={() => triggerAction(action)}
                    disabled={triggering === action.id || triggered.includes(action.id)}
                    className="btn-primary text-sm py-2.5 w-full sm:w-auto shrink-0"
                  >
                    {triggered.includes(action.id) ? 'Done ✓' : triggering === action.id ? 'Sending…' : 'Do it'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
