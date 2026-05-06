// src/app/(frontend)/components/atlas/mode-toggle.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/cn'

export type AtlasMode = 'explore' | 'pilgrimages'

const TABS: Array<{ mode: AtlasMode; label: string; href: string }> = [
  { mode: 'explore', label: 'Explore', href: '/atlas' },
  { mode: 'pilgrimages', label: 'Pilgrimages', href: '/atlas/pilgrimages' },
]

export function ModeToggle({ className }: { className?: string }) {
  const pathname = usePathname()
  const activeMode: AtlasMode =
    pathname === '/atlas/pilgrimages' || pathname.startsWith('/atlas/pilgrimages/')
      ? 'pilgrimages'
      : 'explore'

  return (
    <nav
      aria-label="Atlas mode"
      className={cn(
        'flex w-full max-w-[280px] items-center gap-px rounded-full border border-ink/10 bg-vellum/85 p-0.5 backdrop-blur',
        className,
      )}
    >
      {TABS.map(({ mode, label, href }) => {
        const active = mode === activeMode
        return (
          <Link
            key={mode}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex-1 rounded-full px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              active
                ? 'bg-ink text-vellum'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
