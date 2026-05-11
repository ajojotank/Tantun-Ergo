'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const SUGGESTED = [
  'What is the Trinity, plainly?',
  'Why do Catholics confess to a priest?',
  'What is the Real Presence in the Eucharist?',
  'How should I pray when I feel nothing?',
]

const MIN_H = 56
const MAX_H = 280

export function EmptyState() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(Math.max(el.scrollHeight, MIN_H), MAX_H)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_H ? 'auto' : 'hidden'
  }, [input])

  async function start(question: string) {
    if (!question.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/catechist/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: question.slice(0, 60) }),
      })
      if (!r.ok) {
        setError('Could not start a new inquiry. Please try again.')
        setSubmitting(false)
        return
      }
      const { id } = await r.json()
      router.push(`/catechist/c/${id}?q=${encodeURIComponent(question)}`)
    } catch {
      setError('Could not start a new inquiry. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-2xl">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
          Catechist
        </p>
        <h1 className="mt-3 text-center font-display italic tracking-tight text-ink leading-[1.0] text-5xl sm:text-6xl">
          Ask anything.
        </h1>
        <p className="mt-5 text-center font-display italic text-ink-soft leading-relaxed text-base sm:text-lg">
          An interlocutor bound to citation. It quotes the Magisterium; it never invents.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            start(input)
          }}
          className="mt-10 rounded-lg border border-ink/15 bg-vellum-deep/60 shadow-sm focus-within:border-rubric/60 focus-within:shadow-md transition-shadow"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitting}
            placeholder="Ask the Catechist…"
            style={{ height: MIN_H }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                start(input)
              }
            }}
            className="block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-lg font-display italic text-ink placeholder:text-ink-soft/60 outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between border-t border-ink/10 px-3 py-2">
            <p className="px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft/70">
              Enter to send · Shift+Enter for newline
            </p>
            <button
              type="submit"
              disabled={submitting || !input.trim()}
              className="rounded border border-ink px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ink hover:bg-ink hover:text-vellum disabled:opacity-30 transition-colors"
            >
              {submitting ? 'Beginning…' : 'Ask →'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 text-center text-sm text-rubric font-display italic">{error}</p>
        )}

        <div className="mt-10">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.28em] text-ink-soft/60">
            Or begin with —
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => start(s)}
                disabled={submitting}
                className="rounded-full border border-ink/15 bg-vellum px-4 py-2 font-display italic text-sm text-ink-soft hover:border-rubric/40 hover:text-ink transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
