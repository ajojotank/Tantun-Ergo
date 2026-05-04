import { ChiRho } from './chi-rho'

export function Wordmark({
  className,
  showIcon = true,
}: {
  className?: string
  showIcon?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
      {showIcon ? (
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-ink text-vellum"
          style={{ boxShadow: 'var(--shadow-relief)' }}
        >
          <ChiRho size={18} />
        </span>
      ) : null}
      <span className="leading-tight">
        <span className="block font-display text-lg italic text-ink">Tantum Ergo</span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Studio · ZA
        </span>
      </span>
    </span>
  )
}
