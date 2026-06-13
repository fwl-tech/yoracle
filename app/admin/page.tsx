import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = getSupabaseClient()
  const { data: user } = await db.from('users').select('role, org_id').eq('clerk_user_id', userId).maybeSingle()
  if (!user || user.role !== 'admin') redirect('/digest')

  const [{ data: users }, { data: connectors }, { data: ontology }] = await Promise.all([
    db.from('users').select('id, name, email, role, created_at').eq('org_id', user.org_id),
    db.from('connectors').select('id, system_type, status, last_synced').eq('org_id', user.org_id),
    db.from('ontologies').select('*').eq('org_id', user.org_id).order('version', { ascending: false }).limit(1).maybeSingle(),
  ])

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <a href={`${BASE}/digest`} className="text-gray-400 hover:text-white text-sm transition">&larr; Digest</a>
        <span className="font-semibold text-white">Org Admin</span>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Users ({users?.length ?? 0})</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-left">
                  <th className="px-5 py-3 text-gray-400 font-medium">Name</th>
                  <th className="px-5 py-3 text-gray-400 font-medium">Email</th>
                  <th className="px-5 py-3 text-gray-400 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map(u => (
                  <tr key={u.id} className="border-t border-gray-800">
                    <td className="px-5 py-3 text-white">{u.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-300">{u.email}</td>
                    <td className="px-5 py-3"><span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Connectors</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(connectors ?? []).map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="font-medium text-white capitalize">{c.system_type}</p>
                <p className={`text-xs mt-1 ${c.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>{c.status}</p>
                <p className="text-xs text-gray-500 mt-1">{c.last_synced ? `Synced ${new Date(c.last_synced).toLocaleDateString()}` : 'Never synced'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Ontology (v{ontology?.version ?? 0})</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <pre className="text-xs text-gray-300 overflow-auto">{JSON.stringify(ontology, null, 2)}</pre>
          </div>
        </section>
      </main>
    </div>
  )
}
