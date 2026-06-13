'use client'

import { useState, useEffect } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({ email: true, slack: true, digest_time: '07:00' })
  const [saved, setSaved] = useState(false)

  async function save() {
    await fetch(`${BASE}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_prefs: prefs }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <a href={`${BASE}/digest`} className="text-gray-400 hover:text-white text-sm transition">← Digest</a>
        <span className="font-semibold text-white">Settings</span>
      </nav>
      <main className="max-w-lg mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-white">Notification preferences</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Daily email digest</p>
              <p className="text-sm text-gray-400">Receive your insights by email each morning</p>
            </div>
            <input type="checkbox" checked={prefs.email} onChange={e => setPrefs(p => ({ ...p, email: e.target.checked }))} className="w-5 h-5 accent-brand-500" />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Slack DM</p>
              <p className="text-sm text-gray-400">Receive insights and ask questions via Slack</p>
            </div>
            <input type="checkbox" checked={prefs.slack} onChange={e => setPrefs(p => ({ ...p, slack: e.target.checked }))} className="w-5 h-5 accent-brand-500" />
          </label>
          <div>
            <label className="block">
              <p className="text-white font-medium mb-1">Digest delivery time</p>
              <p className="text-sm text-gray-400 mb-2">What time should your daily digest arrive?</p>
              <input type="time" value={prefs.digest_time} onChange={e => setPrefs(p => ({ ...p, digest_time: e.target.value }))} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500 transition" />
            </label>
          </div>
        </div>
        <button onClick={save} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium transition">
          {saved ? 'Saved ✓' : 'Save preferences'}
        </button>
      </main>
    </div>
  )
}
