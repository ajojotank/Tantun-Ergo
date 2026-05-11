'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Composer } from './composer'
import { Message, type StoredMessage } from './message'

interface Props {
  conversationId: string
  title: string
  initialMessages: StoredMessage[]
}

export function Conversation({ conversationId, title, initialMessages }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [localTitle, setLocalTitle] = useState(title)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const firstQuestionFiredRef = useRef(false)

  // Convert StoredMessage[] to UIMessage[] for useChat initialMessages.
  // UIMessage requires id, role, and parts[]. We map content to a text part.
  const uiInitialMessages = initialMessages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text' as const, text: m.content }],
    // Attach citations as metadata so Message can render footnotes
    metadata: { citations: m.citations },
  }))

  // v3 useChat: returns { messages, sendMessage, status, error, ... }
  // No input/handleInputChange/handleSubmit — we manage input via useState.
  // Body composition: use DefaultChatTransport with prepareSendMessagesRequest
  // so the route receives { conversationId, question } instead of { messages }.
  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: '/api/catechist/ask',
      prepareSendMessagesRequest({ messages: msgs, id }) {
        // Find the last user message — that is the question just submitted.
        const lastUser = [...msgs].reverse().find((m) => m.role === 'user')
        const question =
          lastUser?.parts.find((p): p is { type: 'text'; text: string } => p.type === 'text')
            ?.text ?? ''
        return {
          body: {
            conversationId: id,
            question,
          },
        }
      },
    }),
    messages: uiInitialMessages,
    // Refresh the server tree when the stream completes so the sidebar
    // picks up the AI-generated title (set in the route's onFinish on the
    // first turn) and any other server-rendered state.
    onFinish: () => {
      router.refresh()
    },
  })

  // Sync localTitle when the server-rendered title prop changes (e.g.,
  // after router.refresh() picks up the AI-generated title from onFinish).
  useEffect(() => {
    setLocalTitle(title)
  }, [title])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // If the user arrived from /catechist with a `?q=` query param (the empty
  // state composer creates a conversation then routes here with the question
  // in the URL), auto-fire that first question once on mount, then strip the
  // param so a refresh doesn't re-send.
  useEffect(() => {
    if (firstQuestionFiredRef.current) return
    if (initialMessages.length > 0) return
    const q = params.get('q')
    if (!q || !q.trim()) return
    firstQuestionFiredRef.current = true
    sendMessage({ text: q })
    setLocalTitle(q.slice(0, 60))
    router.replace(`/catechist/c/${conversationId}`)
  }, [params, initialMessages.length, sendMessage, router, conversationId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    if (initialMessages.length === 0 && messages.length === 0) {
      setLocalTitle(input.slice(0, 60))
    }
    setInput('')
  }

  const isStreaming = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0 && !isStreaming

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {!isEmpty && (
        <header className="sticky top-0 z-10 bg-vellum/95 backdrop-blur border-b border-ink/10 px-5 sm:px-8 py-3">
          <h1 className="font-display italic text-ink truncate text-base sm:text-lg">{localTitle}</h1>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto ${isEmpty ? 'flex flex-col items-center justify-center' : ''}`}>
        {isEmpty ? (
          <div className="w-full max-w-2xl px-5 sm:px-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">Catechist</p>
            <h1 className="mt-3 font-display italic tracking-tight text-ink leading-[1.0] text-4xl sm:text-5xl">
              {localTitle && localTitle !== 'New inquiry' ? localTitle : 'How may I help?'}
            </h1>
            <p className="mt-4 font-display italic text-ink-soft text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              Bound to citation. Quotes the Magisterium; never invents.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-5 sm:px-8 py-8">
            {messages.map((m) => {
              const textPart = m.parts.find(
                (p): p is { type: 'text'; text: string } => p.type === 'text',
              )
              const content = textPart?.text ?? ''

              const toolInvocations = m.parts.filter((p) => {
                const t = p.type as string
                return t.startsWith('tool-') || t === 'dynamic-tool'
              })

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const citations = ((m as any).metadata?.citations as any[]) ?? []

              return (
                <Message
                  key={m.id}
                  role={m.role as 'user' | 'assistant'}
                  content={content}
                  citations={citations}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  toolInvocations={toolInvocations as any[]}
                />
              )
            })}

            {isStreaming && messages.at(-1)?.role !== 'assistant' && (
              <div className="my-6 font-display italic text-ink-soft/60 text-sm animate-pulse">
                The Catechist is reflecting…
              </div>
            )}

            {error && (
              <p className="text-rubric font-display italic text-sm mt-2">
                {error.message?.includes('rate_limited')
                  ? "You've reached today's inquiry limit. The Catechist returns at midnight."
                  : error.message?.includes('no_corpus')
                    ? "I have no sources ingested yet. An editor needs to upload Scripture, the Catechism, and other corpus documents in the Studio before I can answer."
                    : 'Something went wrong reaching the Catechist. Try again.'}
              </p>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <Composer
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        disabled={isStreaming}
        placeholder={isEmpty ? 'Ask the Catechist…' : 'Ask another…'}
      />
    </div>
  )
}
