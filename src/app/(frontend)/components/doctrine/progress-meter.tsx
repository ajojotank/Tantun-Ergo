// src/app/(frontend)/components/doctrine/progress-meter.tsx

/**
 * Thin horizontal progress strip in gilt — used at the top of the track
 * page (and as a bar in the sidebar). Mono caption above. Server-only.
 */
export function ProgressMeter({
  completed,
  total,
  caption,
  className = '',
}: {
  completed: number
  total: number
  caption?: string
  className?: string
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
        {caption ?? `${completed} of ${total} units complete`}
      </p>
      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} complete`}
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-ink/10"
      >
        <div
          style={{ width: `${pct}%` }}
          className="h-full bg-gradient-to-r from-gilt/70 to-gilt"
        />
      </div>
    </div>
  )
}
