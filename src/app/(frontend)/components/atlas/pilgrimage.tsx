// src/app/(frontend)/components/atlas/pilgrimage.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Link from 'next/link'
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from 'react-map-gl/mapbox'
import { motion } from 'framer-motion'
import { type RefObject, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { GildedRule } from '../gilded-rule'
import { applyDuskPreset, resolveStyleUrl } from './mapbox-style'
import {
  type MiracleSummary,
  type PilgrimageSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

export function Pilgrimage({
  pilgrimage,
  styleUrl,
  viewAllHref = '/atlas/list',
  className,
}: {
  pilgrimage: PilgrimageSummary
  styleUrl?: string
  viewAllHref?: string
  className?: string
}) {
  const stops = pilgrimage.route
  const chapterRefs = useRef<Array<HTMLLIElement | null>>([])
  const activeIdx = useChapterActivation(chapterRefs, stops.length)
  const mapRef = useRef<MapRef | null>(null)

  // Pitched flyTo per chapter: zoom 15 brings 3D buildings + landmarks into
  // view; pitch 55 + a slight bearing offset gives a cinematic angle so the
  // arrival reads as "approaching" the city, not floating over it.
  useEffect(() => {
    const stop = stops[activeIdx]
    if (!stop || !mapRef.current) return
    mapRef.current.flyTo({
      center: stop.miracle.coordinates,
      zoom: 15,
      pitch: 55,
      bearing: ((activeIdx % 2) === 0 ? -20 : 20),
      duration: 2200,
      essential: true,
    })
  }, [activeIdx, stops])

  if (stops.length === 0) {
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
      {pilgrimage.intro ? (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
          className="mx-auto max-w-[60ch] py-12 text-center font-display text-2xl italic leading-relaxed text-ink md:py-20 md:text-3xl"
        >
          {pilgrimage.intro}
        </motion.p>
      ) : null}

      <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,46%)] md:gap-10">
        <ol className="flex flex-col gap-24 md:gap-32 md:py-16">
          {stops.map((stop, idx) => (
            <Chapter
              key={stop.miracle.id}
              stop={stop}
              index={idx}
              total={stops.length}
              isActive={idx === activeIdx}
              styleUrl={styleUrl}
              setRef={(el) => {
                chapterRefs.current[idx] = el
              }}
            />
          ))}
        </ol>
        <aside className="hidden md:block">
          <div className="sticky top-24 h-[78dvh] overflow-hidden rounded-3xl border border-ink/10 bg-ink shadow-altar">
            {TOKEN ? (
              <Map
                ref={mapRef}
                mapboxAccessToken={TOKEN}
                initialViewState={{
                  longitude: stops[0].miracle.coordinates[0],
                  latitude: stops[0].miracle.coordinates[1],
                  zoom: 3.4,
                  pitch: 0,
                }}
                mapStyle={resolveStyleUrl(styleUrl)}
                projection={{ name: 'globe' }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                interactive={false}
                onLoad={() => applyDuskPreset(mapRef.current)}
              >
                <AttributionControl compact position="bottom-left" />
                {stops.map((s, i) => (
                  <Marker
                    key={s.miracle.id}
                    longitude={s.miracle.coordinates[0]}
                    latitude={s.miracle.coordinates[1]}
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
                      style={{ backgroundColor: PIN_HEX[s.miracle.type] }}
                    />
                  </Marker>
                ))}
              </Map>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center font-display text-lg italic text-vellum/80">
                Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to render the map.
              </div>
            )}
            <ProgressDots active={activeIdx} total={stops.length} />
          </div>
        </aside>
      </div>

      <GildedRule className="mt-24" />
      <div className="flex flex-col items-center gap-3 pb-24 pt-12 text-center">
        <p className="font-display text-2xl italic text-ink">
          The cartography opens.
        </p>
        <Link
          href={viewAllHref}
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric transition-colors hover:text-rubric-deep"
        >
          View all miracles →
        </Link>
      </div>
    </div>
  )
}

function Chapter({
  stop,
  index,
  total,
  isActive,
  styleUrl,
  setRef,
}: {
  stop: { miracle: MiracleSummary; chapterNote?: string | null }
  index: number
  total: number
  isActive: boolean
  styleUrl?: string
  setRef: (el: HTMLLIElement | null) => void
}) {
  const { miracle, chapterNote } = stop
  const body = chapterNote && chapterNote.trim() ? chapterNote : miracle.summary
  const isLast = index === total - 1

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
        {body}
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

      {!isLast ? (
        <p
          aria-hidden
          className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-ink-soft"
        >
          ↓ Chapter {romanize(index + 2)}
        </p>
      ) : null}
    </motion.li>
  )
}

function LazyChapterMap({
  miracle,
  styleUrl,
}: {
  miracle: MiracleSummary
  styleUrl?: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapRef | null>(null)
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
      className="h-96 overflow-hidden rounded-2xl border border-ink/10 bg-ink"
    >
      {shouldMount && TOKEN ? (
        <Map
          ref={mapRef}
          mapboxAccessToken={TOKEN}
          initialViewState={{
            longitude: miracle.coordinates[0],
            latitude: miracle.coordinates[1],
            zoom: 14,
            pitch: 50,
          }}
          mapStyle={resolveStyleUrl(styleUrl)}
          projection={{ name: 'globe' }}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          interactive={false}
          onLoad={() => applyDuskPreset(mapRef.current)}
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

function ProgressDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'block h-1.5 rounded-full transition-all',
            i === active ? 'w-6 bg-vellum' : 'w-1.5 bg-vellum/30',
          )}
        />
      ))}
    </div>
  )
}

function useChapterActivation(
  refsRef: RefObject<Array<HTMLLIElement | null>>,
  count: number,
) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (count === 0) return
    // Avoid the global Map ctor (shadowed by react-map-gl Map import) — use
    // a Record keyed by chapter index.
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
        for (const [idxStr, ratio] of Object.entries(ratios)) {
          const idx = Number(idxStr)
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestIdx = idx
          }
        }
        setActiveIdx((prev) => (prev === bestIdx ? prev : bestIdx))
      },
      {
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

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
function romanize(n: number) {
  return ROMAN[n] ?? String(n)
}
