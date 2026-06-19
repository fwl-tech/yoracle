'use client'

import { useState, useEffect, useRef } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp?: string
}

function extractSources(content: string): string[] {
  const matches = content.match(/Source:\s*(\w+)/gi) ?? []
  return [...new Set(matches.map(m => m.replace(/Source:\s*/i, '')))]
}

function sessionLabel(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user')
  if (!first) return 'New conversation'
  return first.content.length > 40 ? first.content.slice(0, 40) + '…' : first.content
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sessions, setSessions] = useState<Message[][]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${BASE}/api/chat/history`)
      .then(r => r.json())
      .then(d => {
        if (d.history?.length) {
          const history = d.history.slice(-40) as Message[]
          setMessages(history)
          const groups: Message[][] = []
          let current: Message[] = []
          for (const msg of history) {
            if (current.length > 0 && msg.timestamp) {
              const prev = current[current.length - 1]
              if (prev.timestamp && msg.timestamp) {
                const gap = new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime()
                if (gap > 30 * 60 * 1000) {
                  groups.push(current)
                  current = []
                }
              }
            }
            current.push(msg)
          }
          if (current.length) groups.push(current)
          setSessions(groups)
        }
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || streaming) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)

    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let assistantMsg = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistantMsg += decoder.decode(value)
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: assistantMsg, sources: extractSources(assistantMsg) },
      ])
    }
    setStreaming(false)
  }

  function loadSession(session: Message[]) {
    setMessages(session)
    setHistoryOpen(false)
  }

  function newConversation() {
    setMessages([])
    setHistoryOpen(false)
  }

  const historyPanel = (
    <>
      <div className="p-3 sm:p-4 border-b border-ink-faint/50 shrink-0">
        <button onClick={newConversation} className="w-full btn-primary text-sm py-2.5">
          + New conversation
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessions.map((session, i) => (
          <button
            key={i}
            onClick={() => loadSession(session)}
            className="w-full text-left text-xs text-ink-secondary hover:text-ink hover:bg-surface-hover px-3 py-2.5 rounded-xl transition truncate min-h-10"
          >
            {sessionLabel(session)}
          </button>
        ))}
        {sessions.length === 0 && (
          <p className="text-xs text-ink-muted px-3 py-2">No history yet</p>
        )}
      </div>
    </>
  )

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-surface-base">
      <aside className="w-64 border-r border-ink-faint/50 bg-surface-sidebar hidden md:flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-ink-faint/40">
          <p className="section-label">Conversations</p>
        </div>
        {historyPanel}
      </aside>

      {historyOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            aria-label="Close history"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface-raised border-r border-ink-faint flex flex-col pb-safe shadow-2xl">
            <div className="flex items-center justify-between px-4 h-14 border-b border-ink-faint/50 shrink-0">
              <span className="font-medium text-ink text-sm">Conversations</span>
              <button type="button" onClick={() => setHistoryOpen(false)} className="btn-ghost rounded-xl" aria-label="Close">✕</button>
            </div>
            {historyPanel}
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-ink-faint/50 shrink-0 bg-surface-raised">
          <button type="button" onClick={() => setHistoryOpen(true)} className="btn-secondary text-xs py-2 min-h-9">
            History
          </button>
          <button type="button" onClick={newConversation} className="btn-ghost text-xs py-2 min-h-9 text-accent-600">
            New chat
          </button>
        </div>

        <div className="hidden md:block px-8 pt-8 pb-2 max-w-3xl">
          <p className="section-label">Ask AI</p>
          <h1 className="font-heading text-2xl font-medium text-ink tracking-tight">What would you like to know?</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-4 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center text-ink-muted mt-12 sm:mt-16 px-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-surface-inset border border-ink-faint/50 flex items-center justify-center mx-auto mb-4 font-heading text-xl text-ink">
                Y
              </div>
              <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                Ask about revenue, customers, margins, or anything in your connected data.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] sm:max-w-2xl px-4 sm:px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                m.role === 'user'
                  ? 'bg-ink text-surface-raised rounded-br-md'
                  : 'bg-surface-raised text-ink border border-ink-faint/50 rounded-bl-md'
              }`}>
                {m.content || <span className="animate-pulse text-ink-muted">Thinking…</span>}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-ink-faint/50 flex flex-wrap gap-1">
                    {m.sources.map(s => (
                      <span key={s} className="text-xs bg-surface-inset text-ink-muted px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-ink-faint/50 px-4 sm:px-8 py-3 sm:py-4 pb-safe shrink-0 bg-surface-raised">
          <div className="flex gap-2 sm:gap-3 max-w-3xl mx-auto">
            <input
              className="input-field flex-1"
              placeholder="Ask about ARR, churn, margins…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            />
            <button onClick={send} disabled={streaming || !input.trim()} className="btn-primary shrink-0 px-4 sm:px-5">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
