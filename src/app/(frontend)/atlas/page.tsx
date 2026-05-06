import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { AtlasShell } from '../components/atlas/atlas-shell'
import { toMiracleSummary } from '../components/atlas/serialise'
import { type MiracleSummary } from '../components/atlas/types'
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
    depth: 2,
  })

  if (result.docs.length === 0) {
    return (
      <>
        <AtlasEmpty />
        {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
      </>
    )
  }

  const miracles: MiracleSummary[] = result.docs.map((d) => toMiracleSummary(d))

  return (
    <main className="min-h-[80dvh] pb-24 md:flex md:h-[100dvh] md:flex-col md:overflow-hidden md:pb-0">
      <AtlasShell
        miracles={miracles}
        styleUrl={styleUrl}
        initialFocusSlug={focus}
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
