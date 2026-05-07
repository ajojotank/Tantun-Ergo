import type { Metadata } from 'next'
import Link from 'next/link'

import { TrackPlate } from '../components/doctrine/track-plate'
import { toTrackSummary } from '../components/doctrine/serialise'
import { payload } from '@/lib/payload'

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
