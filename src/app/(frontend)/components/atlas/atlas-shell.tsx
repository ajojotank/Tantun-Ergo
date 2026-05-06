// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useMemo, useRef, useState } from 'react'
import { type MapRef } from 'react-map-gl/mapbox'

import { CollapsibleMap } from './collapsible-map'
import { FilterChips } from './filter-chips'
import { Globe } from './globe'
import { MiracleDrawer } from './miracle-drawer'
import { MiracleList } from './miracle-list'
import { ModeToggle } from './mode-toggle'
import { TimelineScrub } from './timeline-scrub'
import {
  type EcclesialStatus,
  type MiracleSummary,
  type MiracleType,
} from './types'

// Fixed year range so the slider always represents the full Christian-era
// span and doesn't re-clamp when the corpus changes.
const MIN_YEAR = 100
const MAX_YEAR = new Date().getFullYear()

// Card-click cinematic — fly to coords at zoom 14 + pitch 50 so Mapbox
// Standard's 3D buildings + landmark cathedrals render at the arrival point.
const FLY_TO_OPTS = {
  zoom: 16, // Standard's 3D buildings + landmark cathedrals appear reliably at 15-17
  pitch: 50,
  duration: 1500,
  essential: true,
} as const

// Drawer offsets — flyTo's `padding` shifts the visual centre so the pin
// lands NOT under the drawer. Desktop drawer is 440px on the right; mobile
// drawer is a bottom-sheet at ~80dvh, so we offset upward.
const DRAWER_PADDING_DESKTOP = { top: 0, bottom: 0, left: 0, right: 440 } as const
const DRAWER_PADDING_MOBILE = { top: 0, bottom: 320, left: 0, right: 0 } as const

export function AtlasShell({
  miracles,
  styleUrl,
  initialFocusSlug,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  initialFocusSlug?: string
}) {
  // Two map refs: one for the mobile globe, one for desktop. Both branches
  // mount their own Mapbox context (the hidden branch stays idle via
  // display:none) so we forward to whichever ref is currently visible when
  // handleSelect fires. CSS controls visibility; isMapVisible picks the right
  // one at click time.
  const desktopMapRef = useRef<MapRef | null>(null)
  const mobileMapRef = useRef<MapRef | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialFocusSlug ?? null,
  )
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
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

  function handleSelect(slug: string) {
    setSelectedSlug(slug)
    const m = miracles.find((x) => x.slug === slug)
    if (!m) return
    // Fly the visible map. Try desktop first (most users), fall back to mobile.
    const desktop =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktop ? desktopMapRef.current : mobileMapRef.current
    target?.flyTo({
      center: m.coordinates,
      ...FLY_TO_OPTS,
      padding: desktop ? DRAWER_PADDING_DESKTOP : DRAWER_PADDING_MOBILE,
    })
  }

  function handleDeselect() {
    setSelectedSlug(null)
  }

  const filterChips = (
    <FilterChips
      selectedTypes={selectedTypes}
      onToggleType={toggleType}
      selectedStatuses={selectedStatuses}
      onToggleStatus={toggleStatus}
    />
  )

  const timelineScrub = (
    <TimelineScrub
      min={MIN_YEAR}
      max={MAX_YEAR}
      value={yearMax}
      onChange={setYearMax}
    />
  )

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
            Hover a card to find its pin; click to fly closer and see the
            buildings rise.
          </p>
        </div>
        <ModeToggle />
      </header>

      {/* Mobile: chips → collapsible map → timeline → cards.
          Chips sit ABOVE the map so they stay reachable when the map is
          expanded (filtering is the more frequent action). Timeline stays
          below — set once and rarely revisited. */}
      <div className="md:hidden">
        <div className="mx-auto w-full max-w-3xl px-5 pt-2 pb-4 sm:px-8">
          {filterChips}
        </div>
        <CollapsibleMap onResize={() => mobileMapRef.current?.getMap().resize()}>
          <Globe
            miracles={visibleMiracles}
            styleUrl={styleUrl}
            hoveredSlug={hoveredSlug}
            onHover={setHoveredSlug}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            mapRef={mobileMapRef}
          />
        </CollapsibleMap>
        <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
          {timelineScrub}
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            {visibleMiracles.length} of {miracles.length} miracles
          </p>
          <MiracleList
            miracles={visibleMiracles}
            selectedSlug={selectedSlug}
            hoveredSlug={hoveredSlug}
            onSelect={handleSelect}
            onHover={setHoveredSlug}
            className="mt-3"
          />
        </div>
      </div>

      {/* Desktop: list left + sticky 3D globe right */}
      <div className="hidden md:block">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(0,55%)] border-y border-ink/10">
          <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-3">
              {filterChips}
              {timelineScrub}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              {visibleMiracles.length} of {miracles.length} miracles
            </p>
            <MiracleList
              miracles={visibleMiracles}
              selectedSlug={selectedSlug}
              hoveredSlug={hoveredSlug}
              onSelect={handleSelect}
              onHover={setHoveredSlug}
            />
          </div>
          <div className="relative">
            <div className="sticky top-0 h-[100dvh] bg-ink">
              <Globe
                miracles={visibleMiracles}
                styleUrl={styleUrl}
                hoveredSlug={hoveredSlug}
                onHover={setHoveredSlug}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                mapRef={desktopMapRef}
              />
            </div>
          </div>
        </div>
      </div>

      <MiracleDrawer miracle={selected} onClose={handleDeselect} />
    </div>
  )
}

// Crude visibility check — if the map's container has display:none, getMap()
// still returns the instance but its container's offsetParent is null.
function isMapVisible(mapRef: MapRef): boolean {
  const container = mapRef.getMap().getContainer()
  return container.offsetParent !== null
}
