import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { UnitPlayer } from '../../../../components/doctrine/unit-player'
import { toUnitFull } from '../../../../components/doctrine/serialise'
import { requireMember } from '@/lib/auth'
import {
  findProgressForUnit,
  touchProgress,
} from '@/lib/doctrine-progress'
import { payload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ track: string; module: string; unit: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { unit: unitSlug } = await params
  const p = await payload()
  const r = await p.find({
    collection: 'doctrine-units',
    where: { slug: { equals: unitSlug } },
    limit: 1,
    depth: 0,
  })
  const u = r.docs[0]
  if (!u) return { title: 'Doctrine — not found' }
  return { title: `${u.title} · Doctrine` }
}

export default async function DoctrineUnitPage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug, module: moduleSlug, unit: unitSlug } = await params
  const member = await requireMember(
    `/doctrine/${trackSlug}/${moduleSlug}/${unitSlug}`,
  )
  const p = await payload()

  // Resolve the track + module by slug — these are checked for consistency
  // (the URL must match the unit's actual ancestors) so a malformed link
  // 404s rather than rendering misleading breadcrumbs.
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
    depth: 0,
  })
  const moduleDoc = moduleR.docs[0]
  if (!moduleDoc) notFound()

  const unitR = await p.find({
    collection: 'doctrine-units',
    where: {
      slug: { equals: unitSlug },
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2, // resolve module → track AND lane uploads
  })
  const unitDoc = unitR.docs[0]
  if (!unitDoc) notFound()

  // Sibling units in this module for the "Folio iii. of vii." footer
  // and the next-unit pointer.
  const siblingsR = await p.find({
    collection: 'doctrine-units',
    where: {
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 200,
    sort: ['order', 'title'],
    depth: 0,
  })
  const siblingSlugs = siblingsR.docs.map((d) => String(d.slug))
  const positionInModule = siblingSlugs.indexOf(unitSlug) // 0-based
  const totalInModule = siblingSlugs.length

  // Compute the next-unit URL: next sibling, or first unit of next module
  // (in `order`), or fall back to /doctrine.
  let nextHref: string | null = null
  if (positionInModule >= 0 && positionInModule < totalInModule - 1) {
    nextHref = `/doctrine/${trackSlug}/${moduleSlug}/${siblingSlugs[positionInModule + 1]}`
  } else {
    const nextModuleR = await p.find({
      collection: 'doctrine-modules',
      where: {
        track: { equals: trackDoc.id },
        order: { greater_than: Number(moduleDoc.order ?? 0) },
        _status: { equals: 'published' },
      },
      limit: 1,
      sort: ['order', 'title'],
      depth: 0,
    })
    const nm = nextModuleR.docs[0]
    if (nm) {
      const firstUnitR = await p.find({
        collection: 'doctrine-units',
        where: {
          module: { equals: nm.id },
          _status: { equals: 'published' },
        },
        limit: 1,
        sort: ['order', 'title'],
        depth: 0,
      })
      const fu = firstUnitR.docs[0]
      if (fu) {
        nextHref = `/doctrine/${trackSlug}/${String(nm.slug)}/${String(fu.slug)}`
      }
    }
  }

  // Touch progress (mark visited) so the resume banner picks this up.
  await touchProgress(member, unitDoc.id as number)

  // Read existing progress for this unit so the mastery check can render
  // the previous answer (if any) instead of a fresh form.
  const progress = await findProgressForUnit(member.id, unitDoc.id as number)
  const previousAnswer =
    progress && typeof progress.masteryAnswer === 'string'
      ? progress.masteryAnswer
      : null

  // Synthesize the breadcrumb/title fields. The serialise mapper expects
  // module + track to be hydrated on the unit; depth: 2 handled the module,
  // but depth doesn't recurse to track. Splice the track in manually.
  const moduleHydrated = unitDoc.module as unknown as Record<string, unknown>
  if (moduleHydrated && typeof moduleHydrated === 'object') {
    moduleHydrated.track = trackDoc
  }
  const unit = toUnitFull(unitDoc)

  return (
    <UnitPlayer
      unit={unit}
      positionInModule={positionInModule}
      totalInModule={totalInModule}
      nextHref={nextHref}
      previousAnswer={previousAnswer}
    />
  )
}
