// src/app/(frontend)/components/atlas/miracle-detail.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { NarrativeBlock } from './narrative'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'
import { VideoEmbed } from './video-embed'

/**
 * In-column miracle detail view. Replaces the list inside the left column
 * when a card is selected; the map column on the right stays untouched
 * (continues to fly + orbit).
 *
 * Replaces the old `<MiracleDrawer>` overlay pattern. No motion wrapper,
 * no position: fixed, no body scroll lock — this is a normal flex column
 * that lives inside `AtlasShell`'s single scroll container.
 */
export function MiracleDetail({
  miracle,
  isOrbiting = false,
  onTogglePlayPause,
  onBack,
}: {
  miracle: MiracleSummary
  /** True if the map is currently auto-rotating around the selected pin. */
  isOrbiting?: boolean
  /** Toggle handler — pauses if orbiting, resumes if paused. */
  onTogglePlayPause?: () => void
  /** Called when the user clicks "Back to list" or presses ESC. */
  onBack: () => void
}) {
  const backButtonRef = useRef<HTMLButtonElement | null>(null)
  // Hold onBack in a ref so the mount effect below can run once with [] and
  // still read the latest handler. Without this, AtlasShell passing a fresh
  // arrow on every render would re-install the keydown listener and yank
  // focus on every parent re-render — visible jank during orbit/flyTo.
  const onBackRef = useRef(onBack)
  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    // Focus the back button on mount so keyboard users can immediately
    // press Enter to return. setTimeout(0) defers focus to after the DOM
    // commit. On unmount, restore focus to whatever was focused before
    // (typically the card the user clicked).
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => {
      backButtonRef.current?.focus()
    }, 0)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onBackRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <section
      aria-labelledby="miracle-detail-title"
      className="relative flex flex-col"
    >
      {/* Sticky action bar: Back left, pause/play right. Pins to the top of
          the scroll container so the user can always escape regardless of
          how far they've scrolled into the narrative. */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-vellum/95 px-6 py-3 backdrop-blur lg:px-10">
        <button
          ref={backButtonRef}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span>
          Back to list
        </button>
        {onTogglePlayPause ? (
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-pressed={isOrbiting}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-vellum/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden>{isOrbiting ? '⏸' : '▶'}</span>
            {isOrbiting ? 'Pause rotation' : 'Resume rotation'}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 px-6 pt-6 pb-16 lg:px-10">
        {/* Eyebrow + title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: PIN_HEX[miracle.type] }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]}
            </span>
          </div>
          <h2
            id="miracle-detail-title"
            className="font-display text-3xl italic leading-tight tracking-tight text-ink md:text-4xl lg:text-5xl"
          >
            {miracle.title}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {miracle.locationName} · {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
            {miracle.isSample ? ' · [Sample]' : ''}
          </p>
        </div>

        <p className="text-base leading-relaxed text-ink-soft lg:text-lg">
          {miracle.summary}
        </p>

        {miracle.artwork.length > 0 ? (
          <div className="atlas-scroll -mx-6 flex snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden px-6 lg:-mx-10 lg:px-10">
            {miracle.artwork.map((art) => (
              <figure
                key={art.id}
                className="relative aspect-[16/10] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-parchment sm:w-[60%] lg:w-[55%]"
              >
                <Image
                  src={art.url}
                  alt={art.alt}
                  fill
                  sizes="(min-width: 1024px) 600px, (min-width: 640px) 60vw, 88vw"
                  className="object-cover"
                  unoptimized={art.url.startsWith('/api/')}
                />
                {art.attribution ? (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vellum/85">
                    {art.attribution}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}

        {miracle.videos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {miracle.videos.map((v, i) => (
              <VideoEmbed key={i} video={v} />
            ))}
          </div>
        ) : null}

        {miracle.narrative ? <NarrativeBlock node={miracle.narrative} /> : null}

        {miracle.approvingAuthority ? (
          <div className="border-t border-ink/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Approving authority
            </p>
            <p className="mt-1 text-sm text-ink">{miracle.approvingAuthority}</p>
          </div>
        ) : null}

        {miracle.sources.length > 0 ? (
          <div className="border-t border-ink/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Sources
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-soft">
              {miracle.sources.map((s, i) => (
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
                  {s.attribution ? ` — ${s.attribution}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

