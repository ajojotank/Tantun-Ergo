// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useMemo, useState } from 'react'

import { FilterChips } from './filter-chips'
import { Globe } from './globe'
import { MiracleDrawer } from './miracle-drawer'
import { MobileControls } from './mobile-controls'
import { ModeToggle } from './mode-toggle'
import { TimelineScrub } from './timeline-scrub'
import {
  type EcclesialStatus,
  type MiracleSummary,
  type MiracleType,
} from './types'

// Fixed year range so the slider always represents the full Christian-era
// span and doesn't re-clamp when the corpus changes. minYear is the earliest
// rounded century; maxYear is the current year (refreshed at build time).
const MIN_YEAR = 100
const MAX_YEAR = 2026

export function AtlasShell({
  miracles,
  styleUrl,
  initialFocusSlug,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  initialFocusSlug?: string
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialFocusSlug ?? null,
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<MiracleType>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EcclesialStatus>>(
    new Set(),
  )
  const [yearMax, setYearMax] = useState(MAX_YEAR)

  const visibleMiracles = useMemo(() => {
    return miracles.filter((m) => {
      if (m.yearOccurred > yearMax) return false
      if (selectedTypes.size > 0 && !selectedTypes.has(m.type)) return false
      if (
        selectedStatuses.size > 0 &&
        !selectedStatuses.has(m.ecclesialStatus)
      )
        return false
      return true
    })
  }, [miracles, yearMax, selectedTypes, selectedStatuses])

  const selected = useMemo(
    () => miracles.find((m) => m.slug === selectedSlug) ?? null,
    [miracles, selectedSlug],
  )

  function toggleType(t: MiracleType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }
  function toggleStatus(s: EcclesialStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const filterCount = selectedTypes.size + selectedStatuses.size

  return (
    <div className="relative">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between md:py-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Plate I · Cartography
          </p>
          <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
            The Miracle Atlas
          </h1>
          <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-ink-soft md:text-lg">
            A globe of approved miracles, anchored to coordinates and centuries.
            Wander the whole record, or walk a curated pilgrimage.
          </p>
        </div>
        <ModeToggle />
      </header>

      {/* Globe — full-bleed on every breakpoint. Desktop overlays filter chips
          + timeline at the bottom; mobile delegates to floating MobileControls. */}
      <div className="relative h-[78dvh] w-full overflow-hidden border-y border-ink/10 bg-ink">
        <Globe
          miracles={visibleMiracles}
          styleUrl={styleUrl}
          onSelect={setSelectedSlug}
          onDeselect={() => setSelectedSlug(null)}
        />

        {/* Desktop overlay (hidden on mobile) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden flex-col gap-3 p-4 md:flex">
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <FilterChips
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              selectedStatuses={selectedStatuses}
              onToggleStatus={toggleStatus}
            />
          </div>
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <TimelineScrub
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={yearMax}
              onChange={setYearMax}
            />
          </div>
        </div>

        {/* Mobile floating controls (hidden on desktop) */}
        <div className="md:hidden">
          <MobileControls
            filterCount={filterCount}
            filterPanel={
              <FilterChips
                selectedTypes={selectedTypes}
                onToggleType={toggleType}
                selectedStatuses={selectedStatuses}
                onToggleStatus={toggleStatus}
              />
            }
            yearLabel={`≤ ${yearMax}`}
            yearPanel={
              <TimelineScrub
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={yearMax}
                onChange={setYearMax}
              />
            }
          />
        </div>
      </div>

      <MiracleDrawer
        miracle={selected}
        onClose={() => setSelectedSlug(null)}
      />
    </div>
  )
}
