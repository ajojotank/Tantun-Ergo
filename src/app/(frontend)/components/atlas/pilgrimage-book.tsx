// src/app/(frontend)/components/atlas/pilgrimage-book.tsx
'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'
import {
  type PilgrimageRouteStop,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
  romanize,
} from './types'

const SWIPE_THRESHOLD_PX = 60

/**
 * Paged-chapter reader for a pilgrimage. One chapter visible at a time;
 * advance via Prev/Next buttons, keyboard ←/→, or horizontal swipe on
 * touch. Pure UI — accepts `activeIdx` and change handlers from the
 * parent (PilgrimageShell), which also drives the shared map.
 */
export function PilgrimageBook({
  stops,
  activeIdx,
  onPrev,
  onNext,
  onJump,
  className,
}: {
  stops: PilgrimageRouteStop[]
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onJump: (idx: number) => void
  className?: string
}) {
  const onPrevRef = useRef(onPrev)
  const onNextRef = useRef(onNext)
  useEffect(() => {
    onPrevRef.current = onPrev
    onNextRef.current = onNext
  }, [onPrev, onNext])

  // Keyboard nav. Listener installed once; reads handlers from refs so the
  // parent can pass inline arrows without re-installing the listener.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't hijack OS-level shortcuts. Cmd+ArrowLeft (macOS browser back),
      // Alt+ArrowLeft (Win/Linux browser back), and any other modifier combo
      // belong to the browser/OS, not the chapter pager.
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      // Don't hijack typing in inputs (none expected in this view, but be safe).
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrevRef.current()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNextRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD_PX) onPrev()
      else if (info.offset.x < -SWIPE_THRESHOLD_PX) onNext()
    },
    [onPrev, onNext],
  )

  if (stops.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-6 py-24 text-center',
          className,
        )}
      >
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  const stop = stops[activeIdx]
  const total = stops.length
  const isFirst = activeIdx === 0
  const isLast = activeIdx === total - 1

  return (
    <section
      aria-label="Pilgrimage chapters"
      className={cn('relative flex h-full flex-col', className)}
    >
      {/* Chapter pane — Framer animates between activeIdx values. Drag-x lets
          touch users swipe through. */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={activeIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.7 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="atlas-scroll absolute inset-0 flex flex-col gap-6 overflow-y-auto px-6 pb-24 pt-6 lg:px-10"
          >
            <Chapter stop={stop} index={activeIdx} total={total} />
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Sticky bottom bar: Prev / "Chapter X of Y" / Next + dot indicators. */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-ink/10 bg-vellum/95 px-6 py-3 backdrop-blur lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Previous chapter"
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              isFirst ? 'text-ink-soft/30' : 'text-ink-soft hover:text-ink',
            )}
          >
            <span aria-hidden>←</span>
            Prev
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Chapter {romanize(activeIdx + 1)} of {romanize(total)}
          </p>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            aria-label="Next chapter"
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              isLast ? 'text-ink-soft/30' : 'text-ink-soft hover:text-ink',
            )}
          >
            Next
            <span aria-hidden>→</span>
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Jump to chapter"
          className="flex items-center justify-center gap-1.5"
        >
          {stops.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Chapter ${i + 1}`}
              onClick={() => onJump(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeIdx ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25 hover:bg-ink/40',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Chapter({
  stop,
  index,
  total,
}: {
  stop: PilgrimageRouteStop
  index: number
  total: number
}) {
  const { miracle, chapterNote } = stop
  const body = chapterNote && chapterNote.trim() ? chapterNote : miracle.summary

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Chapter {romanize(index + 1)} of {romanize(total)}
      </p>
      <h2 className="font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
        {miracle.title}
      </h2>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: PIN_HEX[miracle.type] }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]} ·{' '}
          {miracle.locationName} ·{' '}
          {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
        </span>
      </div>
      <p className="text-base leading-relaxed text-ink-soft lg:text-lg">{body}</p>

      {miracle.sources.length > 0 ? (
        <ul className="mt-2 space-y-1 border-l-2 border-rubric/40 pl-4 font-mono text-[11px] text-ink-soft">
          {miracle.sources.slice(0, 3).map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline-offset-2 hover:underline"
                >
                  {s.label}
                </a>
              ) : (
                s.label
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
