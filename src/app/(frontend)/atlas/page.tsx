import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { AtlasShell } from '../components/atlas/atlas-shell'
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
} from '../components/atlas/types'
import { LivePreviewListener } from '../components/live-preview-listener'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Atlas',
  description:
    'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type SearchParams = Promise<{ focus?: string }>

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { isEnabled: isDraft } = await draftMode()
  const { focus } = await searchParams

  const p = await payload()

  const settings = await p.findGlobal({ slug: 'settings' })
  const styleUrl =
    (typeof settings.mapboxStyle === 'string' && settings.mapboxStyle.trim()) ||
    process.env.MAPBOX_STYLE_URL ||
    undefined

  const result = await p.find({
    collection: 'miracles',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit: 500,
    sort: 'yearOccurred',
    depth: 2, // resolve artwork upload relations
  })

  if (result.docs.length === 0 && !isDraft) {
    // No miracles seeded yet — render an honest "opens soon" instead of crashing.
    return <AtlasEmpty />
  }

  const miracles: MiracleSummary[] = result.docs.map((d) => toSummary(d))

  return (
    <main className="min-h-[80dvh] pb-24">
      <AtlasShell
        miracles={miracles}
        styleUrl={styleUrl}
        initialFocusSlug={focus}
        initialMode="explore"
      />
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}

function AtlasEmpty() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate I · Cartography
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The Atlas opens soon.
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        Once the studio holds approved miracles, this page becomes a 3D globe of
        the corpus and a curated pilgrimage of the most extraordinary witnesses.
      </p>
    </main>
  )
}

// Map a raw Payload `miracles` doc to the serialisable MiracleSummary the
// client components consume. Keeps types tight at the boundary.
function toSummary(d: unknown): MiracleSummary {
  const r = d as Record<string, unknown>
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
      // depth:2 resolves upload to full doc; depth:0/1 returns id string.
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
    inPilgrimage: Boolean(r.inPilgrimage),
    pilgrimageOrder:
      typeof r.pilgrimageOrder === 'number' ? r.pilgrimageOrder : null,
    isSample: Boolean(r._isSample),
  }
}
