'use client'

import Link from 'next/link'

export function HeaderAccountMenu({
  displayName,
  tone,
}: {
  displayName: string | null
  tone: 'light' | 'dark'
}) {
  const linkClass =
    tone === 'light'
      ? 'text-vellum/85 hover:text-gilt [text-shadow:0_1px_8px_rgba(12,10,8,0.7)]'
      : 'text-ink-soft hover:text-ink'
  const panelClass =
    tone === 'light'
      ? 'border-vellum/10 bg-ink/85 backdrop-blur'
      : 'border-ink/10 bg-vellum'
  const itemClass =
    tone === 'light'
      ? 'text-vellum hover:bg-vellum/10'
      : 'text-ink hover:bg-vellum-deep'

  if (!displayName) {
    return (
      <Link
        href="/account/signin"
        className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${linkClass}`}
      >
        Sign in
      </Link>
    )
  }

  return (
    <details className="relative">
      <summary
        className={`cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${linkClass}`}
      >
        {displayName} ⌄
      </summary>
      <div className={`absolute right-0 mt-3 w-56 rounded-xl border p-2 shadow-altar ${panelClass}`}>
        <Link href="/doctrine" className={`block rounded-md px-3 py-2 text-sm ${itemClass}`}>
          My doctrine
        </Link>
        <form action="/account/sign-out" method="post" className="block">
          <button
            type="submit"
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${itemClass}`}
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
