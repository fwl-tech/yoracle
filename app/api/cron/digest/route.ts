import { NextRequest, NextResponse } from 'next/server'
import { runScheduledDigests } from '@/lib/digest'
import { syncAllConnectors } from '@/lib/connectors/sync'

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [digestResult, syncResult] = await Promise.all([
    runScheduledDigests(),
    syncAllConnectors(),
  ])

  return NextResponse.json({ digest: digestResult, sync: syncResult })
}
