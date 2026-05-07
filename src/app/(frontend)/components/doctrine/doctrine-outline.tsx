// src/app/(frontend)/components/doctrine/doctrine-outline.tsx
import Link from 'next/link'

import { romanize, romanizeLower } from './types'

import type { TrackOutline } from '@/lib/doctrine-outline'

/**
 * Course-outline view: track → modules → units. Used in two variants.
 *
 * - `inline`: full-width, used as the body of /doctrine/[track] and
 *   /doctrine/[track]/[module]. Modules sit as expanded sections with
 *   unit rows beneath.
 * - `sidebar`: compact, used on the unit player. Same shape, tighter
 *   spacing; the parent positions it.
 */
export function DoctrineOutline({
  outline,
  variant = 'inline',
}: {
  outline: TrackOutline
  variant?: 'inline' | 'sidebar'
}) {
  const isSidebar = variant === 'sidebar'
  return (
    <div className={isSidebar ? 'space-y-6' : 'space-y-10'}>
      {outline.modules.map((m, mi) => (
        <section
          key={m.id}
          aria-labelledby={`module-${m.slug}-h`}
          className={
            m.isCurrent && isSidebar
              ? 'rounded-xl border border-gilt/30 bg-vellum-deep/40 p-3'
              : ''
          }
        >
          <header className={isSidebar ? 'pb-2' : 'pb-3'}>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
              Module {romanize(mi + 1)}
              {m.isSample ? ' · [Sample]' : ''} · {m.completedCount}/
              {m.units.length}
            </p>
            <h3
              id={`module-${m.slug}-h`}
              className={
                isSidebar
                  ? 'mt-1 font-display text-lg italic leading-snug text-ink'
                  : 'mt-1 font-display text-2xl italic leading-snug text-ink md:text-3xl'
              }
            >
              <Link
                href={`/doctrine/${outline.slug}/${m.slug}`}
                className="transition-colors hover:text-rubric-deep"
              >
                {m.title}
              </Link>
            </h3>
            {!isSidebar && m.summary ? (
              <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink-soft">
                {m.summary}
              </p>
            ) : null}
          </header>

          {m.units.length === 0 ? (
            <p
              className={
                isSidebar
                  ? 'pl-2 font-display text-xs italic text-ink-soft'
                  : 'pl-1 font-display text-base italic text-ink-soft'
              }
            >
              No units yet.
            </p>
          ) : (
            <ul
              className={
                isSidebar
                  ? 'mt-1 divide-y divide-ink/10'
                  : 'mt-1 divide-y divide-ink/10 border-t border-ink/10'
              }
            >
              {m.units.map((u, ui) => (
                <li key={u.id}>
                  <UnitRow
                    href={`/doctrine/${outline.slug}/${m.slug}/${u.slug}`}
                    folio={romanizeLower(ui + 1)}
                    title={u.title}
                    isComplete={u.isComplete}
                    isCurrent={u.isCurrent}
                    isSample={u.isSample}
                    hasWatch={u.hasWatch}
                    hasListen={u.hasListen}
                    variant={variant}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

function UnitRow({
  href,
  folio,
  title,
  isComplete,
  isCurrent,
  isSample,
  hasWatch,
  hasListen,
  variant,
}: {
  href: string
  folio: string
  title: string
  isComplete: boolean
  isCurrent: boolean
  isSample: boolean
  hasWatch: boolean
  hasListen: boolean
  variant: 'inline' | 'sidebar'
}) {
  const isSidebar = variant === 'sidebar'
  return (
    <Link
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      className={[
        'group flex items-center gap-3 transition-colors',
        isSidebar ? 'py-2 text-sm' : 'py-3.5 md:py-4',
        isCurrent
          ? 'border-l-2 border-gilt bg-vellum-deep/50 pl-3 -ml-3 pr-2'
          : 'border-l-2 border-transparent pl-3 -ml-3 hover:bg-vellum-deep/30',
      ].join(' ')}
    >
      <Glyph isComplete={isComplete} isCurrent={isCurrent} />
      <span
        className={
          isSidebar
            ? 'font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft'
            : 'font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft'
        }
        aria-hidden
      >
        Folio {folio}
      </span>
      <span
        className={[
          'flex-1 truncate transition-colors',
          isSidebar
            ? 'font-display text-base italic leading-tight'
            : 'font-display text-lg italic leading-tight md:text-xl',
          isCurrent
            ? 'text-ink'
            : isComplete
              ? 'text-ink-soft group-hover:text-ink'
              : 'text-ink group-hover:text-rubric-deep',
        ].join(' ')}
      >
        {title}
        {isSample && !isSidebar ? (
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft">
            [Sample]
          </span>
        ) : null}
      </span>
      {!isSidebar ? (
        <span
          aria-hidden
          className="hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft md:inline"
        >
          {laneLabel(hasWatch, hasListen)}
        </span>
      ) : null}
    </Link>
  )
}

/**
 * Status glyph at the start of each unit row.
 * - filled gilt circle: complete
 * - hollow gilt circle: current (where you are)
 * - thin ink-soft circle: not yet visited
 */
function Glyph({
  isComplete,
  isCurrent,
}: {
  isComplete: boolean
  isCurrent: boolean
}) {
  if (isComplete) {
    return (
      <span
        aria-label="Complete"
        className="grid size-5 shrink-0 place-items-center rounded-full bg-gilt text-vellum"
      >
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5 L7 12 L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (isCurrent) {
    return (
      <span
        aria-label="Current"
        className="size-5 shrink-0 rounded-full border-2 border-gilt bg-vellum"
      />
    )
  }
  return (
    <span
      aria-label="Not started"
      className="size-5 shrink-0 rounded-full border border-ink/25 bg-vellum"
    />
  )
}

function laneLabel(hasWatch: boolean, hasListen: boolean): string {
  const lanes = ['Read']
  if (hasWatch) lanes.push('Watch')
  if (hasListen) lanes.push('Listen')
  return lanes.join(' · ')
}
