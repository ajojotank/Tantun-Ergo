// src/app/(frontend)/components/atlas/timeline-scrub.tsx
'use client'

import { useState } from 'react'

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
  const [focused, setFocused] = useState(false)
  const safeValue = Math.min(Math.max(value, min), max)

  // Native <input type="range"> hijacks page scroll when the cursor is over
  // it. Only respond to wheel events when the user has explicitly focused
  // the slider — that way page scroll stays smooth as you mouse over.
  function handleWheel(e: React.WheelEvent<HTMLInputElement>) {
    if (!focused) return
    e.preventDefault()
    const step = e.deltaY > 0 ? -1 : 1
    const next = Math.min(Math.max(safeValue + step, min), max)
    if (next !== safeValue) onChange(next)
  }

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
        onWheel={handleWheel}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Filter miracles by year (focus then scroll, or drag the handle)"
        className="h-1 w-full cursor-ew-resize appearance-none rounded-full bg-ink/15 accent-rubric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rubric"
      />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
