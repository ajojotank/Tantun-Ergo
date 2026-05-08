'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Composer } from './composer'
import { Message, type StoredMessage } from './message'

interface Props {
  conversationId: string
  title: string
  initialMessages: StoredMessage[]
}

export function Conversation({ conversationId, title, initialMessages }: Props) {
  const [localTitle, setLocalTitle] = useState(title)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
  const { messages, sendMessage, status } = useChat({
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
  })

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 bg-vellum/95 backdrop-blur border-b border-ink/10 px-6 py-3">
        <h1 className="font-display italic text-ink truncate">{localTitle}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        {messages.map((m) => {
          // Extract text content from parts
          const textPart = m.parts.find(
            (p): p is { type: 'text'; text: string } => p.type === 'text',
          )
          const content = textPart?.text ?? ''

          // Extract tool invocations from parts (type starts with 'tool-' or is 'dynamic-tool')
          const toolInvocations = m.parts.filter((p) => {
            const t = p.type as string
            return t.startsWith('tool-') || t === 'dynamic-tool'
          })

          // Citations stored in metadata (for messages loaded from DB)
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

        <div ref={bottomRef} />
      </main>

      <Composer
        input={input}
        onChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        disabled={isStreaming}
        placeholder={
          initialMessages.length === 0 && messages.length === 0
            ? 'Ask the Catechist…'
            : 'Ask another…'
        }
      />
    </div>
  )
}
