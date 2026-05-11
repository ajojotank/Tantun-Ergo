'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { hidesGlobalHeader, isFullBleedRoute } from './full-bleed-routes'

/**
 * Returns null on full-bleed Atlas routes so global SiteFooter chrome
 * disappears. Used as a wrapper at the layout level — server children
 * render server-side and travel through the RSC payload, only the
 * visibility decision is client. No double-render or hydration mismatch.
 */
export function SiteChromeHide({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isFullBleedRoute(pathname)) return null
  return <>{children}</>
}

/**
 * Returns null on app-shell routes (Catechist) so the global SiteHeader
 * disappears. Catechist provides its own brand chrome via the sidebar +
 * mobile top bar; stacking the marketing header on top creates double-
 * chrome and steals vertical space from the app surface.
 */
export function SiteHeaderHide({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (hidesGlobalHeader(pathname)) return null
  return <>{children}</>
}
