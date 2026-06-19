'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { SUPPORTED_CONNECTORS } from '@/lib/connectors/specs'
import type { Connector } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}/api/connectors`).then(r => r.json()).then(d => setConnectors(d.connectors ?? []))
  }, [])

  async function save() {
    if (!adding) return
    setSaving(true)
    await fetch(`${BASE}/api/connectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_type: adding, auth_config: form }),
    })
    const d = await fetch(`${BASE}/api/connectors`).then(r => r.json())
    setConnectors(d.connectors ?? [])
    setAdding(null)
    setForm({})
    setSaving(false)
  }

  async function remove(id: string) {
    await fetch(`${BASE}/api/connectors/${id}`, { method: 'DELETE' })
    setConnectors(prev => prev.filter(c => c.id !== id))
  }

  async function sync(id: string) {
    setSyncing(id)
    await fetch(`${BASE}/api/connectors/${id}/sync`, { method: 'POST' })
    const d = await fetch(`${BASE}/api/connectors`).then(r => r.json())
    setConnectors(d.connectors ?? [])
    setSyncing(null)
  }

  return (
    <AppShell active="connectors">
      <main className="page-main-narrow space-y-6 sm:space-y-8">
        <header className="page-header">
          <p className="section-label">Integrations</p>
          <h1 className="page-title">Data connectors</h1>
          <p className="page-subtitle">Connect your SaaS systems so Yoracle can surface insights from real data.</p>
        </header>

        <div className="space-y-3">
          {SUPPORTED_CONNECTORS.map(spec => {
            const connected = connectors.find(c => c.system_type === spec.id)
            return (
              <div key={spec.id} className="card p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-medium text-ink">{spec.label}</h2>
                    {connected && (
                      <p className="text-xs text-ink-muted mt-0.5">
                        Last synced: {connected.last_synced ? new Date(connected.last_synced).toLocaleString() : 'Never'}
                        {connected.status === 'syncing' && ' (syncing…)'}
                        {connected.status === 'error' && ' (sync error)'}
                      </p>
                    )}
                  </div>
                  {connected ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => sync(connected.id)}
                        disabled={syncing === connected.id}
                        className="text-xs text-accent-600 hover:text-accent-700 font-medium transition disabled:opacity-50 min-h-9 px-2"
                      >
                        {syncing === connected.id ? 'Syncing…' : 'Sync'}
                      </button>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        connected.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : connected.status === 'error' ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {connected.status}
                      </span>
                      <button onClick={() => remove(connected.id)} className="text-xs text-red-600 hover:text-red-700 font-medium transition min-h-9 px-2">Remove</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAdding(spec.id); setForm({}) }} className="btn-primary text-sm py-2.5 w-full sm:w-auto">
                      Connect
                    </button>
                  )}
                </div>

                {adding === spec.id && (
                  <div className="mt-4 border-t border-ink-faint/50 pt-4 space-y-3">
                    {spec.required_fields.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs text-ink-muted mb-1 font-medium">{f.label}</label>
                        <input
                          type={f.type === 'password' ? 'password' : 'text'}
                          className="input-field"
                          value={form[f.key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.type === 'url' ? 'https://' : ''}
                        />
                      </div>
                    ))}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={save} disabled={saving} className="btn-primary text-sm py-2.5 flex-1 sm:flex-none">
                        {saving ? 'Saving…' : 'Save & sync'}
                      </button>
                      <button onClick={() => { setAdding(null); setForm({}) }} className="btn-ghost text-sm py-2.5">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </AppShell>
  )
}
