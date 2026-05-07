// src/app/(frontend)/components/doctrine/track-plate.tsx
import Image from 'next/image'
import Link from 'next/link'

import { romanize, type DoctrineTrackSummary } from './types'

export function TrackPlate({
  track,
  index,
  moduleCount,
}: {
  track: DoctrineTrackSummary
  index: number
  moduleCount: number
}) {
  const numeral = romanize(index + 1)
  return (
    <Link
      href={`/doctrine/${track.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-ink/10 bg-parchment shadow-altar transition-transform hover:-translate-y-1"
    >
      {track.coverPlate ? (
        <Image
          src={track.coverPlate.url}
          alt={track.coverPlate.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          unoptimized={track.coverPlate.url.startsWith('/api/')}
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
          Track {numeral}
          {track.isSample ? ' · [Sample]' : ''}
        </p>
        <h2 className="font-display text-3xl italic leading-tight tracking-tight text-vellum md:text-4xl">
          {track.title}
        </h2>
        {track.summary ? (
          <p className="max-w-[40ch] text-sm leading-relaxed text-vellum/85">
            {track.summary}
          </p>
        ) : null}
        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum/70">
          {moduleCount} {moduleCount === 1 ? 'module' : 'modules'} · Begin reading →
        </p>
      </div>
    </Link>
  )
}
