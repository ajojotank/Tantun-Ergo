// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { type MapRef } from 'react-map-gl/mapbox'

import { CollapsibleMap } from './collapsible-map'
import { FilterChips } from './filter-chips'
import { FilterPanel } from './filter-panel'
import { Globe } from './globe'
import { MiracleDetail } from './miracle-detail'
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
  // Zoom 17 puts us right at the building level — landmark cathedrals fill
  // the frame instead of being distant blocks. Pitch 60 gives the
  // dramatic-approach angle. Duration 3500ms is slow enough that tiles
  // and 3D models have time to load before the camera arrives — the
  // "wow on landing" timing.
  zoom: 17,
  pitch: 60,
  duration: 3500,
  essential: true,
} as const

// Padding shifts the camera's centre INWARD from each edge. With v3's
// card-replaces-list architecture, the map column is never covered by an
// overlay — the only reason we still need padding is the pitched camera:
// at pitch 60 the 3D building extrudes UP from the pin's screen position,
// so without `top` padding the cathedral's top half clips off-screen.
// `top: 120` (desktop) / `60` (mobile) puts the pin lower on screen so the
// building has room to extend above it.
const MAP_PADDING_DESKTOP = {
  top: 120,
  bottom: 0,
  left: 0,
  right: 0,
} as const
const MAP_PADDING_MOBILE = {
  top: 60,
  bottom: 0,
  left: 0,
  right: 0,
} as const

// Zoom-out cinematic — used when the user clicks "Back to list" or hovers
// a different card after viewing a detail. Returns the camera to the globe
// browse altitude (zoom 2, pitch 0) so the next interaction reads as
// "looking at the planet" instead of teleporting between buildings.
const GLOBE_FLY_OPTS = {
  zoom: 2,
  pitch: 0,
  duration: 1400,
  essential: true,
} as const

// Above this zoom level, hover easeTo also resets zoom + pitch back to the
// globe view (otherwise the camera "teleports" between distant pins at
// building scale). At/below this, hover preserves the user's manual zoom
// — they're already at globe-browse altitude or panning around.
const HOVER_RESET_ZOOM_THRESHOLD = 10

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
  // The desktop left scroll column held as state (via callback ref) rather
  // than a useRef so we can pass it down to MiracleList as the
  // IntersectionObserver root without reading `.current` during render.
  // Re-renders are cheap (the value only changes when the element mounts).
  const [desktopListScroll, setDesktopListScroll] =
    useState<HTMLDivElement | null>(null)
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

  // Count of currently-active filter chips for the mobile collapsed-panel
  // header label. Sums: 1 if the search query is non-empty, +1 per selected
  // type chip, +1 per selected status chip, +1 if the year scrub is pulled
  // back from MAX_YEAR. Per-chip counting (not per-group) so users can see
  // at a glance how many specific filters are active.
  const activeFilterCount =
    (query.trim().length > 0 ? 1 : 0) +
    selectedTypes.size +
    selectedStatuses.size +
    (yearMax < MAX_YEAR ? 1 : 0)

  // Reset every filter dimension at once. Wired into FilterPanel's "Clear"
  // button (only rendered when activeFilterCount > 0).
  function clearFilters() {
    setQuery('')
    setSelectedTypes(new Set())
    setSelectedStatuses(new Set())
    setYearMax(MAX_YEAR)
  }

  const selected = useMemo(
    () => miracles.find((m) => m.slug === selectedSlug) ?? null,
    [miracles, selectedSlug],
  )

  // Track whether the user was previously viewing a detail, so we can fly
  // the camera back to the globe browse view when they clear the
  // selection (back button OR second empty-map click). Initialised from
  // initialFocusSlug so a deep-link to /atlas?focus=… doesn't trigger a
  // spurious zoom-out on first paint.
  const prevSelectedRef = useRef<string | null>(initialFocusSlug ?? null)

  // Start a slow 360° orbit around the selected miracle once the flyTo
  // settles. Stops on selection change or any user map interaction. When
  // selection clears (transition from non-null → null), also fly the
  // camera back to the globe browse view so the user gets the "look at
  // the whole planet" framing instead of being stuck at building zoom.
  useEffect(() => {
    // Always cancel any prior orbit on selection change. Stopping fires
    // onStop which clears `isOrbiting`; no direct setState here (would be a
    // cascading-render lint violation).
    orbitRef.current?.stop()
    orbitRef.current = null

    const wasSelected = prevSelectedRef.current !== null
    prevSelectedRef.current = selectedSlug

    if (!selectedSlug) {
      // Selection just cleared — fly back to globe browse view. Only do
      // this when we were actually viewing a detail (wasSelected); on
      // initial mount when selectedSlug starts null, skip.
      if (wasSelected) {
        const desktopVisible =
          desktopMapRef.current && isMapVisible(desktopMapRef.current)
        const target = desktopVisible
          ? desktopMapRef.current
          : mobileMapRef.current
        // No `center` — keep the user's spatial context (the globe just
        // rotates back / pulls out around whatever pin they were viewing).
        target?.flyTo({ ...GLOBE_FLY_OPTS })
      }
      return
    }

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
  }, [selectedSlug, initialFocusSlug])

  // Keep the URL in sync with selection (cheap — no React re-render, no
  // data refetch). Survives refresh because the server already reads
  // `?focus=` and forwards it as `initialFocusSlug`. We use replaceState
  // (not pushState) so multiple selections don't pile up history entries.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = selectedSlug ? `/atlas?focus=${selectedSlug}` : '/atlas'
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url)
    }
  }, [selectedSlug])

  // Hover-to-rotate: pan the globe to the hovered card's coordinates.
  // Yields to selection: if anything is currently selected (orbit running),
  // hover is ignored. Debounced 250ms so rapid tab/mouse movement through
  // cards doesn't thrash the camera; only the last hover within the
  // window actually fires.
  //
  // Zoom-aware: if the camera is currently above HOVER_RESET_ZOOM_THRESHOLD
  // (i.e. we just flew back from a detail view, or the user manually zoomed
  // in), the easeTo also resets zoom + pitch back to the globe browse
  // view. Otherwise the camera would "teleport" between far-apart pins at
  // building scale, which reads as disorienting. At low zoom we just pan.
  useEffect(() => {
    if (selectedSlug) return
    if (!hoveredSlug) return
    const m = miracles.find((x) => x.slug === hoveredSlug)
    if (!m) return
    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return

    const timer = window.setTimeout(() => {
      const currentZoom = target.getMap().getZoom()
      if (currentZoom > HOVER_RESET_ZOOM_THRESHOLD) {
        target.easeTo({
          center: m.coordinates,
          zoom: GLOBE_FLY_OPTS.zoom,
          pitch: GLOBE_FLY_OPTS.pitch,
          duration: GLOBE_FLY_OPTS.duration,
          essential: true,
        })
      } else {
        target.easeTo({
          center: m.coordinates,
          duration: 800,
          essential: true,
        })
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [hoveredSlug, selectedSlug, miracles])

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
      padding: desktop ? MAP_PADDING_DESKTOP : MAP_PADDING_MOBILE,
    })
  }

  function handleDeselect() {
    // Two-stage click on empty map area: if orbit is running, stop the
    // orbit (the user is most likely trying to read while looking around);
    // otherwise, close the detail view. Preserved from the v2 drawer era —
    // the detail view also has its own pause/play in its sticky header,
    // so this map-click heuristic is now belt-and-braces, not the only
    // way to halt rotation.
    if (orbitRef.current && isOrbiting) {
      orbitRef.current.stop()
      return
    }
    setSelectedSlug(null)
  }

  function pauseOrbit() {
    orbitRef.current?.stop()
  }

  function playOrbit() {
    if (!selectedSlug || isOrbiting) return
    const m = miracles.find((x) => x.slug === selectedSlug)
    if (!m) return
    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return
    setIsOrbiting(true)
    orbitRef.current = startOrbit(target.getMap(), {
      onStop: () => setIsOrbiting(false),
    })
  }

  function togglePlayPause() {
    if (isOrbiting) pauseOrbit()
    else playOrbit()
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
    <div className="relative md:flex md:h-full md:flex-col">
      {/* MOBILE hero — tight band, hidden on desktop. SiteHeader above gives
          nav; this gives page identity (eyebrow + title + short description)
          + the mode toggle. */}
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-4 sm:px-8 md:hidden">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rubric">
            Plate I · Cartography
          </p>
          <h1 className="mt-1 font-display text-3xl italic leading-tight tracking-tight text-ink">
            The Miracle Atlas
          </h1>
          <p className="mt-2 max-w-[55ch] text-sm leading-relaxed text-ink-soft">
            A globe of approved miracles, anchored to coordinates and
            centuries. Wander the whole record, or walk a curated pilgrimage.
          </p>
        </div>
        <ModeToggle />
      </header>

      {/* Mobile: collapsible map at top → collapsible Filters panel → list
          (or detail when a card is selected). Filters consolidate search +
          chips + timeline scrub behind a single toggle so the list is closer
          to the map by default. */}
      <div className="md:hidden">
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

        {!selected ? (
          <FilterPanel
            activeCount={activeFilterCount}
            onClear={activeFilterCount > 0 ? clearFilters : undefined}
          >
            {searchInput}
            {filterChips}
            {timelineScrub}
          </FilterPanel>
        ) : null}

        {selected ? (
          <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
            <MiracleDetail
              key={selected.slug}
              miracle={selected}
              isOrbiting={isOrbiting}
              onTogglePlayPause={togglePlayPause}
              onBack={() => setSelectedSlug(null)}
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
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
        )}
      </div>

      {/* DESKTOP: 2-column work area. Left col is the single scroll container
          (hero + sticky filters + list). Right col is the fixed-height globe.
          Body has overflow:hidden on md+ via the main wrapper, so this is the
          only place scroll can happen on desktop. */}
      <div className="hidden md:flex md:flex-1 md:overflow-hidden">
        <div className="grid h-full w-full grid-cols-[minmax(380px,42%)_minmax(0,1fr)] overflow-hidden">
          {/* LEFT: single scroll container. Either list view (default) or
              MiracleDetail (when a card is selected). Map column on the
              right is never covered. */}
          <div
            ref={setDesktopListScroll}
            className="atlas-scroll relative h-full overflow-y-auto overscroll-y-none"
          >
            {selected ? (
              <MiracleDetail
                key={selected.slug}
                miracle={selected}
                isOrbiting={isOrbiting}
                onTogglePlayPause={togglePlayPause}
                onBack={() => setSelectedSlug(null)}
              />
            ) : (
              <>
                {/* Hero — scrolls with the column on first interaction.
                    SiteHeader above gives nav; this gives page identity
                    (eyebrow + title + short description) + the mode toggle.
                    Compact title (text-3xl/4xl, not 5xl-7xl) so the list is
                    reachable without scrolling far. */}
                <header className="flex flex-col gap-3 px-6 py-6 lg:px-10 lg:py-8">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rubric">
                      Plate I · Cartography
                    </p>
                    <h1 className="mt-1 font-display text-3xl italic leading-tight tracking-tight text-ink lg:text-4xl">
                      The Miracle Atlas
                    </h1>
                    <p className="mt-2 max-w-[55ch] text-sm leading-relaxed text-ink-soft">
                      A globe of approved miracles, anchored to coordinates
                      and centuries. Wander the whole record, or walk a
                      curated pilgrimage.
                    </p>
                  </div>
                  <ModeToggle />
                </header>

                {/* Collapsible sticky filter bar — pins to the top of the
                    scroll column so filters are always one tap away while
                    the list scrolls. Same component as the mobile branch. */}
                <FilterPanel
                  activeCount={activeFilterCount}
                  onClear={activeFilterCount > 0 ? clearFilters : undefined}
                  className="sticky top-0 z-10"
                >
                  {searchInput}
                  {filterChips}
                  {timelineScrub}
                </FilterPanel>

                <div className="flex flex-col gap-4 px-6 py-6 lg:px-10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {visibleMiracles.length} of {miracles.length} miracles
                  </p>
                  <MiracleList
                    miracles={visibleMiracles}
                    selectedSlug={selectedSlug}
                    hoveredSlug={hoveredSlug}
                    onSelect={handleSelect}
                    onHover={setHoveredSlug}
                    scrollRoot={desktopListScroll}
                  />
                </div>
              </>
            )}
          </div>

          {/* RIGHT: fixed-height globe. Doesn't scroll. */}
          <div className="h-full bg-ink">
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
