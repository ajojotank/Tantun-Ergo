// src/app/(frontend)/components/atlas/search-input.tsx
'use client'

import { cn } from '@/lib/cn'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search miracles…',
  className,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex items-center rounded-full border border-ink/15 bg-vellum/95 px-4 py-2 transition-colors focus-within:border-ink/35',
        className,
      )}
    >
      <span aria-hidden className="mr-2 font-mono text-sm text-ink-soft">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search miracles"
        className="w-full bg-transparent font-display text-base italic leading-none text-ink placeholder:text-ink-soft/70 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="ml-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
