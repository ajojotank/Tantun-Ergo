// src/app/(frontend)/components/atlas/filter-panel.tsx
'use client'

import { type ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/cn'

/**
 * Collapsible wrapper for the search + filter chips + timeline scrub.
 * Used on BOTH desktop (sticky to the top of the left scroll column) and
 * mobile (between the collapsible map and the list). Toggle button shows
 * the count of active filters; an optional "Clear" button appears next to
 * it when filters are active.
 *
 * `activeCount` is supplied by the caller — AtlasShell already tracks the
 * filter state and can sum the active chips, the search query, and the
 * timeline scrub's "is restricted" flag into a single number.
 *
 * `onClear` is also caller-supplied — it should reset the same filter
 * state to defaults. The button only renders when `onClear` is provided
 * AND `activeCount > 0`.
 */
export function FilterPanel({
  activeCount,
  onClear,
  children,
  className,
}: {
  activeCount: number
  onClear?: () => void
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn('border-b border-ink/10 bg-vellum/95 backdrop-blur', className)}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel-body"
          className="flex flex-1 items-center justify-between px-5 py-3 text-left sm:px-8"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
          </span>
          <span aria-hidden className="text-base leading-none text-ink-soft">
            {open ? '−' : '+'}
          </span>
        </button>
        {onClear && activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="border-l border-ink/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-rubric transition-colors hover:text-rubric-deep sm:px-6"
          >
            Clear
          </button>
        ) : null}
      </div>

      <motion.div
        id="filter-panel-body"
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.6 }}
        // `inert` removes the panel from tab order, AT, and pointer events
        // when collapsed — so the search input + chips + slider inside don't
        // remain reachable while invisible. React 19 supports `inert` as a
        // boolean prop directly.
        inert={!open}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 px-5 pb-4 sm:px-8">{children}</div>
      </motion.div>
    </div>
  )
}
