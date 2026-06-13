'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Insight, SuggestedAction } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default function InsightDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [insight, setInsight] = useState<Insight | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [triggered, setTriggered] = useState<string[]>([])

  useEffect(() => {
    fetch(`${BASE}/api/insights/${params.id}`)
      .then(r => r.json())
      .then(d => setInsight(d.insight))
  }, [params.id])

  async function triggerAction(action: SuggestedAction) {
    setTriggering(action.id)
    const res = await fetch(`${BASE}/api/insights/${params.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: action.id }),
    })
    const data = await res.json()
    if (data.success) setTriggered(prev => [...prev, action.id])
    setTriggering(null)
  }

  if (!insight) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-500">Loading…</div></div>

  const severityBadge = insight.severity === 'critical' ? 'bg-red-950/40 text-red-400 border-red-800'
    : insight.severity === 'warning' ? 'bg-amber-950/40 text-amber-400 border-amber-800'
    : 'bg-brand-950/40 text-brand-400 border-brand-800'

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm transition">← Back</button>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium uppercase tracking-wide ${severityBadge}`}>
              {insight.severity}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{insight.category}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{insight.title}</h1>
          <p className="text-gray-300 leading-relaxed">{insight.body}</p>
        </div>

        {insight.metric_refs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Key metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              {insight.metric_refs.map((m, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500">{m.name}</p>
                  <p className="text-xl font-bold text-white mt-1">{m.value}{m.unit}</p>
                  {m.delta !== null && (
                    <p className={`text-xs mt-1 ${m.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {m.delta >= 0 ? '+' : ''}{m.delta}{m.unit} vs last period
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">Source: {m.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {insight.suggested_actions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Suggested actions</h2>
            <div className="space-y-3">
              {insight.suggested_actions.map(action => (
                <div key={action.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white text-sm">{action.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{action.description}</p>
                    <p className="text-xs text-gray-600 mt-1">via {action.target_system}</p>
                  </div>
                  <button
                    onClick={() => triggerAction(action)}
                    disabled={triggering === action.id || triggered.includes(action.id)}
                    className="shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 bg-brand-500 hover:bg-brand-600 text-white"
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
