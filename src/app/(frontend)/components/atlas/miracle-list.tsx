// src/app/(frontend)/components/atlas/miracle-list.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const PAGE_SIZE = 16

export function MiracleList({
  miracles,
  selectedSlug,
  hoveredSlug,
  onSelect,
  onHover,
  scrollRoot,
  className,
}: {
  miracles: MiracleSummary[]
  selectedSlug: string | null
  hoveredSlug: string | null
  onSelect: (slug: string) => void
  onHover: (slug: string | null) => void
  /** The scrollable ancestor that owns the visible viewport for this list.
      On desktop, the left column (its overflow-y-auto wrapper). On mobile
      and other contexts, leave undefined to use the document viewport. */
  scrollRoot?: Element | null
  className?: string
}) {
  // Track the last `miracles` reference; when it changes we reset pagination
  // synchronously during render via a state setter (the React-19-recommended
  // pattern in place of a setState-in-effect).
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [lastMiracles, setLastMiracles] = useState(miracles)
  if (lastMiracles !== miracles) {
    setLastMiracles(miracles)
    setVisibleCount(PAGE_SIZE)
  }

  // Infinite scroll: a 1px sentinel below the last rendered card. When it
  // intersects the scroll root (with a 400px rootMargin so we preload before
  // the user actually hits the bottom), bump visibleCount by another page.
  // Only mount the observer when there's still more to load.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const hasMore = visibleCount < miracles.length
  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(miracles.length, c + PAGE_SIZE))
        }
      },
      { root: scrollRoot ?? null, rootMargin: '400px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [scrollRoot, miracles.length, hasMore])

  if (miracles.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-ink/10 bg-vellum-deep px-6 py-10 text-center',
          className,
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Nothing matches these filters
        </p>
        <p className="mt-3 font-display text-xl italic leading-tight text-ink">
          Loosen the filters or pull the timeline forward.
        </p>
      </div>
    )
  }

  const shown = miracles.slice(0, visibleCount)
  const remaining = miracles.length - shown.length

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ol className="flex flex-col gap-3">
        {shown.map((m) => {
          const isSelected = m.slug === selectedSlug
          const isHovered = m.slug === hoveredSlug
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelect(m.slug)}
                onMouseEnter={() => onHover(m.slug)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(m.slug)}
                onBlur={() => onHover(null)}
                aria-pressed={isSelected}
                className={cn(
                  'group flex w-full items-stretch gap-4 rounded-2xl border bg-vellum/85 p-3 text-left transition-all',
                  isSelected
                    ? 'border-ink shadow-altar'
                    : isHovered
                      ? 'border-ink/30 shadow-altar'
                      : 'border-ink/10 hover:border-ink/20',
                )}
              >
                <Thumbnail miracle={m} highlighted={isSelected || isHovered} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block size-2 rounded-full"
                      style={{ backgroundColor: PIN_HEX[m.type] }}
                    />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                      {TYPE_LABEL[m.type]} · {STATUS_LABEL[m.ecclesialStatus]}
                    </span>
                  </div>
                  <h3 className="mt-1 truncate font-display text-xl italic leading-tight text-ink group-hover:text-rubric-deep md:text-2xl">
                    {m.title}
                  </h3>
                  <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {m.locationName} · {formatYear(m.yearOccurred, m.dateApproximate)}
                    {m.isSample ? ' · [Sample]' : ''}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                    {m.summary}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {hasMore ? (
        // Sentinel — IntersectionObserver above watches it and increments
        // visibleCount when it enters the viewport. Loading is synchronous
        // (in-memory list slice), so no spinner is needed; the small
        // remaining-count line gives the user a sense of progress.
        <div
          ref={sentinelRef}
          aria-hidden
          className="py-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft/60"
        >
          {remaining} more · loading on scroll
        </div>
      ) : null}
    </div>
  )
}

function Thumbnail({
  miracle,
  highlighted,
}: {
  miracle: MiracleSummary
  highlighted: boolean
}) {
  const art = miracle.artwork[0]
  if (art) {
    return (
      <div
        className={cn(
          'relative size-20 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-parchment md:size-24',
          highlighted && 'ring-2 ring-rubric',
        )}
      >
        <Image
          src={art.url}
          alt={art.alt}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized={art.url.startsWith('/api/')}
        />
      </div>
    )
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink/10 md:size-24',
        highlighted && 'ring-2 ring-rubric',
      )}
      style={{ backgroundColor: PIN_HEX[miracle.type] }}
    >
      <span className="font-display text-3xl italic text-vellum/70">
        {miracle.title.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
