// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import { FilterChips } from './filter-chips'
import { Globe } from './globe'
import { MiracleDrawer } from './miracle-drawer'
import { ModeToggle, type AtlasMode } from './mode-toggle'
import { Pilgrimage } from './pilgrimage'
import { TimelineScrub } from './timeline-scrub'
import {
  type EcclesialStatus,
  type MiracleSummary,
  type MiracleType,
} from './types'

export function AtlasShell({
  miracles,
  styleUrl,
  initialFocusSlug,
  initialMode,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  initialFocusSlug?: string
  initialMode: AtlasMode
}) {
  const router = useRouter()
  const [mode, setMode] = useState<AtlasMode>(initialMode)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialFocusSlug ?? null,
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<MiracleType>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EcclesialStatus>>(
    new Set(),
  )

  // Year range derived from data. Default the scrub to "max" — show all.
  const { minYear, maxYear } = useMemo(() => {
    if (miracles.length === 0) return { minYear: 0, maxYear: 2100 }
    const years = miracles.map((m) => m.yearOccurred)
    return { minYear: Math.min(...years), maxYear: Math.max(...years) }
  }, [miracles])
  // Adjust during render when maxYear changes (live-preview re-fetch).
  // This is the "you might not need an effect" pattern — store previous
  // maxYear in state, compare during render, and reset yearMax in lockstep.
  const [yearMax, setYearMax] = useState(maxYear)
  const [prevMaxYear, setPrevMaxYear] = useState(maxYear)
  if (prevMaxYear !== maxYear) {
    setPrevMaxYear(maxYear)
    setYearMax(maxYear)
  }

  const pilgrimageMiracles = useMemo(
    () =>
      miracles
        .filter((m) => m.inPilgrimage)
        .sort(
          (a, b) =>
            (a.pilgrimageOrder ?? Infinity) - (b.pilgrimageOrder ?? Infinity),
        ),
    [miracles],
  )

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

  return (
    <div className="relative">
      {/* Header strip — eyebrow + mode toggle */}
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
            Begin a curated pilgrimage, or wander the whole record.
          </p>
        </div>
        <div className="hidden md:block">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      {mode === 'explore' ? (
        <ExploreView
          miracles={miracles}
          visibleMiracles={visibleMiracles}
          styleUrl={styleUrl}
          minYear={minYear}
          maxYear={maxYear}
          yearMax={yearMax}
          onYearMaxChange={setYearMax}
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          onSelectSlug={setSelectedSlug}
        />
      ) : (
        <Pilgrimage
          miracles={pilgrimageMiracles}
          styleUrl={styleUrl}
          onViewAll={() => router.push('/atlas/list')}
        />
      )}

      <MiracleDrawer
        miracle={selected}
        onClose={() => setSelectedSlug(null)}
      />
    </div>
  )
}

function ExploreView({
  miracles,
  visibleMiracles,
  styleUrl,
  minYear,
  maxYear,
  yearMax,
  onYearMaxChange,
  selectedTypes,
  onToggleType,
  selectedStatuses,
  onToggleStatus,
  onSelectSlug,
}: {
  miracles: MiracleSummary[]
  visibleMiracles: MiracleSummary[]
  styleUrl?: string
  minYear: number
  maxYear: number
  yearMax: number
  onYearMaxChange: (n: number) => void
  selectedTypes: Set<MiracleType>
  onToggleType: (t: MiracleType) => void
  selectedStatuses: Set<EcclesialStatus>
  onToggleStatus: (s: EcclesialStatus) => void
  onSelectSlug: (slug: string) => void
}) {
  return (
    <>
      {/* Desktop: full-bleed globe with overlays. Mobile: this whole branch is
          hidden because mobile is pilgrimage-only — see the wrapping page. */}
      <div className="relative hidden h-[78dvh] w-full overflow-hidden border-y border-ink/10 bg-ink md:block">
        <Globe
          miracles={visibleMiracles}
          styleUrl={styleUrl}
          onSelect={onSelectSlug}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-4">
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <FilterChips
              selectedTypes={selectedTypes}
              onToggleType={onToggleType}
              selectedStatuses={selectedStatuses}
              onToggleStatus={onToggleStatus}
            />
          </div>
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <TimelineScrub
              min={minYear}
              max={maxYear}
              value={yearMax}
              onChange={onYearMaxChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile fallback inside Explore mode: route to the catalogue. */}
      <div className="md:hidden">
        <MobileExploreFallback count={miracles.length} />
      </div>
    </>
  )
}

function MobileExploreFallback({ count }: { count: number }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <div
        className={cn(
          'rounded-3xl border border-ink/10 bg-vellum-deep px-6 py-10 text-center',
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rubric">
          The free globe is desktop-only
        </p>
        <p className="mt-3 font-display text-2xl italic leading-tight text-ink">
          Open the Atlas on a larger screen, or browse the catalogue.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {count} miracles in the corpus
        </p>
        <a
          href="/atlas/list"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum hover:bg-rubric-deep"
        >
          View catalogue →
        </a>
      </div>
    </div>
  )
}
