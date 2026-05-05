// src/app/(frontend)/components/atlas/filter-chips.tsx
'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import {
  type EcclesialStatus,
  type MiracleType,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
} from './types'

const TYPE_ORDER: MiracleType[] = [
  'eucharistic',
  'marian',
  'healing',
  'stigmata',
  'incorruptible',
  'other',
]

const STATUS_ORDER: EcclesialStatus[] = [
  'approved',
  'recognised',
  'worthy-of-belief',
  'under-investigation',
  'not-constatat',
]

export function FilterChips({
  selectedTypes,
  onToggleType,
  selectedStatuses,
  onToggleStatus,
  className,
}: {
  selectedTypes: Set<MiracleType>
  onToggleType: (type: MiracleType) => void
  selectedStatuses: Set<EcclesialStatus>
  onToggleStatus: (status: EcclesialStatus) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Row label="Type">
        {TYPE_ORDER.map((t) => {
          const active = selectedTypes.has(t)
          return (
            <Chip
              key={t}
              active={active}
              onClick={() => onToggleType(t)}
              dotColor={PIN_HEX[t]}
            >
              {TYPE_LABEL[t]}
            </Chip>
          )
        })}
      </Row>
      <Row label="Status">
        {STATUS_ORDER.map((s) => {
          const active = selectedStatuses.has(s)
          return (
            <Chip key={s} active={active} onClick={() => onToggleStatus(s)}>
              {STATUS_LABEL[s]}
            </Chip>
          )
        })}
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  dotColor,
  children,
}: {
  active: boolean
  onClick: () => void
  dotColor?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
        active
          ? 'border-ink bg-ink text-vellum'
          : 'border-ink/15 bg-vellum/85 text-ink-soft hover:border-ink/30 hover:text-ink',
      )}
    >
      {dotColor ? (
        <span
          aria-hidden
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </button>
  )
}
