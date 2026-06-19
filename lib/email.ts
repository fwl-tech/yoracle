import type { Insight } from '@/types'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email delivery')
    return { success: false, error: 'Email not configured' }
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'Yoracle <insights@yoracle.app>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { success: false, error: body }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export function buildDigestEmailHtml(userName: string, insights: Insight[]): string {
  const cards = insights.map(i => `
    <div style="border-left:4px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'warning' ? '#f59e0b' : '#4f6ef7'};padding:16px;margin-bottom:16px;background:#111827;border-radius:8px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;color:#9ca3af;">${i.category}</p>
      <h3 style="margin:0 0 8px;color:#f9fafb;">${i.title}</h3>
      <p style="margin:0;color:#d1d5db;font-size:14px;line-height:1.5;">${i.body}</p>
      ${i.suggested_actions.length > 0 ? `<p style="margin:8px 0 0;font-size:12px;color:#4f6ef7;">${i.suggested_actions.length} suggested action${i.suggested_actions.length !== 1 ? 's' : ''}</p>` : ''}
    </div>
  `).join('')

  return `
    <div style="font-family:Inter,-apple-system,sans-serif;max-width:600px;margin:0 auto;background:#030712;color:#f9fafb;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:24px;">Good morning, ${userName}</h1>
      <p style="margin:0 0 24px;color:#9ca3af;">Your personalised Yoracle digest — ${insights.length} insight${insights.length !== 1 ? 's' : ''} for today.</p>
      ${cards}
      <p style="margin-top:24px;font-size:12px;color:#6b7280;">
        <a href="https://hatchai.fairwaterlabs.com/apps/yoracle/digest" style="color:#4f6ef7;">Open in Yoracle</a>
      </p>
    </div>
  `
}
