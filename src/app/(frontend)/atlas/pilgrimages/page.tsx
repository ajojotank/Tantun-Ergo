// src/app/(frontend)/atlas/pilgrimages/page.tsx
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { LivePreviewListener } from '../../components/live-preview-listener'
import { ModeToggle } from '../../components/atlas/mode-toggle'
import { PilgrimagePlate } from '../../components/atlas/pilgrimage-plate'
import {
  pilgrimageRouteCount,
  toPilgrimageSummary,
} from '../../components/atlas/serialise'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Atlas · Pilgrimages',
  description:
    'Curated routes through the Miracle Atlas. Choose a pilgrimage to walk.',
}

// Force dynamic rendering so newly published pilgrimages appear immediately,
// without waiting for a rebuild. Stewards add curated routes via the studio
// and expect them to be live the moment they hit Publish.
export const dynamic = 'force-dynamic'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function PilgrimagesGallery() {
  const { isEnabled: isDraft } = await draftMode()

  const result = await (await payload()).find({
    collection: 'pilgrimages',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit: 50,
    sort: 'title',
    depth: 1, // resolve coverImage upload
  })

  // Gallery doesn't render route stops inline — serialise without hydrating
  // each miracle and pair with the raw stop count for the plate's
  // "{N} chapters" label.
  const pilgrimages = result.docs.map((d) => ({
    pilgrimage: toPilgrimageSummary(d, { includeRoute: false }),
    stopCount: pilgrimageRouteCount(d),
  }))

  return (
    <main className="min-h-[80dvh] pb-24">
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between md:py-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Plate I · Cartography
          </p>
          <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
            Choose a pilgrimage
          </h1>
          <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-ink-soft md:text-lg">
            Each route is a scrolltelling chapter sequence: the map flies from
            stop to stop, the captions slide in, the buildings rise as you arrive.
          </p>
        </div>
        <ModeToggle />
      </header>

      {pilgrimages.length === 0 ? (
        <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
          <p className="font-display text-2xl italic text-ink-soft">
            No pilgrimages yet — the studio&rsquo;s curators are at work.
          </p>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-3">
          {pilgrimages.map(({ pilgrimage, stopCount }, i) => (
            <PilgrimagePlate
              key={pilgrimage.id}
              pilgrimage={pilgrimage}
              stopCount={stopCount}
              index={i}
            />
          ))}
        </div>
      )}

      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}
