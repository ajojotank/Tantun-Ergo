import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DoctrineOutline } from '../../components/doctrine/doctrine-outline'
import { ProgressMeter } from '../../components/doctrine/progress-meter'
import { getMember } from '@/lib/auth'
import {
  firstUnitHref,
  getTrackOutline,
} from '@/lib/doctrine-outline'
import { payload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ track: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { track: trackSlug } = await params
  const p = await payload()
  const r = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const t = r.docs[0]
  if (!t) return { title: 'Doctrine — not found' }
  const title = typeof t.title === 'string' ? t.title : 'Track'
  const desc = typeof t.summary === 'string' ? t.summary : undefined
  return { title: `${title} · Doctrine`, description: desc }
}

export default async function DoctrineTrackPage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug } = await params
  const member = await getMember()
  const outline = await getTrackOutline(trackSlug, {
    memberId: member?.id,
  })
  if (!outline) notFound()

  const beginHref = firstUnitHref(outline)
  const ctaHref = outline.resumeHref ?? beginHref
  const ctaLabel = outline.resumeHref ? 'Continue reading' : 'Begin reading'
  const ctaSubLabel = outline.resumeTitle
    ? `Resume · ${outline.resumeTitle}`
    : null
  const hasUnits = outline.totalUnits > 0

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 md:py-20">
      <Link
        href="/doctrine"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        All tracks
      </Link>

      {/* Course-landing hero — cover on the right (md+), title block on the left. */}
      <section
        aria-label="Track header"
        className="mt-8 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Doctrine track{outline.isSample ? ' · [Sample]' : ''}
          </p>
          <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
            {outline.title}
          </h1>
          {outline.summary ? (
            <p className="mt-5 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
              {outline.summary}
            </p>
          ) : null}

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
            {outline.modules.length}{' '}
            {outline.modules.length === 1 ? 'module' : 'modules'} ·{' '}
            {outline.totalUnits}{' '}
            {outline.totalUnits === 1 ? 'unit' : 'units'}
          </p>

          {member ? (
            <ProgressMeter
              completed={outline.completedUnits}
              total={outline.totalUnits}
              className="mt-6 max-w-md"
            />
          ) : null}

          {hasUnits ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
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
        </div>

        {outline.coverPlate ? (
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment shadow-altar md:max-w-sm md:justify-self-end">
            <Image
              src={outline.coverPlate.url}
              alt={outline.coverPlate.alt || outline.title}
              fill
              sizes="(min-width: 768px) 380px, 100vw"
              className="object-cover"
              unoptimized={outline.coverPlate.url.startsWith('/api/')}
              priority
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-gilt/70 to-transparent"
            />
          </div>
        ) : null}
      </section>

      {/* Course outline — modules with units listed inline. */}
      <section
        aria-label="Course outline"
        className="mt-16 border-t border-ink/10 pt-10"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
          Course outline
        </p>
        <h2 className="mt-2 font-display text-3xl italic leading-snug text-ink md:text-4xl">
          What you&apos;ll walk through.
        </h2>

        <div className="mt-10">
          {outline.modules.length === 0 ? (
            <p className="font-display text-2xl italic text-ink-soft">
              This track has no modules yet.
            </p>
          ) : (
            <DoctrineOutline outline={outline} variant="inline" />
          )}
        </div>
      </section>
    </main>
  )
}
