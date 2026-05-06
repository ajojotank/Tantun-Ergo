import { ChiRho } from './chi-rho'

// Site-header brand mark. Two-tier hierarchy: a confident chi-rho glyph plus
// the wordmark in display italic. Sized to hold its own against the hero
// headline rather than read as a navbar footnote.
export function Wordmark({
  className,
  showIcon = true,
  tone = 'light',
}: {
  className?: string
  showIcon?: boolean
  tone?: 'light' | 'dark' // 'light' = vellum on dark hero; 'dark' = ink on cream
}) {
  const text = tone === 'light' ? 'text-vellum' : 'text-ink'
  // Chi-rho is always gold (gilt) regardless of tone — the brand mark stays
  // consistent across the dark home hero and the vellum interior pages.
  const accent = 'text-gilt'
  return (
    <span className={`inline-flex items-center gap-4 ${className ?? ''}`}>
      {showIcon ? (
        <ChiRho size={42} className={accent} />
      ) : null}
      <span
        className={`font-display text-2xl italic leading-none tracking-[-0.01em] sm:text-[26px] ${text}`}
      >
        Tantum Ergo
      </span>
    </span>
  )
}
