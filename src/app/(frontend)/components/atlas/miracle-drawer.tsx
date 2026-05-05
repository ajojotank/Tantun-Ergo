// src/app/(frontend)/components/atlas/miracle-drawer.tsx
'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { type RefObject, useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const SPRING = { type: 'spring', stiffness: 220, damping: 30, mass: 0.7 } as const

export function MiracleDrawer({
  miracle,
  onClose,
}: {
  miracle: MiracleSummary | null
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!miracle) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    // Defer focus to the next tick so the drawer is mounted in the DOM.
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [miracle, onClose])

  return (
    <AnimatePresence>
      {miracle ? (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close detail panel"
            onClick={onClose}
            className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="false"
            aria-labelledby="miracle-drawer-title"
            className={cn(
              'fixed z-40 overflow-y-auto bg-vellum text-ink shadow-altar',
              // Bottom-sheet (mobile) / right-aside (md+)
              'inset-x-0 bottom-0 max-h-[80dvh] rounded-t-3xl border-t border-ink/10',
              'md:inset-y-0 md:right-0 md:bottom-auto md:max-h-none md:w-[440px] md:rounded-none md:border-l md:border-t-0',
            )}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={SPRING}
          >
            <DrawerBody miracle={miracle} onClose={onClose} closeButtonRef={closeButtonRef} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function DrawerBody({
  miracle,
  onClose,
  closeButtonRef,
}: {
  miracle: MiracleSummary
  onClose: () => void
  closeButtonRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: PIN_HEX[miracle.type] }}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]}
          </span>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
        >
          Close
        </button>
      </header>

      <div>
        <h2
          id="miracle-drawer-title"
          className="font-display text-3xl italic leading-tight tracking-tight text-ink md:text-4xl"
        >
          {miracle.title}
        </h2>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {miracle.locationName} · {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
          {miracle.isSample ? ' · [Sample]' : ''}
        </p>
      </div>

      <p className="text-base leading-relaxed text-ink-soft">{miracle.summary}</p>

      {miracle.artwork.length > 0 ? (
        <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
          {miracle.artwork.map((art) => (
            <figure
              key={art.id}
              className="relative aspect-[4/5] min-w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl bg-parchment"
            >
              <Image
                src={art.url}
                alt={art.alt}
                fill
                sizes="(min-width: 768px) 360px, 78vw"
                className="object-cover"
                unoptimized={art.url.startsWith('/api/')}
              />
              {art.attribution ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-vellum/85">
                  {art.attribution}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}

      {miracle.narrative ? <NarrativeBlock node={miracle.narrative} /> : null}

      {miracle.approvingAuthority ? (
        <div className="border-t border-ink/10 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Approving authority
          </p>
          <p className="mt-1 text-sm text-ink">{miracle.approvingAuthority}</p>
        </div>
      ) : null}

      {miracle.sources.length > 0 ? (
        <div className="border-t border-ink/10 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Sources
          </p>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-soft">
            {miracle.sources.map((s, i) => (
              <li key={i}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
                {s.attribution ? ` — ${s.attribution}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

// Permissive Lexical walker — paragraphs and inline text only. Anything else
// silently degrades to plain text. Matches Plan 1's reading article render.
function NarrativeBlock({ node }: { node: unknown }) {
  const root = (node as { root?: { children?: unknown[] } } | null)?.root
  const children = Array.isArray(root?.children) ? root!.children : []
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink">
      {children.map((c, i) => (
        <Paragraph key={i} node={c} />
      ))}
    </div>
  )
}

function Paragraph({ node }: { node: unknown }) {
  const n = node as {
    type?: string
    children?: Array<{ text?: string; type?: string }>
  } | null
  if (!n || n.type !== 'paragraph') return null
  const text = (n.children ?? [])
    .map((c) => (typeof c?.text === 'string' ? c.text : ''))
    .join('')
  if (!text) return null
  return <p>{text}</p>
}
