'use client'

import Link from 'next/link'
import { useState } from 'react'

import { NarrativeBlock } from '../atlas/narrative'

import { LaneSwitcher, type LaneId } from './lane-switcher'
import { MasteryCheck } from './mastery-check'
import { romanizeLower, type DoctrineUnitFull } from './types'

/**
 * Reading column for the unit player. Renders the breadcrumb, folio header,
 * lane switcher, content lanes, mastery check, and the prev/next footer.
 *
 * Does NOT own the outer <main> tag — the server page wraps this in a 2-col
 * layout alongside the course-outline sidebar.
 */
export function UnitPlayer({
  unit,
  positionInModule,
  totalInModule,
  prevHref,
  nextHref,
  previousAnswer,
}: {
  unit: DoctrineUnitFull
  positionInModule: number
  totalInModule: number
  prevHref: string | null
  nextHref: string | null
  previousAnswer: string | null
}) {
  const lanes: LaneId[] = ['read']
  if (unit.watchVideoUrl) lanes.push('watch')
  if (unit.listenAudioUrl) lanes.push('listen')

  const [active, setActive] = useState<LaneId>('read')

  const folioNumber = romanizeLower(positionInModule + 1)
  const folioTotal = romanizeLower(totalInModule)
  const masteryEnabled =
    Boolean(unit.masteryPrompt) && unit.masteryOptions.length > 0

  return (
    <article className="w-full">
      <p className="font-display text-base italic leading-snug text-ink-soft">
        <Link
          href={`/doctrine/${unit.trackSlug}`}
          className="underline-offset-4 hover:underline"
        >
          {unit.trackTitle}
        </Link>
        {' › '}
        <Link
          href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}`}
          className="underline-offset-4 hover:underline"
        >
          {unit.moduleTitle}
        </Link>
      </p>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Folio {folioNumber}{unit.isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {unit.title}
      </h1>

      {lanes.length > 1 ? (
        <div className="mt-8">
          <LaneSwitcher lanes={lanes} active={active} onChange={setActive} />
        </div>
      ) : null}

      {unit.introduction ? (
        <div className="mt-8 max-w-[65ch]">
          <NarrativeBlock node={unit.introduction} />
        </div>
      ) : null}

      <div className="mt-8 max-w-[65ch]">
        {active === 'read' ? (
          unit.reading ? (
            <NarrativeBlock node={unit.reading} />
          ) : (
            <p className="font-display text-lg italic text-ink-soft">
              Reading content forthcoming.
            </p>
          )
        ) : null}

        {active === 'watch' && unit.watchVideoUrl ? (
          <video
            src={unit.watchVideoUrl}
            controls
            className="aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment"
          >
            Your browser does not support embedded video.
          </video>
        ) : null}

        {active === 'listen' && unit.listenAudioUrl ? (
          <audio src={unit.listenAudioUrl} controls className="w-full">
            Your browser does not support embedded audio.
          </audio>
        ) : null}
      </div>

      {masteryEnabled ? (
        <div className="mt-16 max-w-[65ch]">
          <MasteryCheck
            unitId={unit.id}
            prompt={unit.masteryPrompt!}
            options={unit.masteryOptions}
            previousAnswer={previousAnswer}
          />
        </div>
      ) : null}

      {/* Persistent prev/next footer — visible on every unit, not just the
          last one. Folio counter sits between them on desktop, on top on
          mobile. The "Previous folio" link is dimmed when there's no prev. */}
      <nav
        aria-label="Folio navigation"
        className="mt-16 flex flex-col gap-4 border-t border-ink/10 pt-6 md:flex-row md:items-center md:justify-between"
      >
        {prevHref ? (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-vellum px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden>←</span>
            Previous folio
          </Link>
        ) : (
          <span
            aria-hidden
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-ink/10 bg-vellum px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft/60"
          >
            <span aria-hidden>←</span>
            Previous folio
          </span>
        )}
        <p className="order-first font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft md:order-none">
          Folio {folioNumber}. of {folioTotal}.
        </p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft"
          >
            Turn page
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link
            href="/doctrine"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-vellum px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition-colors hover:border-ink/30"
          >
            All tracks
            <span aria-hidden>→</span>
          </Link>
        )}
      </nav>
    </article>
  )
}
