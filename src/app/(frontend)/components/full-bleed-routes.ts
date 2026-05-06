// Routes that are full-bleed work surfaces — the global SiteHeader and
// SiteFooter chrome is hidden on these. Single source of truth for the
// hide decision; consumed by SiteChromeHide.
const FULL_BLEED_ROUTES = new Set(['/atlas', '/atlas/list'])

export function isFullBleedRoute(pathname: string): boolean {
  return FULL_BLEED_ROUTES.has(pathname)
}
