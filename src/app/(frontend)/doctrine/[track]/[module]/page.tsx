import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { UnitFolio } from '../../../components/doctrine/unit-folio'
import { toUnitSummary } from '../../../components/doctrine/serialise'
import { payload } from '@/lib/payload'
import { getMember, requireMember } from '@/lib/auth'

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
  await requireMember(`/doctrine/${trackSlug}/${moduleSlug}`)
  const p = await payload()

  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const trackDoc = trackR.docs[0]
  if (!trackDoc) notFound()

  const moduleR = await p.find({
    collection: 'doctrine-modules',
    where: {
      slug: { equals: moduleSlug },
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })
  const moduleDoc = moduleR.docs[0]
  if (!moduleDoc) notFound()

  const unitsR = await p.find({
    collection: 'doctrine-units',
    where: {
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 200,
    sort: ['order', 'title'],
    depth: 2,
  })

  const units = unitsR.docs.map(toUnitSummary)

  // Read the member's progress on these units so we can highlight the
  // most recently visited one. Cheap: this page is auth-gated, member is
  // known. The `getMember` import was already added in Step 2.
  const member = await getMember()
  let lastVisitedUnitSlug: string | null = null
  if (member) {
    const unitIds = unitsR.docs.map((u) => u.id as number)
    if (unitIds.length > 0) {
      const recent = await p.find({
        collection: 'lms-progress',
        where: {
          and: [
            { member: { equals: member.id } },
            { unit: { in: unitIds } },
          ],
        },
        sort: '-lastVisitedAt',
        limit: 1,
        depth: 1,
      })
      const r = recent.docs[0]
      const u = r?.unit
      if (u && typeof u === 'object' && 'slug' in u) {
        lastVisitedUnitSlug = String((u as { slug: string }).slug)
      }
    }
  }

  const moduleTitle = String(moduleDoc.title ?? '')
  const trackTitle = String(trackDoc.title ?? '')
  const summary =
    typeof moduleDoc.summary === 'string' ? moduleDoc.summary : null
  const isSample = Boolean(moduleDoc._isSample)

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <Link
        href={`/doctrine/${trackSlug}`}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        {trackTitle}
      </Link>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Doctrine module{isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {moduleTitle}
      </h1>
      {summary ? (
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {summary}
        </p>
      ) : null}

      {units.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          This module has no units yet.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {units.map((u, i) => (
            <li key={u.id}>
              <UnitFolio
                unit={u}
                index={i}
                isLastVisited={u.slug === lastVisitedUnitSlug}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
