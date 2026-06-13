'use client'

import { useState, useRef, useEffect } from 'react'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${BASE}/api/chat/history`)
      .then(r => r.json())
      .then(d => {
        if (d.history?.length) setMessages(d.history.slice(-40))
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
        { role: 'assistant', content: assistantMsg },
      ])
    }
    setStreaming(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <a href={`${BASE}/digest`} className="text-gray-400 hover:text-white text-sm transition">← Digest</a>
        <span className="text-gray-700">|</span>
        <span className="font-semibold text-white">Ask Yoracle</span>
      </nav>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-4xl mb-4">&#x1F52E;</p>
            <p>Ask me anything about your business — revenue, customers, performance.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-2xl px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-brand-500 text-white'
                : 'bg-gray-800 text-gray-100'
            }`}>
              {m.content || <span className="animate-pulse text-gray-500">Thinking…</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-800 px-6 py-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition text-sm"
            placeholder="Ask about ARR, churn, margins, pipeline…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium transition text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
