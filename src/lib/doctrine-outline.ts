// src/lib/doctrine-outline.ts
//
// One-shot fetcher for the full course outline of a track: track → modules
// → units, plus per-unit completion status for a given member. Powers the
// course outline sidebar on the unit player and the expanded outline on
// the track + module overview pages.
import 'server-only'

import { payload } from './payload'

export type OutlineUnit = {
  id: string
  slug: string
  title: string
  order: number
  hasWatch: boolean
  hasListen: boolean
  isSample: boolean
  isComplete: boolean
  isCurrent: boolean
}

export type OutlineModule = {
  id: string
  slug: string
  title: string
  summary: string | null
  order: number
  isSample: boolean
  isCurrent: boolean
  units: OutlineUnit[]
  completedCount: number
}

export type TrackOutline = {
  id: string
  slug: string
  title: string
  summary: string | null
  isSample: boolean
  coverPlate: { url: string; alt: string } | null
  modules: OutlineModule[]
  totalUnits: number
  completedUnits: number
  /** Member's resume target — most-recently visited unit on this track. */
  resumeHref: string | null
  resumeTitle: string | null
}

export async function getTrackOutline(
  trackSlug: string,
  options: {
    memberId?: number | string
    currentUnitSlug?: string
    currentModuleSlug?: string
  } = {},
): Promise<TrackOutline | null> {
  const p = await payload()

  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: {
      slug: { equals: trackSlug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })
  const trackDoc = trackR.docs[0]
  if (!trackDoc) return null

  const modulesR = await p.find({
    collection: 'doctrine-modules',
    where: {
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 200,
    sort: ['order', 'title'],
    depth: 0,
  })

  const moduleIds = modulesR.docs.map((m) => m.id as number)
  const unitsR =
    moduleIds.length > 0
      ? await p.find({
          collection: 'doctrine-units',
          where: {
            module: { in: moduleIds },
            _status: { equals: 'published' },
          },
          limit: 1000,
          sort: ['order', 'title'],
          depth: 1, // hydrate lane upload relationships for hasWatch/hasListen
        })
      : { docs: [] as Array<Record<string, unknown>> }

  // Member completion: a unit is "complete" when there's any progress row,
  // regardless of mastery correctness. Visiting counts as engagement; that's
  // the intent of the resume + outline UX.
  const completedUnitIds = new Set<number>()
  let resumeHref: string | null = null
  let resumeTitle: string | null = null
  if (options.memberId && unitsR.docs.length > 0) {
    const unitIds = unitsR.docs.map((u) => (u as { id: number }).id)
    const progressR = await p.find({
      collection: 'lms-progress',
      where: {
        and: [
          { member: { equals: options.memberId } },
          { unit: { in: unitIds } },
        ],
      },
      limit: 1000,
      sort: '-lastVisitedAt',
      depth: 0,
    })
    for (const row of progressR.docs) {
      const u = (row as { unit?: number | { id: number } }).unit
      const id = typeof u === 'object' && u !== null ? u.id : (u as number)
      if (typeof id === 'number') completedUnitIds.add(id)
    }
    // Resume target = the topmost (most recent) progress row that maps to
    // a unit on THIS track. Walk the sorted progress list and stop at first
    // match.
    for (const row of progressR.docs) {
      const u = (row as { unit?: number | { id: number } }).unit
      const id = typeof u === 'object' && u !== null ? u.id : (u as number)
      const matched = unitsR.docs.find(
        (d) => (d as { id: number }).id === id,
      )
      if (matched) {
        const moduleObj = (matched as { module?: unknown }).module
        const m =
          moduleObj && typeof moduleObj === 'object'
            ? (moduleObj as { slug?: string })
            : null
        if (m?.slug) {
          resumeHref = `/doctrine/${trackSlug}/${m.slug}/${String(
            (matched as { slug?: string }).slug ?? '',
          )}`
          resumeTitle = String((matched as { title?: string }).title ?? '')
        }
        break
      }
    }
  }

  // Group units under their owning module. The unit's `module` field is
  // depth-1-hydrated, so we read its id directly.
  const unitsByModule = new Map<number, Array<Record<string, unknown>>>()
  for (const u of unitsR.docs) {
    const moduleField = (u as { module?: number | { id: number } }).module
    const moduleId =
      typeof moduleField === 'object' && moduleField !== null
        ? moduleField.id
        : (moduleField as number)
    if (typeof moduleId !== 'number') continue
    const arr = unitsByModule.get(moduleId) ?? []
    arr.push(u as Record<string, unknown>)
    unitsByModule.set(moduleId, arr)
  }

  const modules: OutlineModule[] = modulesR.docs.map((m) => {
    const id = m.id as number
    const moduleSlug = String(m.slug ?? '')
    const groupedUnits = unitsByModule.get(id) ?? []
    const units: OutlineUnit[] = groupedUnits.map((u) => {
      const lanes =
        u.lanes && typeof u.lanes === 'object'
          ? (u.lanes as Record<string, unknown>)
          : null
      const watch = lanes?.watchVideo
      const listen = lanes?.listenAudio
      const hasWatch =
        typeof watch === 'object' &&
        watch !== null &&
        typeof (watch as { url?: string }).url === 'string'
      const hasListen =
        typeof listen === 'object' &&
        listen !== null &&
        typeof (listen as { url?: string }).url === 'string'
      const unitSlug = String(u.slug ?? '')
      return {
        id: String(u.id),
        slug: unitSlug,
        title: String(u.title ?? ''),
        order: Number(u.order ?? 0),
        hasWatch,
        hasListen,
        isSample: Boolean(u._isSample),
        isComplete: completedUnitIds.has(Number(u.id)),
        isCurrent:
          options.currentUnitSlug != null &&
          options.currentModuleSlug === moduleSlug &&
          options.currentUnitSlug === unitSlug,
      }
    })
    const completedCount = units.filter((u) => u.isComplete).length
    return {
      id: String(id),
      slug: moduleSlug,
      title: String(m.title ?? ''),
      summary: typeof m.summary === 'string' ? m.summary : null,
      order: Number(m.order ?? 0),
      isSample: Boolean(m._isSample),
      isCurrent: options.currentModuleSlug === moduleSlug,
      units,
      completedCount,
    }
  })

  const totalUnits = modules.reduce((s, m) => s + m.units.length, 0)
  const completedUnits = modules.reduce((s, m) => s + m.completedCount, 0)

  // Payload's generated `coverPlate` type is `Media | number | null`. We cast
  // through `unknown` to a permissive shape because we only need `url` + `alt`.
  const cover =
    trackDoc.coverPlate && typeof trackDoc.coverPlate === 'object'
      ? (trackDoc.coverPlate as unknown as Record<string, unknown>)
      : null

  return {
    id: String(trackDoc.id),
    slug: trackSlug,
    title: String(trackDoc.title ?? ''),
    summary: typeof trackDoc.summary === 'string' ? trackDoc.summary : null,
    isSample: Boolean(trackDoc._isSample),
    coverPlate:
      cover && typeof cover.url === 'string'
        ? {
            url: cover.url as string,
            alt: typeof cover.alt === 'string' ? cover.alt : '',
          }
        : null,
    modules,
    totalUnits,
    completedUnits,
    resumeHref,
    resumeTitle,
  }
}

/**
 * URL of the first unit in the outline (the "Begin reading" CTA target).
 * Falls back to the track page when the track has no units.
 */
export function firstUnitHref(outline: TrackOutline): string {
  for (const m of outline.modules) {
    const u = m.units[0]
    if (u) return `/doctrine/${outline.slug}/${m.slug}/${u.slug}`
  }
  return `/doctrine/${outline.slug}`
}
