// src/app/(frontend)/components/doctrine/mobile-outline.tsx
import type { ReactNode } from 'react'

/**
 * Collapsed-by-default course outline shown above the unit player on
 * mobile. Uses a native `<details>` so it works without JS. The summary
 * shows the track title + progress; opening reveals the full outline.
 */
export function MobileOutline({
  trackTitle,
  completed,
  total,
  children,
}: {
  trackTitle: string
  completed: number
  total: number
  children: ReactNode
}) {
  return (
    <details className="group rounded-xl border border-ink/15 bg-vellum-deep/40 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0">
          <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
            Course outline · {completed}/{total}
          </span>
          <span className="block truncate font-display text-base italic leading-snug text-ink">
            {trackTitle}
          </span>
        </span>
        <span
          aria-hidden
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-transform group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="border-t border-ink/10 px-4 py-4">{children}</div>
    </details>
  )
}
