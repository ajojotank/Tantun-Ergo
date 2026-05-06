'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { isFullBleedRoute } from './full-bleed-routes'

/**
 * Returns null on full-bleed Atlas routes so global chrome (SiteHeader,
 * SiteFooter) disappears. Used as a wrapper at the layout level — server
 * children render server-side and travel through the RSC payload, only the
 * visibility decision is client. No double-render or hydration mismatch.
 */
export function SiteChromeHide({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isFullBleedRoute(pathname)) return null
  return <>{children}</>
}
