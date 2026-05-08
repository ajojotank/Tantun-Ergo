'use client'

interface Props {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
  placeholder: string
}

export function Composer({ input, onChange, onSubmit, disabled, placeholder }: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 bg-vellum/95 backdrop-blur border-t border-ink/10 px-6 py-4"
    >
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          value={input}
          onChange={onChange}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ;(e.target as HTMLTextAreaElement).form?.requestSubmit()
            }
          }}
          className="flex-1 resize-none border-b border-ink/30 bg-transparent px-0 py-2 text-lg font-display italic text-ink placeholder:text-ink-soft/60 outline-none focus:border-rubric disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="border border-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum disabled:opacity-30 transition-colors"
        >
          Ask
        </button>
      </div>
    </form>
  )
}
