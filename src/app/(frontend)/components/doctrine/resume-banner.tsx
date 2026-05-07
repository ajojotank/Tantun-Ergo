// src/app/(frontend)/components/doctrine/resume-banner.tsx
import Link from 'next/link'

export function ResumeBanner({
  unitTitle,
  trackTitle,
  moduleTitle,
  href,
}: {
  unitTitle: string
  trackTitle: string
  moduleTitle: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group mt-12 flex flex-col gap-2 rounded-2xl border border-gilt/40 bg-vellum-deep/60 px-6 py-5 transition-colors hover:border-gilt md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gilt">
          Continue where you left off
        </p>
        <p className="mt-1 font-display text-2xl italic leading-tight text-ink md:text-3xl">
          {unitTitle}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {trackTitle} · {moduleTitle}
        </p>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Resume →
      </p>
    </Link>
  )
}
