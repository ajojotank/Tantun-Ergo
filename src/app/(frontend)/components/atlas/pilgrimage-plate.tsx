// src/app/(frontend)/components/atlas/pilgrimage-plate.tsx
import Image from 'next/image'
import Link from 'next/link'

import { romanize, type PilgrimageSummary } from './types'

export function PilgrimagePlate({
  pilgrimage,
  stopCount,
  index,
}: {
  pilgrimage: PilgrimageSummary
  /**
   * Number of chapters in the pilgrimage. Passed in by the gallery rather
   * than read from `pilgrimage.route.length` because the gallery page
   * intentionally serialises route as `[]` (it doesn't hydrate stops at
   * `depth: 1`). The walker page passes the real route's length.
   */
  stopCount: number
  index: number
}) {
  const numeral = romanize(index + 1)
  return (
    <Link
      href={`/atlas/pilgrimages/${pilgrimage.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-ink/10 bg-parchment shadow-altar transition-transform hover:-translate-y-1"
    >
      {pilgrimage.coverImage ? (
        <Image
          src={pilgrimage.coverImage.url}
          alt={pilgrimage.coverImage.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          unoptimized={pilgrimage.coverImage.url.startsWith('/api/')}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-ink to-rubric-deep opacity-90" />
      )}

      <div
        aria-hidden
        className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-gilt/70 to-transparent"
      />

      <div className="relative space-y-2 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-6 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gilt">
          Pilgrimage {numeral}
          {pilgrimage.isSample ? ' · [Sample]' : ''}
        </p>
        <h2 className="font-display text-3xl italic leading-tight tracking-tight text-vellum md:text-4xl">
          {pilgrimage.title}
        </h2>
        {pilgrimage.subtitle ? (
          <p className="max-w-[40ch] text-sm leading-relaxed text-vellum/85">
            {pilgrimage.subtitle}
          </p>
        ) : null}
        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum/70">
          {stopCount} chapters · Begin →
        </p>
      </div>
    </Link>
  )
}
