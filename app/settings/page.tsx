'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { ROLE_LABELS } from '@/lib/rbac'
import type { UserRole } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
]

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({ email: true, slack: true, digest_time: '07:00' })
  const [timezone, setTimezone] = useState('UTC')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState<UserRole>('ceo')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/api/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.settings) {
          setPrefs(d.settings.notification_prefs ?? prefs)
          setTimezone(d.settings.timezone ?? 'UTC')
          setDepartment(d.settings.department ?? '')
          setRole(d.settings.role ?? 'ceo')
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function save() {
    await fetch(`${BASE}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_prefs: prefs, timezone, department }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-base flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    )
  }

  return (
    <AppShell active="settings">
      <main className="max-w-lg mx-auto px-4 sm:px-8 py-6 sm:py-10 pb-nav space-y-6 sm:space-y-8">
        <header className="page-header !mb-2">
          <p className="section-label">Account</p>
          <h1 className="page-title">Settings</h1>
        </header>

        <div className="card p-5 sm:p-6 space-y-5">
          <h2 className="section-label">Profile</h2>
          <div>
            <p className="text-ink font-medium mb-1">Role</p>
            <p className="text-sm text-ink-secondary">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-ink-muted mt-1">Contact your admin to change your role.</p>
          </div>
          <div>
            <label className="block">
              <p className="text-ink font-medium mb-1">Department</p>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Sales, Finance"
                className="input-field"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <p className="text-ink font-medium mb-1">Timezone</p>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="select-field w-full">
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="card p-5 sm:p-6 space-y-5">
          <h2 className="section-label">Notifications</h2>
          <label className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-ink font-medium">Daily email digest</p>
              <p className="text-sm text-ink-secondary mt-0.5">Receive your insights by email each morning</p>
            </div>
            <input type="checkbox" checked={prefs.email} onChange={e => setPrefs(p => ({ ...p, email: e.target.checked }))} className="w-5 h-5 accent-accent-500 shrink-0 mt-0.5" />
          </label>
          <label className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-ink font-medium">Slack DM</p>
              <p className="text-sm text-ink-secondary mt-0.5">Receive insights and ask questions via Slack</p>
            </div>
            <input type="checkbox" checked={prefs.slack} onChange={e => setPrefs(p => ({ ...p, slack: e.target.checked }))} className="w-5 h-5 accent-accent-500 shrink-0 mt-0.5" />
          </label>
          <div>
            <label className="block">
              <p className="text-ink font-medium mb-1">Digest delivery time</p>
              <p className="text-sm text-ink-secondary mb-2">Delivered in your local timezone ({timezone})</p>
              <input type="time" value={prefs.digest_time} onChange={e => setPrefs(p => ({ ...p, digest_time: e.target.value }))} className="input-field w-auto" />
            </label>
          </div>
        </div>

        <button onClick={save} className="btn-primary w-full sm:w-auto">
          {saved ? 'Saved ✓' : 'Save preferences'}
        </button>
      </main>
    </AppShell>
  )
}
