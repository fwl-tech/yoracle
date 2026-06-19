'use client'

import { useState } from 'react'
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/lib/rbac'
import type { UserRole } from '@/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

interface OrgUser {
  id: string
  name: string | null
  email: string
  role: UserRole
}

interface ConnectorInfo {
  id: string
  system_type: string
  status: string
  last_synced: string | null
}

interface AdminClientProps {
  users: OrgUser[]
  connectors: ConnectorInfo[]
  ontology: Record<string, unknown> | null
}

export default function AdminClient({ users: initialUsers, connectors, ontology: initialOntology }: AdminClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [ontologyJson, setOntologyJson] = useState(JSON.stringify(initialOntology, null, 2))
  const [saved, setSaved] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  async function updateRole(userId: string, role: UserRole) {
    await fetch(`${BASE}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  async function saveOntology() {
    try {
      const parsed = JSON.parse(ontologyJson)
      await fetch(`${BASE}/api/admin/ontology`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Invalid JSON')
    }
  }

  async function syncConnector(id: string) {
    setSyncing(id)
    await fetch(`${BASE}/api/connectors/${id}/sync`, { method: 'POST' })
    setSyncing(null)
    window.location.reload()
  }

  return (
    <div className="page-main space-y-8 sm:space-y-10">
      <header className="page-header !mb-2">
        <p className="section-label">Administration</p>
        <h1 className="page-title">Workspace settings</h1>
        <p className="page-subtitle">Manage users, connectors, and your organisation ontology.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink">Users ({users.length})</h2>

        <div className="md:hidden space-y-3">
          {users.map(u => (
            <div key={u.id} className="card p-4 space-y-3">
              <div>
                <p className="font-medium text-ink">{u.name ?? '—'}</p>
                <p className="text-sm text-ink-secondary truncate">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={e => updateRole(u.id, e.target.value as UserRole)}
                className="select-field w-full text-xs"
              >
                {ASSIGNABLE_ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>

        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-faint/50 bg-surface-inset/50">
                <tr className="text-left">
                  <th className="px-5 py-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-ink-muted font-medium text-xs uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-ink-faint/40 hover:bg-surface-inset/30">
                    <td className="px-5 py-3 text-ink font-medium">{u.name ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-secondary">{u.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value as UserRole)}
                        className="select-field text-xs py-1.5"
                      >
                        {ASSIGNABLE_ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink">Connectors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {connectors.map(c => (
            <div key={c.id} className="card p-4">
              <p className="font-medium text-ink capitalize">{c.system_type}</p>
              <p className={`text-xs mt-1 font-medium ${c.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>{c.status}</p>
              <p className="text-xs text-ink-muted mt-1">
                {c.last_synced ? `Synced ${new Date(c.last_synced).toLocaleDateString()}` : 'Never synced'}
              </p>
              <button
                onClick={() => syncConnector(c.id)}
                disabled={syncing === c.id}
                className="mt-3 text-xs text-accent-600 hover:text-accent-700 font-medium transition disabled:opacity-50 min-h-9"
              >
                {syncing === c.id ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
          ))}
          {connectors.length === 0 && (
            <p className="text-sm text-ink-muted sm:col-span-3">No connectors configured. <a href={`${BASE}/connectors`} className="text-accent-600 hover:underline font-medium">Add one</a></p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink">Ontology</h2>
          <button onClick={saveOntology} className="btn-primary text-sm py-2.5 w-full sm:w-auto">
            {saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
        <textarea
          value={ontologyJson}
          onChange={e => setOntologyJson(e.target.value)}
          rows={12}
          className="w-full card p-4 sm:p-5 text-xs text-ink-secondary font-mono focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400 min-h-[200px]"
        />
      </section>
    </div>
  )
}
