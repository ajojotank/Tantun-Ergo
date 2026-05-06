// Routes that are full-bleed work surfaces — the global SiteFooter chrome
// is hidden on these so the work area can fill exactly the remaining
// viewport (header + main = 100dvh on desktop). Single source of truth.
//
// Static matches: /atlas, /atlas/list (catalogue).
// Prefix match: /atlas/pilgrimages/{slug} — the walker is full-bleed too.
// The /atlas/pilgrimages gallery (no slug) is a normal card grid and keeps
// chrome — note the trailing slash in the prefix excludes it.
const FULL_BLEED_EXACT = new Set(['/atlas', '/atlas/list'])
const FULL_BLEED_PREFIX = '/atlas/pilgrimages/'

export function isFullBleedRoute(pathname: string): boolean {
  if (FULL_BLEED_EXACT.has(pathname)) return true
  if (pathname.startsWith(FULL_BLEED_PREFIX)) return true
  return false
}
