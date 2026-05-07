import type { Metadata } from 'next'
import Link from 'next/link'

import { TrackPlate } from '../components/doctrine/track-plate'
import { toTrackSummary } from '../components/doctrine/serialise'
import { payload } from '@/lib/payload'
import { getMember } from '@/lib/auth'
import { findMostRecentProgress } from '@/lib/doctrine-progress'

import { ResumeBanner } from '../components/doctrine/resume-banner'

// Force dynamic rendering so newly published tracks appear immediately,
// without waiting for a rebuild.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Doctrine',
  description:
    'A breviary-paced LMS over councils, encyclicals, the Catechism — read, watch, listen — with gentle mastery checks.',
}

export default async function DoctrineCataloguePage() {
  const p = await payload()

  const tracksResult = await p.find({
    collection: 'doctrine-tracks',
    where: { _status: { equals: 'published' } },
    limit: 100,
    sort: ['order', 'title'],
    depth: 1,
  })

  if (tracksResult.docs.length === 0) {
    return <DoctrineEmpty />
  }

  // Module counts per track — one query, group in memory.
  const modulesResult = await p.find({
    collection: 'doctrine-modules',
    where: { _status: { equals: 'published' } },
    limit: 500,
    depth: 0,
    sort: 'order',
  })
  const countsByTrack = new Map<string, number>()
  for (const m of modulesResult.docs) {
    const trackId =
      typeof m.track === 'object' && m.track !== null
        ? String((m.track as { id: number }).id)
        : String(m.track)
    countsByTrack.set(trackId, (countsByTrack.get(trackId) ?? 0) + 1)
  }

  const tracks = tracksResult.docs.map(toTrackSummary)

  // Resume banner — visible only to signed-in members with at least one
  // progress row. Read once; the catalogue page renders fast enough.
  const member = await getMember()
  let resumeProps: {
    unitTitle: string
    trackTitle: string
    moduleTitle: string
    href: string
  } | null = null
  if (member) {
    const recent = await findMostRecentProgress(member.id)
    const unit = recent?.unit
    if (unit && typeof unit === 'object' && 'slug' in unit) {
      const u = unit as { slug?: string; title?: string; module?: unknown }
      const moduleObj =
        u.module && typeof u.module === 'object'
          ? (u.module as { slug?: string; title?: string; track?: unknown })
          : null
      const trackObj =
        moduleObj?.track && typeof moduleObj.track === 'object'
          ? (moduleObj.track as { slug?: string; title?: string })
          : null
      if (u.slug && moduleObj?.slug && trackObj?.slug) {
        resumeProps = {
          unitTitle: String(u.title ?? ''),
          moduleTitle: String(moduleObj.title ?? ''),
          trackTitle: String(trackObj.title ?? ''),
          href: `/doctrine/${trackObj.slug}/${moduleObj.slug}/${u.slug}`,
        }
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate II · Doctrine
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The breviary of formation.
      </h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
        Read, watch, or listen — three lanes through the same folio. Each unit closes
        with a single, gentle question. Pick up where you left off across any device.
      </p>

      {resumeProps ? <ResumeBanner {...resumeProps} /> : null}

      <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t, i) => (
          <li key={t.id}>
            <TrackPlate
              track={t}
              index={i}
              moduleCount={countsByTrack.get(t.id) ?? 0}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}

function DoctrineEmpty() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate II · Doctrine
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The breviary opens soon.
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        Once the studio holds doctrine tracks, this page becomes a catalogue of
        formation paths.
      </p>
      <Link
        href="/atlas"
        className="mt-10 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
      >
        Walk the Atlas instead →
      </Link>
    </main>
  )
}
