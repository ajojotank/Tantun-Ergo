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
  isOrbiting = false,
  onTogglePlayPause,
}: {
  miracle: MiracleSummary | null
  onClose: () => void
  /** True if the map is currently auto-rotating around the selected pin. */
  isOrbiting?: boolean
  /** Toggle handler — pauses if orbiting, resumes if paused. */
  onTogglePlayPause?: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!miracle) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    // Defer focus to the next tick so the drawer is mounted in the DOM.
    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    // Body scroll lock — ONLY on mobile (where the drawer is a bottom-sheet
    // covering most of the viewport and iOS Safari's overscroll-contain alone
    // isn't sufficient to prevent background scroll). On desktop the sticky-
    // 100dvh layout already constrains the work area; locking body there
    // interferes with the list column's Sticky scroll-anchor calculations and
    // can make the list feel jittery/unresponsive while the drawer is open.
    const isMobileViewport =
      typeof window !== 'undefined' && window.innerWidth < 768
    const prevBodyOverflow = document.body.style.overflow
    if (isMobileViewport) {
      document.body.style.overflow = 'hidden'
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      // Always restore prevBodyOverflow on cleanup. If the lock branch above
      // didn't fire (desktop), prevBodyOverflow already equals the live body
      // value — the assignment is a harmless no-op. If it did fire AND the
      // viewport later resized across the breakpoint while the drawer was
      // open, this still correctly restores the pre-lock state.
      document.body.style.overflow = prevBodyOverflow
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
              'atlas-scroll fixed z-40 overflow-y-auto overscroll-contain bg-vellum text-ink shadow-altar',
              // Bottom-sheet (mobile) / right-aside (md+).
              // On md+, `inset-y-0` sets top:0 AND bottom:0 — that's what gives the
              // drawer a hard viewport height so overflow-y-auto can engage. Don't add
              // bottom-auto here; it'd let the drawer grow to content height and break
              // internal scroll on tall content.
              'inset-x-0 bottom-0 max-h-[80dvh] rounded-t-3xl border-t border-ink/10',
              'md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:border-l md:border-t-0',
            )}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={SPRING}
          >
            <DrawerBody
              miracle={miracle}
              onClose={onClose}
              closeButtonRef={closeButtonRef}
              isOrbiting={isOrbiting}
              onTogglePlayPause={onTogglePlayPause}
            />
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
  isOrbiting,
  onTogglePlayPause,
}: {
  miracle: MiracleSummary
  onClose: () => void
  closeButtonRef: RefObject<HTMLButtonElement | null>
  isOrbiting: boolean
  onTogglePlayPause?: () => void
}) {
  return (
    <div className="relative flex flex-col gap-6 px-6 py-6 sm:px-8">
      {/* Corner close — conventional × at top-right, focusable + labeled. */}
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close detail panel"
        className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-full border border-ink/10 bg-vellum/85 text-ink-soft backdrop-blur transition-colors hover:border-ink/30 hover:text-ink"
      >
        <span aria-hidden className="text-base leading-none">✕</span>
      </button>

      {/* Eyebrow + title + meta — own breathing room, no inline close button. */}
      <div className="space-y-2 pr-12">
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
        <h2
          id="miracle-drawer-title"
          className="font-display text-3xl italic leading-tight tracking-tight text-ink md:text-4xl"
        >
          {miracle.title}
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {miracle.locationName} · {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
          {miracle.isSample ? ' · [Sample]' : ''}
        </p>
        {onTogglePlayPause ? (
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-pressed={isOrbiting}
            className="mt-2 inline-flex items-center gap-2 self-start rounded-full border border-ink/15 bg-vellum/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden>{isOrbiting ? '⏸' : '▶'}</span>
            {isOrbiting ? 'Pause rotation' : 'Resume rotation'}
          </button>
        ) : null}
      </div>

      <p className="text-base leading-relaxed text-ink-soft">{miracle.summary}</p>

      {miracle.artwork.length > 0 ? (
        <div className="atlas-scroll -mx-6 flex snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden px-6 sm:-mx-8 sm:px-8">
          {miracle.artwork.map((art) => (
            <figure
              key={art.id}
              className="relative aspect-[16/10] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-parchment"
            >
              <Image
                src={art.url}
                alt={art.alt}
                fill
                sizes="(min-width: 768px) 440px, 100vw"
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
// silently degrades to plain text. Mirrors manifesto-sequence.tsx's
// plain-extract pattern; intentionally drops headings, lists, and links for
// the v1 drawer. Switch to @payloadcms/richtext-lexical/react's <RichText/>
// when the editorial team needs richer formatting in narratives.
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
