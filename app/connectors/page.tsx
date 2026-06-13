'use client'

import { useState, useEffect } from 'react'
import { SUPPORTED_CONNECTORS } from '@/lib/connectors'
import type { Connector } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [adding, setAdding] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

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

  const connectedTypes = new Set(connectors.map(c => c.system_type))

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <a href={`${BASE}/digest`} className="text-gray-400 hover:text-white text-sm transition">← Digest</a>
        <span className="font-semibold text-white">Connectors</span>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Data connectors</h1>
          <p className="text-gray-400 mt-1 text-sm">Connect your SaaS systems so Yoracle can surface insights from real data.</p>
        </div>

        <div className="space-y-3">
          {SUPPORTED_CONNECTORS.map(spec => {
            const connected = connectors.find(c => c.system_type === spec.id)
            return (
              <div key={spec.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-white">{spec.label}</h2>
                    {connected && <p className="text-xs text-gray-500 mt-0.5">Last synced: {connected.last_synced ? new Date(connected.last_synced).toLocaleString() : 'Never'}</p>}
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-400 bg-green-950/40 border border-green-800 px-2.5 py-1 rounded-full">Connected</span>
                      <button onClick={() => remove(connected.id)} className="text-xs text-red-400 hover:text-red-300 transition">Remove</button>
                    </div>
                  ) : (
                    <button onClick={() => { setAdding(spec.id); setForm({}) }} className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition">
                      Connect
                    </button>
                  )}
                </div>

                {adding === spec.id && (
                  <div className="mt-4 border-t border-gray-800 pt-4 space-y-3">
                    {spec.required_fields.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                        <input
                          type={f.type === 'password' ? 'password' : 'text'}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 transition"
                          value={form[f.key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.type === 'url' ? 'https://' : ''}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <button onClick={save} disabled={saving} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => { setAdding(null); setForm({}) }} className="text-gray-400 hover:text-white text-sm transition">
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
    </div>
  )
}
