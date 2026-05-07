import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DoctrineOutline } from '../../../components/doctrine/doctrine-outline'
import { MobileOutline } from '../../../components/doctrine/mobile-outline'
import { ProgressMeter } from '../../../components/doctrine/progress-meter'
import { romanize, romanizeLower } from '../../../components/doctrine/types'
import { requireMember } from '@/lib/auth'
import { getTrackOutline } from '@/lib/doctrine-outline'
import { payload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ track: string; module: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { track: trackSlug, module: moduleSlug } = await params
  const p = await payload()
  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const t = trackR.docs[0]
  if (!t) return { title: 'Doctrine — not found' }
  const moduleR = await p.find({
    collection: 'doctrine-modules',
    where: {
      slug: { equals: moduleSlug },
      track: { equals: t.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 0,
  })
  const m = moduleR.docs[0]
  if (!m) return { title: 'Doctrine — not found' }
  const title = typeof m.title === 'string' ? m.title : 'Module'
  const desc = typeof m.summary === 'string' ? m.summary : undefined
  return { title: `${title} · ${t.title} · Doctrine`, description: desc }
}

export default async function DoctrineModulePage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug, module: moduleSlug } = await params
  const member = await requireMember(`/doctrine/${trackSlug}/${moduleSlug}`)

  const outline = await getTrackOutline(trackSlug, {
    memberId: member.id,
    currentModuleSlug: moduleSlug,
  })
  if (!outline) notFound()

  const moduleIndex = outline.modules.findIndex((m) => m.slug === moduleSlug)
  if (moduleIndex < 0) notFound()
  const currentModule = outline.modules[moduleIndex]!

  // First-unit-of-this-module CTA target. Falls back to the next module
  // if this one is empty (unlikely but covered).
  const firstUnit = currentModule.units[0] ?? null
  const beginHref = firstUnit
    ? `/doctrine/${trackSlug}/${moduleSlug}/${firstUnit.slug}`
    : null

  // Resume target within this module specifically (rather than across the
  // whole track). Walk units in order and return the first incomplete one
  // after a completed one — that's the "where you left off" position.
  let resumeHref: string | null = null
  let resumeTitle: string | null = null
  for (let i = 0; i < currentModule.units.length; i += 1) {
    const u = currentModule.units[i]!
    if (!u.isComplete) {
      resumeHref = `/doctrine/${trackSlug}/${moduleSlug}/${u.slug}`
      resumeTitle = u.title
      // Only treat as "resume" when at least one earlier unit is complete.
      const anyEarlierComplete = currentModule.units
        .slice(0, i)
        .some((prev) => prev.isComplete)
      if (!anyEarlierComplete) {
        resumeHref = null
        resumeTitle = null
      }
      break
    }
  }

  const ctaHref = resumeHref ?? beginHref
  const ctaLabel = resumeHref ? 'Continue module' : 'Begin module'
  const ctaSubLabel = resumeTitle ? `Resume · ${resumeTitle}` : null

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 md:py-14">
      <Link
        href={`/doctrine/${trackSlug}`}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        {outline.title}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
        <aside
          aria-label="Course outline"
          className="hidden lg:sticky lg:top-12 lg:block lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto"
        >
          <div className="pb-8 pr-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-rubric">
              Doctrine track{outline.isSample ? ' · [Sample]' : ''}
            </p>
            <p className="mt-1 font-display text-xl italic leading-snug text-ink">
              {outline.title}
            </p>
            <ProgressMeter
              completed={outline.completedUnits}
              total={outline.totalUnits}
              className="mt-4"
            />
            <div className="mt-6 border-t border-ink/10 pt-6">
              <DoctrineOutline outline={outline} variant="sidebar" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <MobileOutline
            trackTitle={outline.title}
            completed={outline.completedUnits}
            total={outline.totalUnits}
          >
            <DoctrineOutline outline={outline} variant="sidebar" />
          </MobileOutline>

          <header className="mt-8 lg:mt-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              Module {romanize(moduleIndex + 1)}
              {currentModule.isSample ? ' · [Sample]' : ''} ·{' '}
              {currentModule.completedCount}/{currentModule.units.length}{' '}
              complete
            </p>
            <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
              {currentModule.title}
            </h1>
            {currentModule.summary ? (
              <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
                {currentModule.summary}
              </p>
            ) : null}
            {ctaHref ? (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft"
                >
                  {ctaLabel}
                  <span aria-hidden>→</span>
                </Link>
                {ctaSubLabel ? (
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {ctaSubLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </header>

          {/* Unit list — shows ONLY this module's units, with the same
              completion glyph and current/last-visited highlighting as the
              sidebar. Click a unit to open the player. */}
          <section
            aria-label="Module units"
            className="mt-12 border-t border-ink/10 pt-8"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              Folios in this module
            </p>
            <h2 className="mt-2 font-display text-2xl italic leading-snug text-ink md:text-3xl">
              {currentModule.units.length}{' '}
              {currentModule.units.length === 1 ? 'folio' : 'folios'} to walk.
            </h2>

            {currentModule.units.length === 0 ? (
              <p className="mt-8 font-display text-xl italic text-ink-soft">
                This module has no units yet.
              </p>
            ) : (
              <ul className="mt-8 divide-y divide-ink/10 border-t border-ink/10">
                {currentModule.units.map((u, ui) => (
                  <li key={u.id}>
                    <Link
                      href={`/doctrine/${trackSlug}/${moduleSlug}/${u.slug}`}
                      className={[
                        'group flex items-start gap-4 py-5 transition-colors',
                        'border-l-2 border-transparent pl-3 -ml-3',
                        u.isComplete ? '' : 'hover:bg-vellum-deep/30',
                      ].join(' ')}
                    >
                      <span
                        aria-hidden
                        className={
                          u.isComplete
                            ? 'mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-gilt text-vellum'
                            : 'mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-ink/25 bg-vellum'
                        }
                      >
                        {u.isComplete ? (
                          <svg
                            viewBox="0 0 16 16"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              d="M3 8.5 L7 12 L13 4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                          Folio {romanizeLower(ui + 1)}
                          {u.isSample ? ' · [Sample]' : ''} ·{' '}
                          {laneLabel(u.hasWatch, u.hasListen)}
                        </p>
                        <h3 className="mt-1 font-display text-2xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-3xl">
                          {u.title}
                        </h3>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
                          {u.isComplete ? 'Re-read folio →' : 'Open folio →'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

function laneLabel(hasWatch: boolean, hasListen: boolean): string {
  const lanes = ['Read']
  if (hasWatch) lanes.push('Watch')
  if (hasListen) lanes.push('Listen')
  return lanes.join(' · ')
}
