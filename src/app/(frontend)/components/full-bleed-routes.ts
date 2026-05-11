// Routes that are full-bleed work surfaces — the global SiteFooter chrome
// is hidden on these so the work area can fill exactly the remaining
// viewport (header + main = 100dvh on desktop). Single source of truth.
//
// Static matches: /atlas, /atlas/list (catalogue), /catechist (app shell).
// Prefix matches:
//   /atlas/pilgrimages/{slug} — the walker is full-bleed too.
//   /catechist/c/{id}, /catechist/sources(/...) — all Catechist surfaces are full-bleed.
// The /atlas/pilgrimages gallery (no slug) is a normal card grid and keeps
// chrome — note the trailing slash in the prefix excludes it.
const FULL_BLEED_EXACT = new Set(['/atlas', '/atlas/list', '/catechist'])
const FULL_BLEED_PREFIXES = ['/atlas/pilgrimages/', '/catechist/']

export function isFullBleedRoute(pathname: string): boolean {
  if (FULL_BLEED_EXACT.has(pathname)) return true
  return FULL_BLEED_PREFIXES.some((p) => pathname.startsWith(p))
}

// Routes that are a self-contained app surface — the global SiteHeader
// is hidden too so the app's own chrome (sidebar, drawer, top bar)
// doesn't compete. Catechist is the only app shell for v1.0.
const APP_SHELL_PREFIX = '/catechist'

export function hidesGlobalHeader(pathname: string): boolean {
  if (pathname === APP_SHELL_PREFIX) return true
  return pathname.startsWith(APP_SHELL_PREFIX + '/')
}
