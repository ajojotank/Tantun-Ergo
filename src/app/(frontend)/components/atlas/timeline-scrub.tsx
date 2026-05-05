// src/app/(frontend)/components/atlas/timeline-scrub.tsx
'use client'

import { cn } from '@/lib/cn'

export function TimelineScrub({
  min,
  max,
  value,
  onChange,
  className,
}: {
  min: number
  max: number
  value: number
  onChange: (next: number) => void
  className?: string
}) {
  const safeValue = Math.min(Math.max(value, min), max)
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-ink/10 bg-vellum/90 px-4 py-3 backdrop-blur',
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Up to year
        </span>
        <span className="font-display text-2xl italic leading-none text-ink">
          {safeValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Filter miracles by year"
        className="h-1 w-full cursor-ew-resize appearance-none rounded-full bg-ink/15 accent-rubric"
      />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
