'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export interface SidebarConversation {
  id: string
  title: string
  updatedAt: string
}

interface Props {
  conversations: SidebarConversation[]
  member: { id: number; displayName: string }
}

function bucket(d: Date): 'Today' | 'This week' | 'Earlier' {
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 1) return 'Today'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

export function Sidebar({ conversations, member }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const grouped = useMemo(() => {
    const out: Record<'Today' | 'This week' | 'Earlier', SidebarConversation[]> = {
      Today: [], 'This week': [], Earlier: [],
    }
    for (const c of conversations) out[bucket(new Date(c.updatedAt))].push(c)
    return out
  }, [conversations])

  async function newInquiry() {
    const r = await fetch('/api/catechist/conversations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    if (r.ok) {
      const { id } = await r.json()
      router.push(`/catechist/c/${id}`)
    }
  }

  async function signOut() {
    await fetch('/api/members/logout', { method: 'POST', credentials: 'include' })
    router.push('/sign-in')
  }

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-72'} hidden md:flex flex-col border-r border-ink/10 bg-vellum-deep transition-[width] duration-200`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-ink/10">
        {!collapsed && <Link href="/catechist" className="font-display italic tracking-tight text-ink">Catechist</Link>}
        <button onClick={() => setCollapsed((v) => !v)} className="font-mono text-xs uppercase text-ink-soft px-2" aria-label="Toggle sidebar">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <>
          <button onClick={newInquiry} className="m-3 border border-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors">
            + New inquiry
          </button>

          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
            {(['Today', 'This week', 'Earlier'] as const).map((label) =>
              grouped[label].length > 0 ? (
                <section key={label}>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft px-1 mb-2">{label}</h3>
                  <ul className="space-y-1">
                    {grouped[label].map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/catechist/c/${c.id}`}
                          className="block px-2 py-1.5 text-sm font-display italic text-ink hover:bg-parchment/40 rounded truncate"
                        >
                          {c.title || 'Untitled'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </nav>

          <div className="border-t border-ink/10 px-3 py-3 space-y-2">
            <Link href="/catechist/sources" className="block font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">Sources</Link>
            <Link href="/catechist/account" className="block font-mono text-xs text-ink truncate">{member.displayName}</Link>
            <button onClick={signOut} className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">Sign out</button>
          </div>
        </>
      )}
    </aside>
  )
}
