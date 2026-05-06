// src/app/(frontend)/components/atlas/pilgrimage-cover.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/cn'
import { type PilgrimageSummary } from './types'

/**
 * Pilgrimage cover page — the first thing the user sees when they land
 * on /atlas/pilgrimages/{slug}. Shows the title, subtitle, intro, cover
 * image, a "Begin Pilgrimage" CTA, and a back link to the gallery. The
 * map column (managed by PilgrimageShell) renders all chapter pins fit-
 * to-bounds with a slow orbit, so the user can see the whole route
 * before committing to walk it.
 */
export function PilgrimageCover({
  pilgrimage,
  totalChapters,
  onBegin,
  className,
}: {
  pilgrimage: PilgrimageSummary
  totalChapters: number
  onBegin: () => void
  className?: string
}) {
  return (
    <section
      aria-label="Pilgrimage cover"
      className={cn('relative flex h-full flex-col', className)}
    >
      <div className="atlas-scroll flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-6 pt-6 pb-32 lg:px-10 lg:pt-8">
          <Link
            href="/atlas/pilgrimages"
            className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
          >
            <span aria-hidden>←</span>
            All pilgrimages
          </Link>

          {pilgrimage.coverImage ? (
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment">
              <Image
                src={pilgrimage.coverImage.url}
                alt={pilgrimage.coverImage.alt || pilgrimage.title}
                fill
                sizes="(min-width: 1024px) 600px, 100vw"
                className="object-cover"
                unoptimized={pilgrimage.coverImage.url.startsWith('/api/')}
                priority
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rubric">
              Pilgrimage{pilgrimage.isSample ? ' · [Sample]' : ''} · {totalChapters} chapters
            </p>
            <h1 className="font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
              {pilgrimage.title}
            </h1>
            {pilgrimage.subtitle ? (
              <p className="font-display text-lg italic leading-relaxed text-ink-soft md:text-xl lg:text-2xl">
                {pilgrimage.subtitle}
              </p>
            ) : null}
          </div>

          {pilgrimage.intro ? (
            <p className="text-base leading-relaxed text-ink-soft lg:text-lg">
              {pilgrimage.intro}
            </p>
          ) : null}
        </div>
      </div>

      {/* Sticky bottom bar mirrors PilgrimageBook so the cover/chapter
          surfaces feel like the same component — only the action label
          changes. "Begin Pilgrimage" advances to chapter I. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-ink/10 bg-vellum/95 px-6 py-3 backdrop-blur lg:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Cover
        </p>
        <button
          type="button"
          onClick={onBegin}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft"
        >
          Begin Pilgrimage
          <span aria-hidden>→</span>
        </button>
      </div>
    </section>
  )
}
