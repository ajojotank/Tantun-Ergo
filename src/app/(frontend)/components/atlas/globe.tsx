// src/app/(frontend)/components/atlas/globe.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, { AttributionControl, Marker, NavigationControl } from 'react-map-gl/mapbox'
import { useCallback, useMemo } from 'react'

import { cn } from '@/lib/cn'
import { type MiracleSummary, PIN_HEX } from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
const DEFAULT_STYLE = 'mapbox://styles/mapbox/dark-v11'

export function Globe({
  miracles,
  styleUrl,
  onSelect,
  className,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  onSelect: (slug: string) => void
  className?: string
}) {
  const initial = useMemo(
    () => ({
      longitude: 8,
      latitude: 30,
      zoom: 1.4,
    }),
    [],
  )

  const handleSelect = useCallback(
    (slug: string) => {
      onSelect(slug)
    },
    [onSelect],
  )

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
        mapboxAccessToken={TOKEN}
        initialViewState={initial}
        mapStyle={styleUrl || DEFAULT_STYLE}
        projection={{ name: 'globe' }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
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
              // Stop the click from propagating to the Map (which would close
              // any popup / clear the selection).
              e.originalEvent.stopPropagation()
              handleSelect(m.slug)
            }}
          >
            <button
              type="button"
              aria-label={`Open detail for ${m.title}`}
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
      </Map>
    </div>
  )
}
