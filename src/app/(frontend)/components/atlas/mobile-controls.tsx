// src/app/(frontend)/components/atlas/mobile-controls.tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type SheetKey = 'filter' | 'year' | null

const SPRING = { type: 'spring', stiffness: 240, damping: 32, mass: 0.6 } as const

export function MobileControls({
  filterCount,
  filterPanel,
  yearLabel,
  yearPanel,
  className,
}: {
  filterCount: number
  filterPanel: ReactNode
  yearLabel: string
  yearPanel: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState<SheetKey>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={cn('pointer-events-none', className)}>
      <button
        type="button"
        onClick={() => setOpen('filter')}
        aria-haspopup="dialog"
        aria-expanded={open === 'filter'}
        className="pointer-events-auto fixed right-4 top-24 z-20 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-vellum/95 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink shadow-altar backdrop-blur"
      >
        <span aria-hidden>⚑</span>
        Filter
        {filterCount > 0 ? (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-rubric font-mono text-[10px] text-vellum">
            {filterCount}
          </span>
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => setOpen('year')}
        aria-haspopup="dialog"
        aria-expanded={open === 'year'}
        className="pointer-events-auto fixed bottom-6 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-vellum/95 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink shadow-altar backdrop-blur"
      >
        <span aria-hidden>≡</span>
        Year
        <span className="font-display text-base italic leading-none">
          {yearLabel}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="backdrop"
              type="button"
              aria-label="Close panel"
              onClick={() => setOpen(null)}
              className="pointer-events-auto fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.aside
              key={`sheet-${open}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`sheet-${open}-title`}
              className="pointer-events-auto fixed inset-x-0 bottom-0 z-40 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-ink/10 bg-vellum px-5 pb-8 pt-6 shadow-altar"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={SPRING}
            >
              <header className="mb-4 flex items-baseline justify-between">
                <h2
                  id={`sheet-${open}-title`}
                  className="font-display text-2xl italic leading-tight text-ink"
                >
                  {open === 'filter' ? 'Filters' : 'Timeline'}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
                >
                  Done
                </button>
              </header>
              {open === 'filter' ? filterPanel : yearPanel}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
