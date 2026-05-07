// src/app/(frontend)/components/doctrine/unit-folio.tsx
import Link from 'next/link'

import { romanize, type DoctrineUnitSummary } from './types'

export function UnitFolio({
  unit,
  index,
}: {
  unit: DoctrineUnitSummary
  index: number
}) {
  const numeral = romanize(index + 1)
  const lanes: string[] = ['Read']
  if (unit.hasWatch) lanes.push('Watch')
  if (unit.hasListen) lanes.push('Listen')
  return (
    <Link
      href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}/${unit.slug}`}
      className="group block py-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Folio {numeral.toLowerCase()}
        {unit.isSample ? ' · [Sample]' : ''} · {lanes.join(' · ')}
      </p>
      <h3 className="mt-2 font-display text-2xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-3xl">
        {unit.title}
      </h3>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Open folio →
      </p>
    </Link>
  )
}
