'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  // Only the home page renders a full-bleed dark hero; the header floats over
  // it. Every other page is on vellum, so the header sits in normal flow.
  const overDark = usePathname() === '/'
  const positioning = overDark
    ? 'absolute inset-x-0 top-0 z-20'
    : 'relative'
  const navTone = overDark
    ? 'text-vellum/70 hover:text-gilt'
    : 'text-ink-soft hover:text-ink'
  const aboutPanel = overDark
    ? 'border-vellum/10 bg-ink/85 backdrop-blur'
    : 'border-ink/10 bg-vellum'
  const aboutLink = overDark
    ? 'text-vellum hover:bg-vellum/10'
    : 'text-ink hover:bg-vellum-deep'
  const burger = overDark ? 'border-vellum/30 bg-transparent' : 'border-ink/15'
  const burgerBar = overDark ? 'bg-vellum' : 'bg-ink'

  return (
    <>
      <header className={`${positioning} mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-7 sm:px-8 md:pt-10`}>
        <Link href="/" className="block">
          <Wordmark tone={overDark ? 'light' : 'dark'} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${navTone}`}
            >
              {item.label}
            </Link>
          ))}
          <details className="relative">
            <summary
              className={`cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${navTone}`}
            >
              About ⌄
            </summary>
            <div className={`absolute right-0 mt-3 w-48 rounded-xl border p-2 shadow-altar ${aboutPanel}`}>
              <Link
                href="/manifesto"
                className={`block rounded-md px-3 py-2 text-sm ${aboutLink}`}
              >
                Manifesto
              </Link>
              <Link
                href="/credits"
                className={`block rounded-md px-3 py-2 text-sm ${aboutLink}`}
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
          className={`grid h-10 w-10 place-items-center rounded-full border md:hidden ${burger}`}
        >
          <span className="flex flex-col gap-[3px]">
            <span className={`h-px w-5 ${burgerBar}`} />
            <span className={`h-px w-5 ${burgerBar}`} />
            <span className={`h-px w-5 ${burgerBar}`} />
          </span>
        </button>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
