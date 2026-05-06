'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Returns null on full-bleed Atlas routes so the global SiteFooter (and any
 * other server-rendered chrome) disappears. Used because SiteFooter is async
 * and can't host its own usePathname check; this wrapper is the client
 * boundary. Server children render server-side and are passed in via the RSC
 * payload — no double-render or hydration mismatch.
 */
export function SiteChromeHide({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/atlas' || pathname === '/atlas/list') return null
  return <>{children}</>
}
