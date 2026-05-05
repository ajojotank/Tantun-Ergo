// src/app/(frontend)/atlas/list/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import type { Where } from 'payload'
import type { ReactNode } from 'react'

import {
  type EcclesialStatus,
  type MiracleType,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from '../../components/atlas/types'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Atlas · Catalogue',
  description:
    'The full corpus of miracles, listed alphabetically. Keyboard-accessible alternative to the 3D globe.',
  robots: { index: false, follow: true },
}

type SearchParams = Promise<{ type?: string; status?: string }>

const TYPE_VALUES: MiracleType[] = [
  'eucharistic',
  'marian',
  'healing',
  'stigmata',
  'incorruptible',
  'other',
]
const STATUS_VALUES: EcclesialStatus[] = [
  'approved',
  'recognised',
  'worthy-of-belief',
  'under-investigation',
  'not-constatat',
]

export default async function AtlasListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const filterType = TYPE_VALUES.includes(params.type as MiracleType)
    ? (params.type as MiracleType)
    : undefined
  const filterStatus = STATUS_VALUES.includes(params.status as EcclesialStatus)
    ? (params.status as EcclesialStatus)
    : undefined

  const where: Where = { _status: { equals: 'published' } }
  if (filterType) where.type = { equals: filterType }
  if (filterStatus) where.ecclesialStatus = { equals: filterStatus }

  const result = await (await payload()).find({
    collection: 'miracles',
    where,
    limit: 500,
    sort: 'title',
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Atlas · Catalogue
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The full corpus
      </h1>
      <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-ink-soft">
        Every miracle in the Atlas, listed alphabetically. A keyboard-accessible
        alternative to the globe — and the mobile catalogue.
      </p>

      <FilterRow currentType={filterType} currentStatus={filterStatus} />

      {result.docs.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          No miracles match these filters.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {result.docs.map((m) => (
            <li key={m.id} className="py-7">
              <Link
                href={`/atlas?focus=${encodeURIComponent(String(m.slug))}`}
                className="group block"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {TYPE_LABEL[m.type as MiracleType]} ·{' '}
                  {STATUS_LABEL[m.ecclesialStatus as EcclesialStatus]} ·{' '}
                  {String(m.locationName ?? '')} ·{' '}
                  {formatYear(Number(m.yearOccurred), Boolean(m.dateApproximate))}
                  {m._isSample ? ' · [Sample]' : ''}
                </p>
                <h2 className="mt-2 font-display text-3xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
                  {String(m.title ?? '')}
                </h2>
                {m.summary ? (
                  <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
                    {String(m.summary)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t border-ink/10 pt-8">
        <Link
          href="/atlas"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
        >
          ← Back to the globe
        </Link>
      </div>
    </main>
  )
}

function FilterRow({
  currentType,
  currentStatus,
}: {
  currentType?: MiracleType
  currentStatus?: EcclesialStatus
}) {
  return (
    <div className="mt-8 flex flex-col gap-2 text-[11px]">
      <Group label="Type">
        <FilterLink href="/atlas/list" active={!currentType}>
          All
        </FilterLink>
        {TYPE_VALUES.map((t) => (
          <FilterLink
            key={t}
            href={`/atlas/list?type=${t}${currentStatus ? `&status=${currentStatus}` : ''}`}
            active={currentType === t}
          >
            {TYPE_LABEL[t]}
          </FilterLink>
        ))}
      </Group>
      <Group label="Status">
        <FilterLink
          href={currentType ? `/atlas/list?type=${currentType}` : '/atlas/list'}
          active={!currentStatus}
        >
          All
        </FilterLink>
        {STATUS_VALUES.map((s) => (
          <FilterLink
            key={s}
            href={`/atlas/list?status=${s}${currentType ? `&type=${currentType}` : ''}`}
            active={currentStatus === s}
          >
            {STATUS_LABEL[s]}
          </FilterLink>
        ))}
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      {children}
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'rounded-full border border-ink bg-ink px-3 py-1 font-mono uppercase tracking-[0.18em] text-vellum'
          : 'rounded-full border border-ink/15 bg-vellum/85 px-3 py-1 font-mono uppercase tracking-[0.18em] text-ink-soft hover:border-ink/30 hover:text-ink'
      }
    >
      {children}
    </Link>
  )
}
