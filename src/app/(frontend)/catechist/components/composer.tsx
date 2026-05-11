'use client'

import { useEffect, useRef } from 'react'

interface Props {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
  placeholder: string
}

const MIN_HEIGHT = 48 // px — one line + padding
const MAX_HEIGHT = 280 // px — ~10 lines before internal scroll kicks in

export function Composer({ input, onChange, onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-grow: re-measure on every input change. Reset to auto first so
  // shrinking works when the user deletes text.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [input])

  return (
    <div className="sticky bottom-0 bg-vellum/95 backdrop-blur border-t border-ink/10 px-4 sm:px-8 py-4">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-ink/15 bg-vellum-deep/60 shadow-sm focus-within:border-rubric/60 focus-within:shadow transition-shadow">
          <textarea
            ref={ref}
            value={input}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            style={{ height: MIN_HEIGHT }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ;(e.target as HTMLTextAreaElement).form?.requestSubmit()
              }
            }}
            className="block w-full resize-none bg-transparent px-4 pt-3 pb-2 text-base sm:text-lg font-display italic text-ink placeholder:text-ink-soft/60 outline-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between border-t border-ink/10 px-3 py-1.5">
            <p className="hidden sm:block px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft/70">
              Enter to send · Shift+Enter for newline
            </p>
            <span className="sm:hidden" />
            <button
              type="submit"
              disabled={disabled || !input.trim()}
              className="rounded border border-ink px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ink hover:bg-ink hover:text-vellum disabled:opacity-30 transition-colors"
            >
              {disabled ? '…' : 'Ask →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
