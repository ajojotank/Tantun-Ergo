// src/app/(frontend)/components/atlas/globe.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, {
  AttributionControl,
  Marker,
  NavigationControl,
  Popup,
  type MapMouseEvent,
  type MapRef,
} from 'react-map-gl/mapbox'
import { useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { applyDuskPreset, resolveStyleUrl } from './mapbox-style'
import { type MiracleSummary, PIN_HEX, formatYear } from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export function Globe({
  miracles,
  styleUrl,
  onSelect,
  onDeselect,
  className,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  onSelect: (slug: string) => void
  onDeselect?: () => void
  className?: string
}) {
  const mapRef = useRef<MapRef | null>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const hovered = hoveredSlug
    ? miracles.find((m) => m.slug === hoveredSlug) ?? null
    : null

  if (!TOKEN) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-ink text-vellum/85',
          className,
        )}
      >
        <p className="max-w-md px-6 text-center font-display text-lg italic leading-relaxed">
          Set <span className="font-mono">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span> in{' '}
          <span className="font-mono">.env</span> to render the Atlas.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        initialViewState={{ longitude: 8, latitude: 30, zoom: 1.4 }}
        mapStyle={resolveStyleUrl(styleUrl)}
        projection={{ name: 'globe' }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onLoad={() => applyDuskPreset(mapRef.current)}
        onClick={(e: MapMouseEvent) => {
          // The Map fires onClick when no Marker handler intercepts. Use it
          // to deselect — but only if the parent provided onDeselect.
          const target = (e.originalEvent?.target as HTMLElement | null) ?? null
          // Defensive: if a Marker child fired this, target.closest finds
          // the Marker root and we ignore. Otherwise deselect.
          if (target?.closest('[data-atlas-marker="true"]')) return
          onDeselect?.()
        }}
      >
        <AttributionControl compact position="bottom-left" />
        <NavigationControl position="bottom-right" showCompass={false} />
        {miracles.map((m) => (
          <Marker
            key={m.id}
            longitude={m.coordinates[0]}
            latitude={m.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSelect(m.slug)
            }}
          >
            <button
              type="button"
              data-atlas-marker="true"
              aria-label={`Open detail for ${m.title}`}
              onMouseEnter={() => setHoveredSlug(m.slug)}
              onMouseLeave={() =>
                setHoveredSlug((cur) => (cur === m.slug ? null : cur))
              }
              className="group relative grid place-items-center"
            >
              <span
                aria-hidden
                className="absolute size-5 rounded-full opacity-40 blur-md transition-opacity group-hover:opacity-90"
                style={{ backgroundColor: PIN_HEX[m.type] }}
              />
              <span
                aria-hidden
                className="relative size-2.5 rounded-full ring-2 ring-vellum/85 transition-transform group-hover:scale-125"
                style={{ backgroundColor: PIN_HEX[m.type] }}
              />
            </button>
          </Marker>
        ))}
        {hovered ? (
          <Popup
            longitude={hovered.coordinates[0]}
            latitude={hovered.coordinates[1]}
            anchor="bottom"
            offset={20}
            closeButton={false}
            closeOnClick={false}
            className="atlas-hover-popup"
          >
            <div className="px-1 py-0.5">
              <p className="font-display text-sm italic leading-tight text-ink">
                {hovered.title.replace(/\s*\[Sample\]\s*$/, '')}
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                {hovered.locationName} · {formatYear(hovered.yearOccurred, hovered.dateApproximate)}
              </p>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  )
}
