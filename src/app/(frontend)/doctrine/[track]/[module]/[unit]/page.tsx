import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { DoctrineOutline } from '../../../../components/doctrine/doctrine-outline'
import { MobileOutline } from '../../../../components/doctrine/mobile-outline'
import { ProgressMeter } from '../../../../components/doctrine/progress-meter'
import { UnitPlayer } from '../../../../components/doctrine/unit-player'
import { toUnitFull } from '../../../../components/doctrine/serialise'
import { requireMember } from '@/lib/auth'
import {
  findProgressForUnit,
  touchProgress,
} from '@/lib/doctrine-progress'
import { getTrackOutline } from '@/lib/doctrine-outline'
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

  const outline = await getTrackOutline(trackSlug, {
    memberId: member.id,
    currentUnitSlug: unitSlug,
    currentModuleSlug: moduleSlug,
  })
  if (!outline) notFound()

  // Flatten the outline to compute prev/next siblings across module
  // boundaries. The slug pair {moduleSlug, slug} is the key.
  const flat = outline.modules.flatMap((m) =>
    m.units.map((u) => ({ moduleSlug: m.slug, ...u })),
  )
  const idx = flat.findIndex(
    (u) => u.moduleSlug === moduleSlug && u.slug === unitSlug,
  )
  if (idx < 0) notFound()
  const prevEntry = idx > 0 ? flat[idx - 1] : null
  const nextEntry = idx < flat.length - 1 ? flat[idx + 1] : null
  const prevHref = prevEntry
    ? `/doctrine/${trackSlug}/${prevEntry.moduleSlug}/${prevEntry.slug}`
    : null
  const nextHref = nextEntry
    ? `/doctrine/${trackSlug}/${nextEntry.moduleSlug}/${nextEntry.slug}`
    : null

  // Module-relative position for the "Folio iii. of vii." footer.
  const currentModule = outline.modules.find((m) => m.slug === moduleSlug)
  if (!currentModule) notFound()
  const positionInModule = currentModule.units.findIndex(
    (u) => u.slug === unitSlug,
  )
  const totalInModule = currentModule.units.length

  // Fetch the unit's full content (lanes + mastery) — outline only holds
  // the chrome shape, not the body.
  const p = await payload()
  const unitR = await p.find({
    collection: 'doctrine-units',
    where: {
      slug: { equals: unitSlug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2, // resolve module → track AND lane uploads
  })
  const unitDoc = unitR.docs[0]
  if (!unitDoc) notFound()

  // The outline already validated module/track ancestry; no need to re-check.

  // Touch progress (mark visited) so the resume banner picks this up.
  await touchProgress(member, unitDoc.id as number)

  const progress = await findProgressForUnit(member.id, unitDoc.id as number)
  const previousAnswer =
    progress && typeof progress.masteryAnswer === 'string'
      ? progress.masteryAnswer
      : null

  // Splice the track onto the depth-2-hydrated module so the serialiser
  // can reach `module.track.{slug,title}` for breadcrumbs.
  const moduleHydrated = unitDoc.module as unknown as Record<string, unknown>
  if (moduleHydrated && typeof moduleHydrated === 'object') {
    moduleHydrated.track = {
      id: outline.id,
      slug: outline.slug,
      title: outline.title,
    }
  }
  const unit = toUnitFull(unitDoc)

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
        {/* Sidebar — sticky on desktop, hidden on mobile (mobile gets the
            disclosure outline at the top of the article instead). */}
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

          <div className="mt-8 lg:mt-0">
            <UnitPlayer
              unit={unit}
              positionInModule={positionInModule}
              totalInModule={totalInModule}
              prevHref={prevHref}
              nextHref={nextHref}
              previousAnswer={previousAnswer}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
