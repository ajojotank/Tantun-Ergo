// src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { LivePreviewListener } from '../../../components/live-preview-listener'
import { Pilgrimage } from '../../../components/atlas/pilgrimage'
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
  type PilgrimageRouteStop,
  type PilgrimageSummary,
} from '../../../components/atlas/types'
import { payload } from '@/lib/payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Pilgrimage · ${slug.replace(/-/g, ' ')}`,
    description: 'A curated scrolltelling walk through the Miracle Atlas.',
  }
}

export default async function PilgrimageWalker({
  params,
}: {
  params: Params
}) {
  const { isEnabled: isDraft } = await draftMode()
  const { slug } = await params

  const p = await payload()

  const settings = await p.findGlobal({ slug: 'settings' })
  const styleUrl =
    (typeof settings.mapboxStyle === 'string' && settings.mapboxStyle.trim()) ||
    process.env.MAPBOX_STYLE_URL ||
    undefined

  const result = await p.find({
    collection: 'pilgrimages',
    where: {
      slug: { equals: slug },
      ...(isDraft ? {} : { _status: { equals: 'published' } }),
    },
    draft: isDraft,
    limit: 1,
    depth: 3, // resolve route → miracle → artwork uploads
  })

  const doc = result.docs[0]
  if (!doc) notFound()

  const pilgrimage = toSummary(doc)

  return (
    <main className="min-h-[80dvh] pb-12">
      <header className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
          Pilgrimage{pilgrimage.isSample ? ' · [Sample]' : ''}
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
          {pilgrimage.title}
        </h1>
        {pilgrimage.subtitle ? (
          <p className="mt-4 max-w-[55ch] font-display text-xl italic leading-relaxed text-ink-soft md:text-2xl">
            {pilgrimage.subtitle}
          </p>
        ) : null}
      </header>

      <Pilgrimage pilgrimage={pilgrimage} styleUrl={styleUrl} />

      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}

function toSummary(d: unknown): PilgrimageSummary {
  const r = d as Record<string, unknown>
  const cover = (r.coverImage && typeof r.coverImage === 'object'
    ? (r.coverImage as Record<string, unknown>)
    : null)

  const routeRaw = Array.isArray(r.route) ? r.route : []
  const route: PilgrimageRouteStop[] = routeRaw
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

function toMiracleSummary(raw: unknown): MiracleSummary {
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
    isSample: Boolean(r._isSample),
  }
}
