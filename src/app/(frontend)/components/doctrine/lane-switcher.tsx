'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'

export type LaneId = 'read' | 'watch' | 'listen'

const LABEL: Record<LaneId, string> = {
  read: 'Read',
  watch: 'Watch',
  listen: 'Listen',
}

export function LaneSwitcher({
  lanes,
  active,
  onChange,
}: {
  lanes: LaneId[]
  active: LaneId
  onChange: (next: LaneId) => void
}) {
  // Stable ID for the indicator's layoutId so the spring travels between
  // tabs as the user switches. layoutId must be stable across re-renders.
  const layoutId = useId()
  return (
    <div
      role="tablist"
      aria-label="Lane"
      className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-vellum-deep/40 p-1"
    >
      {lanes.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={active === l}
          aria-controls={`lane-panel-${l}`}
          tabIndex={active === l ? 0 : -1}
          onClick={() => onChange(l)}
          className="relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rubric/60"
        >
          {active === l ? (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-ink"
              transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
            />
          ) : null}
          <span
            className={`relative z-10 ${
              active === l ? 'text-vellum' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {LABEL[l]}
          </span>
        </button>
      ))}
    </div>
  )
}
