// src/app/(frontend)/components/atlas/pilgrimage-shell.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from 'react-map-gl/mapbox'

import { cn } from '@/lib/cn'
import { CollapsibleMap } from './collapsible-map'
import { applyDuskPreset, resolveStyleUrl } from './mapbox-style'
import { type OrbitHandle, startOrbit } from './orbit'
import { PilgrimageBook } from './pilgrimage-book'
import { PilgrimageCover } from './pilgrimage-cover'
import { type PilgrimageRouteStop, type PilgrimageSummary, PIN_HEX } from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

// Cinematic flyTo per chapter — same as the v3 walker so visual continuity
// holds: zoom 15 brings 3D buildings + landmarks into view, pitch 55 gives
// the dramatic-approach angle, alternating bearing prevents the camera from
// feeling locked in one orientation across chapters.
const CHAPTER_FLY_OPTS = {
  zoom: 15,
  pitch: 55,
  duration: 2200,
  essential: true,
} as const

// Cover-page map padding — pixels inset from each edge when fitBounds
// computes the camera to show all stops. Generous on top so chapter pins
// near the bounds aren't pinned to the canvas edge.
const COVER_FIT_PADDING = 80

// Slow rotation rates. Chapters get the standard 60s/revolution from the
// atlas explore page; the cover orbit is slower (90s) so the user has
// time to read the cover copy without the globe distracting.
const CHAPTER_ORBIT_MS = 60_000
const COVER_ORBIT_MS = 90_000

type ViewMode = 'cover' | 'chapter'

/**
 * Full pilgrimage walker shell. Mirrors AtlasShell's layout so users get
 * the same mental model when switching modes:
 *
 *   Desktop: 42% book | 1fr map (sticky)
 *   Mobile:  collapsible map at top, book below
 *
 * Two view modes live behind the same shell:
 *
 *   'cover'   — first thing the user sees. Cover image + title + intro +
 *               "Begin Pilgrimage" CTA on the left; map fits all chapter
 *               pins to bounds and orbits the centroid on the right.
 *   'chapter' — paged-chapter reader (PilgrimageBook). Map flies to the
 *               active chapter's coordinate, orbits THAT point.
 *
 * Single shared map per branch — flyTo / fitBounds + orbit is driven by
 * a single useEffect keyed on [viewMode, activeIdx, stops]. Map is
 * non-interactive (interactive=false) so users navigate via the book.
 */
export function PilgrimageShell({
  pilgrimage,
  styleUrl,
}: {
  pilgrimage: PilgrimageSummary
  styleUrl?: string
}) {
  const stops = pilgrimage.route
  const [viewMode, setViewMode] = useState<ViewMode>('cover')
  const [activeIdx, setActiveIdx] = useState(0)
  const desktopMapRef = useRef<MapRef | null>(null)
  const mobileMapRef = useRef<MapRef | null>(null)
  const orbitRef = useRef<OrbitHandle | null>(null)

  const handlePrev = useCallback(() => {
    setActiveIdx((i) => Math.max(0, i - 1))
  }, [])
  const handleNext = useCallback(() => {
    setActiveIdx((i) => Math.min(stops.length - 1, i + 1))
  }, [stops.length])
  const handleJump = useCallback((i: number) => {
    setActiveIdx(i)
  }, [])
  const handleBegin = useCallback(() => {
    setActiveIdx(0)
    setViewMode('chapter')
  }, [])
  const handleCover = useCallback(() => {
    setViewMode('cover')
  }, [])

  // Drive the camera. One effect, two branches:
  //   - cover: fitBounds to all stops, then orbit slowly around the centroid.
  //   - chapter: flyTo the active stop's coords with chapter cinematic
  //              settings, then orbit the chapter point.
  // Effect runs on viewMode / activeIdx / stops changes. Cleanup cancels
  // the orbit so it doesn't lap into the next transition.
  useEffect(() => {
    orbitRef.current?.stop()
    orbitRef.current = null

    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return

    const map = target.getMap()
    let startTimer = 0

    if (viewMode === 'cover') {
      // Fit all chapter pins. cameraForBounds yields a center+zoom that
      // best frames the bounding box; flyTo then commits with a reset
      // pitch + bearing so we always start from the same orientation.
      const bounds = computeBounds(stops)
      const camera = map.cameraForBounds(bounds, { padding: COVER_FIT_PADDING })
      if (camera) {
        target.flyTo({
          center: camera.center,
          zoom: camera.zoom ?? 2,
          pitch: 0,
          bearing: 0,
          duration: 1600,
          essential: true,
        })
      }
      startTimer = window.setTimeout(() => {
        orbitRef.current = startOrbit(map, { durationMs: COVER_ORBIT_MS })
      }, 1800)
    } else {
      const stop = stops[activeIdx]
      if (!stop) return
      target.flyTo({
        center: stop.miracle.coordinates,
        bearing: activeIdx % 2 === 0 ? -20 : 20,
        ...CHAPTER_FLY_OPTS,
      })
      startTimer = window.setTimeout(() => {
        orbitRef.current = startOrbit(map, { durationMs: CHAPTER_ORBIT_MS })
      }, CHAPTER_FLY_OPTS.duration + 200)
    }

    return () => {
      window.clearTimeout(startTimer)
      orbitRef.current?.stop()
      orbitRef.current = null
    }
  }, [viewMode, activeIdx, stops])

  // Initial map view — gets overridden almost immediately by the effect
  // above (fitBounds for cover, flyTo for chapter), but we still need a
  // sensible first paint before that runs. Use the centroid of all stops
  // at globe-browse zoom so the first frame already shows the route's
  // continent rather than a default 0,0 wash.
  const initialView = useMemo(() => {
    if (stops.length === 0) {
      return { longitude: 12.4534, latitude: 41.9029, zoom: 3.4, pitch: 0 }
    }
    const avgLng =
      stops.reduce((sum, s) => sum + s.miracle.coordinates[0], 0) / stops.length
    const avgLat =
      stops.reduce((sum, s) => sum + s.miracle.coordinates[1], 0) / stops.length
    return { longitude: avgLng, latitude: avgLat, zoom: 2, pitch: 0 }
  }, [stops])

  if (stops.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  // Left/below pane content — same component instance (cover OR book)
  // rendered in both desktop and mobile branches so state and behavior
  // stay aligned without duplication.
  const paneContent =
    viewMode === 'cover' ? (
      <PilgrimageCover
        pilgrimage={pilgrimage}
        totalChapters={stops.length}
        onBegin={handleBegin}
        className="h-full"
      />
    ) : (
      <PilgrimageBook
        stops={stops}
        activeIdx={activeIdx}
        onPrev={handlePrev}
        onNext={handleNext}
        onJump={handleJump}
        onCover={handleCover}
        className="h-full"
      />
    )

  return (
    <div className="relative md:flex md:h-full md:flex-col">
      {/* Mobile: collapsible map → cover/book pane. */}
      <div className="md:hidden">
        <CollapsibleMap onResize={() => mobileMapRef.current?.getMap().resize()}>
          {TOKEN ? (
            <Map
              ref={mobileMapRef}
              mapboxAccessToken={TOKEN}
              initialViewState={initialView}
              mapStyle={resolveStyleUrl(styleUrl)}
              projection={{ name: 'globe' }}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              interactive={false}
              onLoad={() => applyDuskPreset(mobileMapRef.current)}
            >
              <AttributionControl compact position="bottom-left" />
              {stops.map((s, i) => (
                <ChapterMarker
                  key={s.miracle.id}
                  stop={s}
                  active={viewMode === 'chapter' && i === activeIdx}
                />
              ))}
            </Map>
          ) : (
            <MapTokenMissing />
          )}
        </CollapsibleMap>
        <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
          {paneContent}
        </div>
      </div>

      {/* Desktop: 42%/1fr split with sticky map on the right. */}
      <div className="hidden md:flex md:flex-1 md:overflow-hidden">
        <div className="grid h-full w-full grid-cols-[minmax(380px,42%)_minmax(0,1fr)] overflow-hidden">
          <div className="relative h-full overflow-hidden">{paneContent}</div>
          <div className="h-full bg-ink">
            {TOKEN ? (
              <Map
                ref={desktopMapRef}
                mapboxAccessToken={TOKEN}
                initialViewState={initialView}
                mapStyle={resolveStyleUrl(styleUrl)}
                projection={{ name: 'globe' }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                interactive={false}
                onLoad={() => applyDuskPreset(desktopMapRef.current)}
              >
                <AttributionControl compact position="bottom-left" />
                {stops.map((s, i) => (
                  <ChapterMarker
                    key={s.miracle.id}
                    stop={s}
                    active={viewMode === 'chapter' && i === activeIdx}
                  />
                ))}
              </Map>
            ) : (
              <MapTokenMissing />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterMarker({
  stop,
  active,
}: {
  stop: PilgrimageRouteStop
  active: boolean
}) {
  return (
    <Marker
      longitude={stop.miracle.coordinates[0]}
      latitude={stop.miracle.coordinates[1]}
      anchor="center"
    >
      <span
        aria-hidden
        className={cn(
          'block size-2.5 rounded-full ring-2 transition-transform',
          active ? 'scale-150 ring-vellum' : 'ring-vellum/40',
        )}
        style={{ backgroundColor: PIN_HEX[stop.miracle.type] }}
      />
    </Marker>
  )
}

function MapTokenMissing() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center font-display text-lg italic text-vellum/80">
      Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to render the map.
    </div>
  )
}

// Lifted from atlas-shell.tsx — same visibility check pattern. Both branches
// mount their own Mapbox context (the hidden branch idles via display:none);
// we forward to whichever ref currently has a visible container.
function isMapVisible(mapRef: MapRef): boolean {
  const container = mapRef.getMap().getContainer()
  return container.offsetParent !== null
}

// Bounding box from all chapter coordinates, in [southwest, northeast]
// form per Mapbox's LngLatBoundsLike convention.
function computeBounds(
  stops: PilgrimageRouteStop[],
): [[number, number], [number, number]] {
  const lngs = stops.map((s) => s.miracle.coordinates[0])
  const lats = stops.map((s) => s.miracle.coordinates[1])
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}
