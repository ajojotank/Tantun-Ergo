// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type MapRef } from 'react-map-gl/mapbox'

import { CollapsibleMap } from './collapsible-map'
import { FilterChips } from './filter-chips'
import { Globe } from './globe'
import { MiracleDrawer } from './miracle-drawer'
import { MiracleList } from './miracle-list'
import { ModeToggle } from './mode-toggle'
import { SearchInput } from './search-input'
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
  const orbitRef = useRef<OrbitHandle | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialFocusSlug ?? null,
  )
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<MiracleType>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EcclesialStatus>>(
    new Set(),
  )
  const [yearMax, setYearMax] = useState(MAX_YEAR)
  const [isOrbiting, setIsOrbiting] = useState(false)
  const [query, setQuery] = useState('')

  const visibleMiracles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return miracles.filter((m) => {
      if (m.yearOccurred > yearMax) return false
      if (selectedTypes.size > 0 && !selectedTypes.has(m.type)) return false
      if (
        selectedStatuses.size > 0 &&
        !selectedStatuses.has(m.ecclesialStatus)
      )
        return false
      if (q.length > 0) {
        const haystack = `${m.title} ${m.locationName} ${m.summary}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [miracles, yearMax, selectedTypes, selectedStatuses, query])

  const selected = useMemo(
    () => miracles.find((m) => m.slug === selectedSlug) ?? null,
    [miracles, selectedSlug],
  )

  // Start a slow 360° orbit around the selected miracle once the flyTo
  // settles. Stops on selection change or any user map interaction.
  useEffect(() => {
    // Always cancel any prior orbit on selection change. Stopping fires
    // onStop which clears `isOrbiting`; no direct setState here (would be a
    // cascading-render lint violation).
    orbitRef.current?.stop()
    orbitRef.current = null

    if (!selectedSlug) return

    // Wait until flyTo's animation has settled, then orbit.
    const startTimer = window.setTimeout(() => {
      const desktopVisible =
        desktopMapRef.current && isMapVisible(desktopMapRef.current)
      const target = desktopVisible
        ? desktopMapRef.current
        : mobileMapRef.current
      if (!target) return
      orbitRef.current = startOrbit(target.getMap(), {
        onStop: () => setIsOrbiting(false),
      })
      // setIsOrbiting(true) lives in a timer callback (not the effect body)
      // so it's safe — fires after a paint.
      setIsOrbiting(true)
    }, FLY_TO_OPTS.duration + 200)

    return () => {
      window.clearTimeout(startTimer)
      orbitRef.current?.stop()
      orbitRef.current = null
      // setIsOrbiting(false) covered by orbit's onStop on the line above.
    }
  }, [selectedSlug])

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
    // If rotation is active, the user clicking an empty area of the map is
    // most likely trying to stop the rotation — not dismiss the drawer.
    // Stop rotation; keep drawer open. A second click (no rotation now) will
    // close the drawer.
    if (orbitRef.current && isOrbiting) {
      orbitRef.current.stop()
      return
    }
    setSelectedSlug(null)
  }

  function pauseOrbit() {
    orbitRef.current?.stop()
  }

  const searchInput = (
    <SearchInput value={query} onChange={setQuery} />
  )

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
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pt-2 pb-4 sm:px-8">
          {searchInput}
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
          {isOrbiting ? <PauseOrbitPill onPause={pauseOrbit} /> : null}
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

      {/* Desktop: list left + sticky 3D globe right.
          Both columns are sticky-positioned at 100dvh — the list scrolls inside
          its column, the map fills its column. Page can still scroll past the
          hero; once the work area is at top, internal scroll takes over. */}
      <div className="hidden md:block">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(0,55%)] border-y border-ink/10">
          <div className="sticky top-0 flex h-[100dvh] flex-col gap-6 overflow-y-auto px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-3">
              {searchInput}
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
            {isOrbiting ? <PauseOrbitPill onPause={pauseOrbit} /> : null}
          </div>
        </div>
      </div>

      <MiracleDrawer miracle={selected} onClose={handleDeselect} />
    </div>
  )
}

function PauseOrbitPill({ onPause }: { onPause: () => void }) {
  return (
    <button
      type="button"
      onClick={onPause}
      aria-label="Pause map rotation"
      className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-vellum/95 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink shadow-altar backdrop-blur transition-colors hover:bg-vellum"
    >
      <span aria-hidden>⏸</span>
      Pause rotation
    </button>
  )
}

// Crude visibility check — if the map's container has display:none, getMap()
// still returns the instance but its container's offsetParent is null.
function isMapVisible(mapRef: MapRef): boolean {
  const container = mapRef.getMap().getContainer()
  return container.offsetParent !== null
}

type MapboxMap = ReturnType<MapRef['getMap']>

type OrbitHandle = {
  stop: () => void
}

// Slowly rotate the map's bearing around the current centre after a flyTo
// completes — gives the "360 rotoscope around the cathedral" feel. Stops on
// any user interaction (drag, wheel, pinch). Returns a handle so the caller
// can stop manually (e.g. when selection changes).
function startOrbit(
  map: MapboxMap,
  options: { durationMs?: number; onStop?: () => void } = {},
): OrbitHandle {
  const { durationMs = 60000, onStop } = options
  let active = true
  let rafId = 0
  const startTime = performance.now()
  const initialBearing = map.getBearing()

  function step(now: number) {
    if (!active) return
    const elapsed = now - startTime
    const bearing = (initialBearing + (elapsed / durationMs) * 360) % 360
    map.setBearing(bearing)
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)

  function onUserInteract() {
    stop()
  }

  // Mapbox surfaces drag/zoom/touch via these events. `dragstart` fires for
  // pan; `wheel`/`touchstart` cover zoom and pinch.
  map.on('dragstart', onUserInteract)
  map.on('wheel', onUserInteract)
  map.on('touchstart', onUserInteract)

  function stop() {
    if (!active) return
    active = false
    cancelAnimationFrame(rafId)
    map.off('dragstart', onUserInteract)
    map.off('wheel', onUserInteract)
    map.off('touchstart', onUserInteract)
    onStop?.()
  }

  return { stop }
}
