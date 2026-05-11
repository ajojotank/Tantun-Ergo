'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export interface SidebarConversation {
  id: string
  title: string
  updatedAt: string
}

interface Props {
  conversations: SidebarConversation[]
  member: { id: number; displayName: string }
}

const PILLARS = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/doctrine', label: 'Doctrine' },
  { href: '/catechist', label: 'Catechist' },
  { href: '/reading', label: 'Reading' },
] as const

const ABOUT_LINKS = [
  { href: '/manifesto', label: 'Manifesto' },
  { href: '/credits', label: 'Credits' },
] as const

function bucket(d: Date): 'Today' | 'This week' | 'Earlier' {
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 1) return 'Today'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

export function Sidebar({ conversations, member }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Local optimistic copy of conversations. We mutate this immediately on
  // delete (so the row disappears instantly) and re-sync from the server
  // prop whenever it changes (router.refresh, navigation, etc.). Without
  // this, the user has to manually refresh because Next's Router Cache
  // doesn't reliably invalidate from a Route Handler's revalidatePath.
  const [localConversations, setLocalConversations] = useState(conversations)

  // Re-sync whenever the server prop changes (new inquiry created elsewhere,
  // AI-generated title arrived, navigation re-fetched the layout, etc.).
  useEffect(() => {
    setLocalConversations(conversations)
  }, [conversations])

  // Close the mobile drawer on route change so navigation feels clean.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const grouped = useMemo(() => {
    const out: Record<'Today' | 'This week' | 'Earlier', SidebarConversation[]> = {
      Today: [], 'This week': [], Earlier: [],
    }
    for (const c of localConversations) out[bucket(new Date(c.updatedAt))].push(c)
    return out
  }, [localConversations])

  async function newInquiry() {
    try {
      const r = await fetch('/api/catechist/conversations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: '{}',
      })
      if (r.ok) {
        const { id } = await r.json()
        router.push(`/catechist/c/${id}`)
      }
    } catch {
      /* surface via toast in v1.1 */
    }
  }

  async function deleteConversation(id: string, title: string) {
    if (!confirm(`Delete "${title || 'this inquiry'}"?`)) return

    // Optimistic: remove from the visible list immediately so the click
    // feels instant. We snapshot the previous state in case the delete
    // fails and we need to roll back.
    const previous = localConversations
    setLocalConversations((prev) => prev.filter((c) => c.id !== id))

    // If we deleted the conversation we're viewing, navigate away NOW so
    // the conversation page doesn't briefly try to re-render with no data.
    if (pathname === `/catechist/c/${id}`) {
      router.push('/catechist')
    }

    try {
      const r = await fetch(`/api/catechist/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!r.ok) {
        // Rollback on server failure.
        setLocalConversations(previous)
        return
      }
      // Eventual consistency — re-fetch the layout in case other clients
      // changed state. The optimistic update already updated the UI.
      router.refresh()
    } catch {
      setLocalConversations(previous)
    }
  }

  // Pillar switcher — always-on nav across the four pillars + About links,
  // so a user inside the Catechist can hop to Atlas/Doctrine/etc without
  // signing out or hunting for a back-link.
  const PillarNav = (
    <nav aria-label="Pillars" className="px-3 pt-3 pb-2">
      <ul className="space-y-px">
        {PILLARS.map((p) => {
          const active =
            p.href === '/catechist'
              ? pathname === '/catechist' || pathname.startsWith('/catechist/')
              : pathname === p.href || pathname.startsWith(p.href + '/')
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                className={`flex items-center gap-2 rounded px-2 py-1.5 font-display italic text-base transition-colors ${
                  active
                    ? 'bg-rubric/10 text-rubric'
                    : 'text-ink-soft hover:bg-parchment/40 hover:text-ink'
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-block h-1 w-1 rounded-full ${active ? 'bg-rubric' : 'bg-transparent'}`}
                />
                {p.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  // Catechist-specific content (conversations list, sources, profile, sign-out).
  const CatechistBody = (
    <>
      <div className="px-3 pt-2 pb-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft/80">
          Catechist
        </p>
      </div>
      <button
        onClick={newInquiry}
        className="mx-3 mb-3 rounded border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-ink hover:bg-ink hover:text-vellum transition-colors"
      >
        + New inquiry
      </button>

      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 min-h-0">
        {conversations.length === 0 ? (
          <p className="px-2 pt-2 font-display italic text-sm text-ink-soft/70 leading-relaxed">
            No inquiries yet.
          </p>
        ) : (
          (['Today', 'This week', 'Earlier'] as const).map((label) =>
            grouped[label].length > 0 ? (
              <section key={label}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft px-1 mb-2">
                  {label}
                </h3>
                <ul className="space-y-1">
                  {grouped[label].map((c) => {
                    const active = pathname === `/catechist/c/${c.id}`
                    return (
                      <li key={c.id} className="group relative">
                        <Link
                          href={`/catechist/c/${c.id}`}
                          className={`block pr-8 pl-2 py-1.5 text-sm font-display italic rounded truncate transition-colors ${
                            active
                              ? 'bg-parchment/60 text-ink'
                              : 'text-ink hover:bg-parchment/40'
                          }`}
                        >
                          {c.title || 'Untitled'}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            deleteConversation(c.id, c.title)
                          }}
                          aria-label={`Delete ${c.title || 'inquiry'}`}
                          title="Delete inquiry"
                          className="absolute right-1 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded text-ink-soft/40 hover:text-rubric hover:bg-rubric/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        >
                          <span aria-hidden className="text-xs">✕</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null,
          )
        )}
      </nav>

      <div className="border-t border-ink/10 px-3 py-3 space-y-2">
        <Link
          href="/catechist/sources"
          className="block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
        >
          Sources
        </Link>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {ABOUT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="pt-1 border-t border-ink/10 flex items-center justify-between gap-2">
          <Link
            href="/account"
            className="block font-display italic text-sm text-ink truncate hover:text-rubric"
            title={member.displayName}
          >
            {member.displayName}
          </Link>
          <form action="/account/sign-out" method="post">
            <button
              type="submit"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  )

  // The shared brand row at the very top — a link to home + collapse on desktop / close on mobile.
  function BrandRow({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex items-center justify-between px-3 py-3 border-b border-ink/10">
        <Link
          href="/"
          className="font-display italic tracking-tight text-ink text-base hover:text-rubric transition-colors"
        >
          Tantum Ergo
        </Link>
        {onClose ? (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded border border-ink/20 text-ink"
          >
            ✕
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="font-mono text-xs uppercase text-ink-soft px-2"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        )}
      </div>
    )
  }

  // When collapsed: only show pillar dots. Conversations + brand text disappear.
  const CollapsedRail = (
    <nav aria-label="Pillars" className="flex flex-col items-center gap-2 px-1 pt-3">
      {PILLARS.map((p) => {
        const active =
          p.href === '/catechist'
            ? pathname === '/catechist' || pathname.startsWith('/catechist/')
            : pathname === p.href || pathname.startsWith(p.href + '/')
        return (
          <Link
            key={p.href}
            href={p.href}
            title={p.label}
            className={`grid h-8 w-8 place-items-center rounded font-display italic text-xs ${
              active
                ? 'bg-rubric/10 text-rubric'
                : 'text-ink-soft hover:bg-parchment/40 hover:text-ink'
            }`}
          >
            {p.label[0]}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop: persistent left sidebar (md+). */}
      <aside
        className={`${collapsed ? 'w-14' : 'w-72'} hidden md:flex flex-col border-r border-ink/10 bg-vellum-deep transition-[width] duration-200 min-h-0`}
      >
        <BrandRow />
        {collapsed ? CollapsedRail : (
          <>
            {PillarNav}
            <div className="border-t border-ink/10" />
            {CatechistBody}
          </>
        )}
      </aside>

      {/* Mobile: top bar with hamburger + brand, drawer slides over. */}
      <div className="md:hidden flex items-center justify-between border-b border-ink/10 bg-vellum-deep px-3 py-2.5 sticky top-0 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded border border-ink/20 text-ink"
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="block">☰</span>
        </button>
        <Link href="/" className="font-display italic tracking-tight text-ink">
          Tantum Ergo
        </Link>
        <button
          onClick={newInquiry}
          aria-label="New inquiry"
          className="grid h-9 w-9 place-items-center rounded border border-ink text-ink hover:bg-ink hover:text-vellum transition-colors"
        >
          <span aria-hidden>＋</span>
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Catechist navigation"
        >
          <aside className="w-72 max-w-[85vw] flex flex-col bg-vellum-deep border-r border-ink/10 min-h-0">
            <BrandRow onClose={() => setMobileOpen(false)} />
            {PillarNav}
            <div className="border-t border-ink/10" />
            {CatechistBody}
          </aside>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex-1 bg-ink/30 backdrop-blur-[2px]"
          />
        </div>
      )}
    </>
  )
}
