'use client'

interface ChainItem {
  locator: string
  note?: string
}

interface Props {
  chain?: ChainItem[]
}

export function CitationTraceCard({ chain = [] }: Props) {
  if (chain.length < 2) return null
  return (
    <aside className="my-4 border border-ink/20 px-4 py-3 bg-vellum-deep/40">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">Citation lineage</p>
      <ol className="flex flex-wrap items-center gap-2 text-sm font-display italic text-ink">
        {chain.map((step, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="border-b border-ink/30">{step.locator}</span>
            {step.note && <span className="text-xs text-ink-soft not-italic font-mono">({step.note})</span>}
            {i < chain.length - 1 && <span className="text-ink-soft">→</span>}
          </li>
        ))}
      </ol>
    </aside>
  )
}
