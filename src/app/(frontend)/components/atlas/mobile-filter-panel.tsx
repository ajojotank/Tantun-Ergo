// src/app/(frontend)/components/atlas/mobile-filter-panel.tsx
'use client'

import { type ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/cn'

/**
 * Mobile-only collapsible wrapper for the search + filter chips + timeline
 * scrub. Renders a sticky-style toggle button with a count of active
 * filters; when expanded, the children render below in a panel that
 * animates open. Designed to live BETWEEN the collapsible map (above) and
 * the miracle list (below) in the mobile branch of AtlasShell.
 *
 * `activeCount` is supplied by the caller — AtlasShell already tracks the
 * filter state and can sum the active chips, the search query, and the
 * timeline scrub's "is restricted" flag into a single number.
 */
export function MobileFilterPanel({
  activeCount,
  children,
  className,
}: {
  activeCount: number
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn('border-b border-ink/10 bg-vellum/95 backdrop-blur', className)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-left sm:px-8"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
        </span>
        <span aria-hidden className="text-base leading-none text-ink-soft">
          {open ? '−' : '+'}
        </span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.6 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 px-5 pb-4 sm:px-8">{children}</div>
      </motion.div>
    </div>
  )
}
