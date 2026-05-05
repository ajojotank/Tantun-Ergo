// src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { LivePreviewListener } from '../../../components/live-preview-listener'
import { Pilgrimage } from '../../../components/atlas/pilgrimage'
import { toPilgrimageSummary } from '../../../components/atlas/serialise'
import { payload } from '@/lib/payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  // Cheap fetch — depth 0, just title + subtitle. Server-rendered, cached
  // per request by Payload's connection pool.
  const result = await (await payload()).find({
    collection: 'pilgrimages',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const doc = result.docs[0]
  if (!doc) {
    return {
      title: 'Pilgrimage',
      description: 'A curated scrolltelling walk through the Miracle Atlas.',
    }
  }
  const title = typeof doc.title === 'string' ? doc.title : 'Pilgrimage'
  const subtitle = typeof doc.subtitle === 'string' ? doc.subtitle : null
  return {
    title: `Pilgrimage · ${title}`,
    description: subtitle ?? 'A curated scrolltelling walk through the Miracle Atlas.',
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

  const pilgrimage = toPilgrimageSummary(doc, { includeRoute: true })

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
