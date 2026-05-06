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
import { PilgrimageBook } from './pilgrimage-book'
import { type PilgrimageSummary, PIN_HEX } from './types'

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

/**
 * Full pilgrimage walker shell. Mirrors AtlasShell's layout so users get
 * the same mental model when switching modes:
 *
 * Desktop: 42% book | 1fr map (sticky)
 * Mobile:  collapsible map at top, book below
 *
 * Single shared map per branch — flyTo on activeIdx change. Markers render
 * for every stop, with the active one highlighted. Map is non-interactive
 * (interactive=false) so users navigate via the book, not by panning.
 */
export function PilgrimageShell({
  pilgrimage,
  styleUrl,
}: {
  pilgrimage: PilgrimageSummary
  styleUrl?: string
}) {
  const stops = pilgrimage.route
  const [activeIdx, setActiveIdx] = useState(0)
  const desktopMapRef = useRef<MapRef | null>(null)
  const mobileMapRef = useRef<MapRef | null>(null)

  const handlePrev = useCallback(() => {
    setActiveIdx((i) => Math.max(0, i - 1))
  }, [])
  const handleNext = useCallback(() => {
    setActiveIdx((i) => Math.min(stops.length - 1, i + 1))
  }, [stops.length])
  const handleJump = useCallback((i: number) => {
    setActiveIdx(i)
  }, [])

  // flyTo on chapter change. Picks whichever branch is currently visible
  // (desktop or mobile), same approach AtlasShell uses for selection flyTo.
  useEffect(() => {
    const stop = stops[activeIdx]
    if (!stop) return
    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return
    target.flyTo({
      center: stop.miracle.coordinates,
      bearing: (activeIdx % 2 === 0 ? -20 : 20),
      ...CHAPTER_FLY_OPTS,
    })
  }, [activeIdx, stops])

  // Initial map view: centered on first stop, zoomed out enough to feel
  // like "the journey ahead". flyTo will commit the camera to chapter 1 on
  // mount via the effect above.
  const initialView = useMemo(() => {
    const first = stops[0]?.miracle.coordinates ?? [12.4534, 41.9029] // fallback: Vatican
    return {
      longitude: first[0],
      latitude: first[1],
      zoom: 3.4,
      pitch: 0,
    }
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

  return (
    <div className="relative md:flex md:h-full md:flex-col">
      {/* Mobile: collapsible map → paged book. */}
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
                <ChapterMarker key={s.miracle.id} stop={s} active={i === activeIdx} />
              ))}
            </Map>
          ) : (
            <MapTokenMissing />
          )}
        </CollapsibleMap>
        <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
          <PilgrimageBook
            stops={stops}
            activeIdx={activeIdx}
            onPrev={handlePrev}
            onNext={handleNext}
            onJump={handleJump}
          />
        </div>
      </div>

      {/* Desktop: 42%/1fr split with sticky map on the right. */}
      <div className="hidden md:flex md:flex-1 md:overflow-hidden">
        <div className="grid h-full w-full grid-cols-[minmax(380px,42%)_minmax(0,1fr)] overflow-hidden">
          <div className="relative h-full overflow-hidden">
            <PilgrimageBook
              stops={stops}
              activeIdx={activeIdx}
              onPrev={handlePrev}
              onNext={handleNext}
              onJump={handleJump}
              className="h-full"
            />
          </div>
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
                  <ChapterMarker key={s.miracle.id} stop={s} active={i === activeIdx} />
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
  stop: { miracle: { id: string; coordinates: [number, number]; type: keyof typeof PIN_HEX } }
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
