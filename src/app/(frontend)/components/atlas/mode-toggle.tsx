// src/app/(frontend)/components/atlas/mode-toggle.tsx
'use client'

import { cn } from '@/lib/cn'

export type AtlasMode = 'explore' | 'pilgrimage'

export function ModeToggle({
  mode,
  onChange,
  className,
}: {
  mode: AtlasMode
  onChange: (next: AtlasMode) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Atlas mode"
      className={cn(
        'inline-flex items-center gap-px rounded-full border border-ink/10 bg-vellum/85 p-0.5 backdrop-blur',
        className,
      )}
    >
      {(['explore', 'pilgrimage'] as const).map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={cn(
              'rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              active
                ? 'bg-ink text-vellum'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {m === 'explore' ? 'Explore' : 'Pilgrimage'}
          </button>
        )
      })}
    </div>
  )
}
