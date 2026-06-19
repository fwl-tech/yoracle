import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature, handleSlackMessage, stripBotMention } from '@/lib/slack'

export async function POST(req: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 503 })
  }

  const body = await req.text()
  const signature = req.headers.get('x-slack-signature') ?? ''
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''

  if (!verifySlackSignature(signingSecret, signature, timestamp, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // URL verification challenge
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge })
  }

  if (payload.type === 'event_callback') {
    const event = payload.event

    // Ignore bot messages and message edits
    if (event.bot_id || event.subtype) {
      return NextResponse.json({ ok: true })
    }

    const isDM = event.channel_type === 'im'
    const isMention = event.type === 'app_mention'

    if ((isDM && event.type === 'message') || isMention) {
      const text = stripBotMention(event.text ?? '', process.env.SLACK_BOT_USER_ID)
      if (text) {
        // Process async — Slack requires response within 3s
        handleSlackMessage(event.user, event.channel, text, isMention ? event.ts : undefined).catch(console.error)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
