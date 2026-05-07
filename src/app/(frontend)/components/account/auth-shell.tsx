// src/app/(frontend)/components/account/auth-shell.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-md flex-col justify-center px-5 py-20 sm:px-8">
      <Link
        href="/"
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
      >
        ← Tantum Ergo
      </Link>
      <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {title}
      </h1>
      {intro ? (
        <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-ink-soft">
          {intro}
        </p>
      ) : null}
      <div className="mt-10">{children}</div>
    </main>
  )
}
