// src/app/(frontend)/components/doctrine/module-folio.tsx
import Link from 'next/link'

import { romanize, type DoctrineModuleSummary } from './types'

export function ModuleFolio({
  module,
  index,
}: {
  module: DoctrineModuleSummary
  index: number
}) {
  const numeral = romanize(index + 1)
  return (
    <Link
      href={`/doctrine/${module.trackSlug}/${module.slug}`}
      className="group block py-7"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Module {numeral}
        {module.isSample ? ' · [Sample]' : ''} · {module.unitCount}{' '}
        {module.unitCount === 1 ? 'unit' : 'units'}
      </p>
      <h3 className="mt-2 font-display text-3xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
        {module.title}
      </h3>
      {module.summary ? (
        <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
          {module.summary}
        </p>
      ) : null}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Begin module →
      </p>
    </Link>
  )
}
