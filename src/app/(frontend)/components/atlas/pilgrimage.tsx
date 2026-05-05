// src/app/(frontend)/components/atlas/pilgrimage.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, { AttributionControl, Marker, type MapRef } from 'react-map-gl/mapbox'
import { motion } from 'framer-motion'
import { type RefObject, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { GildedRule } from '../gilded-rule'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
const DEFAULT_STYLE = 'mapbox://styles/mapbox/dark-v11'

function LazyChapterMap({
  miracle,
  styleUrl,
}: {
  miracle: MiracleSummary
  styleUrl?: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || shouldMount) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldMount(true)
            observer.disconnect()
            return
          }
        }
      },
      { rootMargin: '50% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldMount])

  return (
    <div
      ref={wrapRef}
      className="h-80 overflow-hidden rounded-2xl border border-ink/10 bg-ink"
    >
      {shouldMount && TOKEN ? (
        <Map
          mapboxAccessToken={TOKEN}
          initialViewState={{
            longitude: miracle.coordinates[0],
            latitude: miracle.coordinates[1],
            zoom: 4.2,
          }}
          mapStyle={styleUrl || DEFAULT_STYLE}
          projection={{ name: 'globe' }}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          interactive={false}
        >
          <AttributionControl compact position="bottom-left" />
          <Marker
            longitude={miracle.coordinates[0]}
            latitude={miracle.coordinates[1]}
            anchor="center"
          >
            <span
              aria-hidden
              className="block size-3 rounded-full ring-2 ring-vellum"
              style={{ backgroundColor: PIN_HEX[miracle.type] }}
            />
          </Marker>
        </Map>
      ) : null}
    </div>
  )
}

export function Pilgrimage({
  miracles,
  styleUrl,
  onViewAll,
  className,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  onViewAll: () => void
  className?: string
}) {
  // One ref slot per chapter, lifted out of Chapter so the parent owns
  // activation deterministically.
  const chapterRefs = useRef<Array<HTMLLIElement | null>>([])
  const activeIdx = useChapterActivation(chapterRefs, miracles.length)
  const mapRef = useRef<MapRef | null>(null)

  // When activeIdx changes, fly to that miracle's coordinates.
  useEffect(() => {
    const m = miracles[activeIdx]
    if (!m || !mapRef.current) return
    mapRef.current.flyTo({
      center: m.coordinates,
      zoom: 4.2,
      duration: 1800,
      essential: true,
    })
  }, [activeIdx, miracles])

  if (miracles.length === 0) {
    return (
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8',
          className,
        )}
      >
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>
      <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,46%)] md:gap-10">
        <ol className="flex flex-col gap-24 md:gap-32 md:py-16">
          {miracles.map((m, idx) => (
            <Chapter
              key={m.id}
              miracle={m}
              index={idx}
              total={miracles.length}
              isActive={idx === activeIdx}
              styleUrl={styleUrl}
              setRef={(el) => {
                chapterRefs.current[idx] = el
              }}
            />
          ))}
        </ol>
        <aside className="hidden md:block">
          <div className="sticky top-24 h-[70dvh] overflow-hidden rounded-3xl border border-ink/10 bg-ink shadow-altar">
            {TOKEN ? (
              <Map
                ref={mapRef}
                mapboxAccessToken={TOKEN}
                initialViewState={{
                  longitude: miracles[0].coordinates[0],
                  latitude: miracles[0].coordinates[1],
                  zoom: 3.4,
                }}
                mapStyle={styleUrl || DEFAULT_STYLE}
                projection={{ name: 'globe' }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                interactive={false}
              >
                <AttributionControl compact position="bottom-left" />
                {miracles.map((m, i) => (
                  <Marker
                    key={m.id}
                    longitude={m.coordinates[0]}
                    latitude={m.coordinates[1]}
                    anchor="center"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'block size-2.5 rounded-full ring-2 transition-transform',
                        i === activeIdx
                          ? 'scale-150 ring-vellum'
                          : 'ring-vellum/40',
                      )}
                      style={{ backgroundColor: PIN_HEX[m.type] }}
                    />
                  </Marker>
                ))}
              </Map>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center font-display text-lg italic text-vellum/80">
                Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to render the map.
              </div>
            )}
          </div>
        </aside>
      </div>

      <GildedRule className="mt-24" />
      <div className="flex flex-col items-center gap-3 pb-24 pt-12 text-center">
        <p className="font-display text-2xl italic text-ink">
          The cartography opens.
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric transition-colors hover:text-rubric-deep"
        >
          View all miracles →
        </button>
      </div>
    </div>
  )
}

// Single IntersectionObserver over all chapter refs. The active chapter is
// the one whose entry currently has the highest intersectionRatio. This
// avoids the flip-order race that per-child useInView hooks suffer on fast
// scroll, and gives the parent a single source of truth for the active idx.
function useChapterActivation(
  refsRef: RefObject<Array<HTMLLIElement | null>>,
  count: number,
) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (count === 0) return
    // Plain Record (the global `Map` is shadowed here by the react-map-gl
    // `Map` component import).
    const ratios: Record<number, number> = {}
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number(
            (entry.target as HTMLElement).dataset.chapterIdx ?? '-1',
          )
          if (idx >= 0) ratios[idx] = entry.intersectionRatio
        }
        let bestIdx = 0
        let bestRatio = -1
        for (const key of Object.keys(ratios)) {
          const idx = Number(key)
          const ratio = ratios[idx]
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestIdx = idx
          }
        }
        setActiveIdx((prev) => (prev === bestIdx ? prev : bestIdx))
      },
      {
        // Inner band — pick the chapter most centred in the viewport.
        rootMargin: '-30% 0px -30% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    const els = refsRef.current ?? []
    els.forEach((el, idx) => {
      if (!el) return
      el.dataset.chapterIdx = String(idx)
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [count, refsRef])

  return activeIdx
}

function Chapter({
  miracle,
  index,
  total,
  isActive,
  styleUrl,
  setRef,
}: {
  miracle: MiracleSummary
  index: number
  total: number
  isActive: boolean
  styleUrl?: string
  setRef: (el: HTMLLIElement | null) => void
}) {
  return (
    <motion.li
      ref={setRef}
      aria-current={isActive ? 'step' : undefined}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
      className="md:max-w-[55ch]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Chapter {romanize(index + 1)} of {romanize(total)}
      </p>
      <h2 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {miracle.title}
      </h2>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]} ·{' '}
        {miracle.locationName} ·{' '}
        {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
      </p>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        {miracle.summary}
      </p>

      {/* Mobile inline map — lazy-mounted via LazyChapterMap */}
      <div className="mt-6 md:hidden">
        <LazyChapterMap miracle={miracle} styleUrl={styleUrl} />
      </div>

      {miracle.sources.length > 0 ? (
        <ul className="mt-6 space-y-1 border-l-2 border-rubric/40 pl-4 font-mono text-[11px] text-ink-soft">
          {miracle.sources.slice(0, 3).map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline-offset-2 hover:underline"
                >
                  {s.label}
                </a>
              ) : (
                s.label
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </motion.li>
  )
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
function romanize(n: number) {
  return ROMAN[n] ?? String(n)
}
