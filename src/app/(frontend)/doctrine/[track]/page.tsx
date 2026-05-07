import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ModuleFolio } from '../../components/doctrine/module-folio'
import {
  toModuleSummary,
  toTrackSummary,
} from '../../components/doctrine/serialise'
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
  const p = await payload()

  const trackResult = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  const trackDoc = trackResult.docs[0]
  if (!trackDoc) notFound()
  const track = toTrackSummary(trackDoc)

  const modulesResult = await p.find({
    collection: 'doctrine-modules',
    where: {
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 100,
    sort: ['order', 'title'],
    depth: 1,
  })

  // Unit counts per module.
  const moduleIds = modulesResult.docs.map((m) => m.id)
  const unitsResult =
    moduleIds.length > 0
      ? await p.find({
          collection: 'doctrine-units',
          where: {
            module: { in: moduleIds },
            _status: { equals: 'published' },
          },
          limit: 500,
          depth: 0,
        })
      : { docs: [] as Array<{ module: number | { id: number } }> }
  const countsByModule = new Map<number, number>()
  for (const u of unitsResult.docs) {
    const moduleId =
      typeof u.module === 'object' && u.module !== null
        ? Number((u.module as { id: number }).id)
        : Number(u.module)
    countsByModule.set(moduleId, (countsByModule.get(moduleId) ?? 0) + 1)
  }

  const modules = modulesResult.docs.map((m) =>
    toModuleSummary(m, countsByModule.get(m.id as number) ?? 0),
  )

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <Link
        href="/doctrine"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        All tracks
      </Link>

      {track.coverPlate ? (
        <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment">
          <Image
            src={track.coverPlate.url}
            alt={track.coverPlate.alt || track.title}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
            unoptimized={track.coverPlate.url.startsWith('/api/')}
            priority
          />
        </div>
      ) : null}

      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Doctrine track{track.isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {track.title}
      </h1>
      {track.summary ? (
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {track.summary}
        </p>
      ) : null}

      {modules.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          This track has no modules yet.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {modules.map((m, i) => (
            <li key={m.id}>
              <ModuleFolio module={m} index={i} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
