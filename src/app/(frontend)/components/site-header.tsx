// src/app/(frontend)/_components/site-header.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Wordmark } from '@/components/brand/wordmark'
import { MobileDrawer } from './mobile-drawer'

const NAV = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/doctrine', label: 'Doctrine' },
  { href: '/catechist', label: 'Catechist' },
  { href: '/reading', label: 'Reading' },
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8 md:pt-10">
        <Link href="/" className="block">
          <Wordmark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink">
              About ⌄
            </summary>
            <div className="absolute right-0 mt-3 w-48 rounded-xl border border-ink/10 bg-vellum p-2 shadow-altar">
              <Link
                href="/manifesto"
                className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-vellum-deep"
              >
                Manifesto
              </Link>
              <Link
                href="/credits"
                className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-vellum-deep"
              >
                Credits
              </Link>
            </div>
          </details>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 md:hidden"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="h-px w-4 bg-ink" />
            <span className="h-px w-4 bg-ink" />
            <span className="h-px w-4 bg-ink" />
          </span>
        </button>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
