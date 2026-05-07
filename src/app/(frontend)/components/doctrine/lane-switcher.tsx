'use client'

export type LaneId = 'read' | 'watch' | 'listen'

export function LaneSwitcher({
  lanes,
  active,
  onChange,
}: {
  lanes: LaneId[]
  active: LaneId
  onChange: (next: LaneId) => void
}) {
  // D3 replaces this stub with the real switcher.
  return (
    <div role="tablist" className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.22em]">
      {lanes.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={active === l}
          onClick={() => onChange(l)}
          className={
            active === l
              ? 'rounded-full border border-ink bg-ink px-3 py-1 text-vellum'
              : 'rounded-full border border-ink/15 bg-vellum px-3 py-1 text-ink-soft hover:border-ink/30 hover:text-ink'
          }
        >
          {l === 'read' ? 'Read' : l === 'watch' ? 'Watch' : 'Listen'}
        </button>
      ))}
    </div>
  )
}
