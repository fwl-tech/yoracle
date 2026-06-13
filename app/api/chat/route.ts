import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { streamChat } from '@/lib/ai'
import type { ChatMessage } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { message } = await req.json()
  const db = getSupabaseClient()

  const { data: user } = await db.from('users').select('*').eq('clerk_user_id', userId).single()
  if (!user) return new Response('User not found', { status: 404 })

  const { data: ontology } = await db.from('ontologies').select('*').eq('org_id', user.org_id).order('version', { ascending: false }).limit(1).maybeSingle()
  const { data: context } = await db.from('user_contexts').select('*').eq('user_id', user.id).maybeSingle()

  const history: ChatMessage[] = context?.conversation_history ?? []
  const timestamp = new Date().toISOString()

  const encoder = new TextEncoder()
  let fullResponse = ''

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamChat(user, ontology, history, message)) {
        fullResponse += chunk
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()

      // Persist conversation
      const newHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: message, timestamp },
        { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
      ]
      if (context) {
        await db.from('user_contexts').update({ conversation_history: newHistory, last_active: new Date().toISOString() }).eq('user_id', user.id)
      } else {
        await db.from('user_contexts').insert({ user_id: user.id, conversation_history: newHistory })
      }
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' } })
}
