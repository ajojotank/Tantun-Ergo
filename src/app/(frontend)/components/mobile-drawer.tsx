'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect } from 'react'

const ITEMS = [
  { href: '/atlas', label: 'Atlas', subtitle: 'Cartography of the miraculous' },
  { href: '/doctrine', label: 'Doctrine', subtitle: 'Long-form formation' },
  { href: '/catechist', label: 'Catechist', subtitle: 'Bound to citation' },
  { href: '/reading', label: 'Reading', subtitle: 'Editorial' },
  { href: '/manifesto', label: 'Manifesto', subtitle: 'Why we built this' },
  { href: '/credits', label: 'Credits', subtitle: 'Sources & review' },
] as const

export function MobileDrawer({
  open,
  onClose,
  displayName,
}: {
  open: boolean
  onClose: () => void
  displayName: string | null
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ clipPath: 'circle(0% at calc(100% - 36px) 36px)' }}
          animate={{ clipPath: 'circle(140% at calc(100% - 36px) 36px)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 36px) 36px)' }}
          transition={{ duration: 0.55, ease: [0.83, 0, 0.17, 1] }}
          className="fixed inset-0 z-50 bg-vellum text-ink"
          aria-hidden={!open}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-[100dvh] flex-col">
            <div className="flex items-center justify-between px-5 pt-6">
              <p className="font-display text-lg italic">Tantum Ergo</p>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-xs"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center px-6">
              <ul className="space-y-6">
                {ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.05, type: 'spring', stiffness: 110, damping: 22 }}
                  >
                    <Link href={item.href} onClick={onClose} className="group block">
                      <p className="font-display text-3xl italic leading-none text-ink">
                        {item.label}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                        {item.subtitle}
                      </p>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-ink/10 px-6 pt-4 pb-2">
              {displayName ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
                    {displayName}
                  </p>
                  <form action="/account/sign-out" method="post">
                    <button
                      type="submit"
                      className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/account/signin"
                  onClick={onClose}
                  className="block font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                >
                  Sign in →
                </Link>
              )}
            </div>

            <p className="px-6 pb-8 text-center font-display text-sm italic text-ink-soft">
              Genitori, Genitoque · laus et jubilatio.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
