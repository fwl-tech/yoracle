// import { auth } from '@clerk/nextjs/server' // disabled — replaced with simple email/password auth
import { auth } from '@/lib/simple-auth'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import AdminClient from '@/components/AdminClient'
import { getSupabaseClient } from '@/lib/supabase'

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
    <AppShell active="admin" showAdmin>
      <AdminClient
        users={users ?? []}
        connectors={connectors ?? []}
        ontology={ontology}
      />
    </AppShell>
  )
}
