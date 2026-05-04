// src/app/(frontend)/components/coming-soon.tsx
import Link from 'next/link'

export function ComingSoon({
  pillar,
  numeral,
  intent,
  comingIn,
}: {
  pillar: string
  numeral: 'I' | 'II' | 'III'
  intent: string
  comingIn: string
}) {
  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate {numeral} · Coming soon
      </p>
      <h1 className="mt-4 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
        {pillar}
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">{intent}</p>
      <p className="mt-12 font-display text-base italic text-ink-soft">{comingIn}</p>
      <div className="mt-16 flex flex-wrap gap-4">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
        >
          ← Return to threshold
        </Link>
      </div>
    </main>
  )
}
