// src/app/(frontend)/components/atlas/miracle-list.tsx
'use client'

import Image from 'next/image'

import { cn } from '@/lib/cn'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

export function MiracleList({
  miracles,
  selectedSlug,
  hoveredSlug,
  onSelect,
  onHover,
  className,
}: {
  miracles: MiracleSummary[]
  selectedSlug: string | null
  hoveredSlug: string | null
  onSelect: (slug: string) => void
  onHover: (slug: string | null) => void
  className?: string
}) {
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

  return (
    <ol className={cn('flex flex-col gap-3', className)}>
      {miracles.map((m) => {
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
  // No artwork — paint a typed-pin block as the thumbnail.
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
