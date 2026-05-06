// src/app/(frontend)/components/atlas/serialise.ts
//
// Payload-doc → wire-shape mappers shared by every server page that hands
// data into the Atlas client components. Defensive narrowing at the boundary
// keeps types tight downstream.
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
  type MiracleVideo,
  type PilgrimageRouteStop,
  type PilgrimageSummary,
} from './types'

export function toMiracleSummary(raw: unknown): MiracleSummary {
  const r = raw as Record<string, unknown>
  const coords = Array.isArray(r.coordinates) ? (r.coordinates as number[]) : [0, 0]
  const sourcesRaw = Array.isArray(r.sources) ? r.sources : []
  const artworkRaw = Array.isArray(r.artwork) ? r.artwork : []

  const sources: MiracleSource[] = sourcesRaw.map((s) => {
    const o = s as Record<string, unknown>
    return {
      label: typeof o.label === 'string' ? o.label : '',
      url: typeof o.url === 'string' ? o.url : null,
      attribution: typeof o.attribution === 'string' ? o.attribution : null,
    }
  })

  const artwork: MiracleArtwork[] = artworkRaw
    .map((a): MiracleArtwork | null => {
      // depth ≥ 2 resolves uploads to full doc; depth ≤ 1 returns id string.
      if (typeof a !== 'object' || a === null) return null
      const o = a as Record<string, unknown>
      const url = typeof o.url === 'string' ? o.url : null
      if (!url) return null
      return {
        id: String(o.id ?? url),
        url,
        alt: typeof o.alt === 'string' ? o.alt : '',
        caption: typeof o.caption === 'string' ? o.caption : null,
        attribution: typeof o.attribution === 'string' ? o.attribution : null,
      }
    })
    .filter((a): a is MiracleArtwork => a !== null)

  const videosRaw = Array.isArray(r.videos) ? r.videos : []
  const videos: MiracleVideo[] = videosRaw
    .map((v): MiracleVideo | null => {
      if (typeof v !== 'object' || v === null) return null
      const o = v as Record<string, unknown>
      const url = typeof o.url === 'string' ? o.url.trim() : ''
      if (!url) return null
      return {
        url,
        label: typeof o.label === 'string' ? o.label : null,
        attribution: typeof o.attribution === 'string' ? o.attribution : null,
      }
    })
    .filter((v): v is MiracleVideo => v !== null)

  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    type: r.type as MiracleType,
    ecclesialStatus: r.ecclesialStatus as EcclesialStatus,
    locationName: String(r.locationName ?? ''),
    coordinates: [Number(coords[0] ?? 0), Number(coords[1] ?? 0)],
    yearOccurred: Number(r.yearOccurred ?? 0),
    dateApproximate: Boolean(r.dateApproximate),
    approvalDate:
      typeof r.approvalDate === 'string' ? r.approvalDate : null,
    approvingAuthority:
      typeof r.approvingAuthority === 'string' ? r.approvingAuthority : null,
    summary: String(r.summary ?? ''),
    narrative: r.narrative ?? null,
    sources,
    artwork,
    videos,
    isSample: Boolean(r._isSample),
  }
}

export type PilgrimageSummaryOptions = {
  /**
   * When true (walker page), resolve each route stop's miracle to a full
   * MiracleSummary. Requires the caller to have used `depth: 3` so route →
   * miracle → artwork uploads are all hydrated.
   *
   * When false (gallery page), the route is empty[] — the gallery never
   * renders stops inline. Callers that need the stop count should derive it
   * from the raw doc (see /atlas/pilgrimages/page.tsx).
   */
  includeRoute: boolean
}

export function toPilgrimageSummary(
  raw: unknown,
  { includeRoute }: PilgrimageSummaryOptions,
): PilgrimageSummary {
  const r = raw as Record<string, unknown>
  const cover = (r.coverImage && typeof r.coverImage === 'object'
    ? (r.coverImage as Record<string, unknown>)
    : null)

  const routeRaw = Array.isArray(r.route) ? r.route : []

  const route: PilgrimageRouteStop[] = includeRoute
    ? routeRaw
        .map((stop): PilgrimageRouteStop | null => {
          if (typeof stop !== 'object' || stop === null) return null
          const o = stop as Record<string, unknown>
          const miracleRaw = o.miracle
          if (typeof miracleRaw !== 'object' || miracleRaw === null) return null
          const miracle = toMiracleSummary(miracleRaw)
          if (!miracle.id) return null
          return {
            miracle,
            chapterNote: typeof o.chapterNote === 'string' ? o.chapterNote : null,
          }
        })
        .filter((s): s is PilgrimageRouteStop => s !== null)
    : []

  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : null,
    intro: typeof r.intro === 'string' ? r.intro : null,
    coverImage: cover && typeof cover.url === 'string'
      ? {
          url: cover.url as string,
          alt: typeof cover.alt === 'string' ? cover.alt : '',
        }
      : null,
    route,
    isSample: Boolean(r._isSample),
  }
}

/**
 * Returns the *count* of route stops on a raw pilgrimage doc without
 * hydrating any miracle docs. Used by the gallery page where `route: []`
 * is intentional but the plate still wants to display "{N} chapters".
 */
export function pilgrimageRouteCount(raw: unknown): number {
  const r = raw as Record<string, unknown>
  return Array.isArray(r.route) ? r.route.length : 0
}
