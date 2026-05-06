// src/app/(frontend)/components/atlas/collapsible-map.tsx
'use client'

import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

const COLLAPSED_HEIGHT = '16rem' // h-64
const EXPANDED_HEIGHT = '80dvh'

const SPRING = { type: 'spring', stiffness: 220, damping: 30, mass: 0.6 } as const

export function CollapsibleMap({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      animate={{ height: expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT }}
      transition={SPRING}
      className={cn(
        'sticky top-0 z-20 w-full overflow-hidden border-b border-ink/10 bg-ink',
        className,
      )}
    >
      <div className="absolute inset-0">{children}</div>

      {/* Toggle handle — bottom-centre when collapsed, top-right when expanded. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse map' : 'Expand map'}
        className={cn(
          'absolute z-10 inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-vellum/95 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink shadow-altar backdrop-blur',
          expanded
            ? 'right-3 top-3'
            : 'bottom-3 left-1/2 -translate-x-1/2',
        )}
      >
        <span aria-hidden>{expanded ? '✕' : '↕'}</span>
        {expanded ? 'Collapse' : 'Expand map'}
      </button>
    </motion.div>
  )
}
