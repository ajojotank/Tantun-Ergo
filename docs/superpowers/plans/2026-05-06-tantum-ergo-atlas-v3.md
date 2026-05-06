# Atlas v3 — Card-Replaces-List + Zillow Spatial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Atlas explore page UX so the map column is permanently visible (Zillow-style full-bleed), miracle detail REPLACES the list in the left column instead of overlaying as a drawer, and scroll mechanics stop rubber-banding.

**Architecture:** Three phases. Phase A is pure CSS / chrome / layout — fixes the user's worst pain points (rubber-band scroll, wasted screen real estate) without any architectural change, in ~3 commits. Phase B extracts the drawer's content into a new in-column `MiracleDetail` component. Phase C wires the view-swap into `AtlasShell`, deletes the drawer, and syncs the URL. Map cinematics (dusk preset, zoom 17 / pitch 60 / 3500ms flyTo, 60s orbit, hover↔pin sync, mobile collapsible map) are preserved end-to-end.

**Tech Stack:** Next.js 16 (App Router, Turbopack default), React 19, Tailwind CSS v4, Mapbox GL v3 via react-map-gl/mapbox v8, Framer Motion v12 (existing), Payload CMS v3 (data only — no studio changes), pnpm.

**Verification model:** This codebase has no unit-test framework. Per Plan 2 / Plan 2.5 convention, each task that touches code ends with `pnpm typecheck && pnpm lint && pnpm build` plus a visual smoke check in the running dev server. The TDD-style "write failing test first" pattern from generic plan templates does NOT apply here — substitute "write the change → verify the gate passes → commit".

---

## Phase A — Scroll & Spatial Quick Wins

The user's loudest complaint is "scrollbars rubber-band everywhere" and "doesn't use the screen". Phase A fixes both with three small CSS / layout changes — no component refactor, no behavior change. After Phase A, `/atlas` already feels like Zillow even though the drawer is still in place.

### Task 1: Site-wide + inner-column overscroll cleanup

The user said "scrollbars rubber-band on all of them" — plural. Two fixes are needed:

1. The OS-level body bounce (`html, body`) — disabled by adding `overscroll-behavior: none` to globals.css.
2. The inner left column on `/atlas`. It currently uses `overscroll-y-contain`, which blocks scroll-chain into the body but does NOT disable the bounce WITHIN that container — so when you wheel past the bottom of the list, the column itself still bounces. Change to `overscroll-y-none` to disable bounce inside the container too. (Note: `overscroll-behavior` does not inherit, so the site-wide rule from step 1 doesn't reach this container — it has to be set explicitly.)

**Files:**
- Modify: `src/app/(frontend)/globals.css:37-44`
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx:300` (left column className)

- [ ] **Step 1: Add `overscroll-behavior: none` to the existing `html, body` rule**

Open `src/app/(frontend)/globals.css` and find the existing block (around line 37):

```css
html,
body {
  position: relative; /* Framer's useScroll wants a non-static scroll container */
  font-feature-settings: 'ss01', 'ss02', 'cv11';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Replace it with:

```css
html,
body {
  position: relative; /* Framer's useScroll wants a non-static scroll container */
  font-feature-settings: 'ss01', 'ss02', 'cv11';
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* Disable macOS / iOS Safari elastic overscroll bounce site-wide. The Atlas
     page (and any other tightly-laid-out screen) felt "rubbery" because the OS
     was bouncing the body even when no inner scroll container had room to move.
     `none` (vs `contain`) fully suppresses bounce in addition to blocking
     scroll-chain. Safe site-wide because no page intentionally relies on the
     bounce gesture. */
  overscroll-behavior: none;
}
```

- [ ] **Step 2: Flip the left column from `overscroll-y-contain` to `overscroll-y-none`**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`. Find the desktop left column (around line 300):

```tsx
          <div className="atlas-scroll relative h-full overflow-y-auto overscroll-y-contain">
```

Change to:

```tsx
          <div className="atlas-scroll relative h-full overflow-y-auto overscroll-y-none">
```

(One token: `overscroll-y-contain` → `overscroll-y-none`. The container still scrolls; it just no longer bounces past its top/bottom limits.)

- [ ] **Step 3: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

Run:

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three pass. CSS-only + Tailwind class swap should be a no-op for typecheck and lint; build prints the static route table.

- [ ] **Step 4: Visual smoke**

Run `pnpm dev`. Open `/atlas` in a browser at desktop width. Scroll the left column to the bottom and continue dragging — neither the page NOR the column should bounce. Open `/` (home) — no bounce on overscroll. Open `/reading` and `/manifesto` — same.

If on macOS Chrome/Safari the bounce persists on `/`, double-check that the rule lives inside the existing `html, body { ... }` block (not a separate selector that gets overridden). On Linux/Windows the bounce wasn't visible in the first place — that's fine.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/globals.css src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "fix(atlas): disable overscroll bounce site-wide + inside left column (kills rubber-band)"
```

---

### Task 2: Hide global SiteHeader and SiteFooter on /atlas

The Zillow look needs the map column to feel locked to the viewport with NO chrome above or below. Currently `<SiteHeader />` and `<SiteFooter />` mount on every route from the root layout, so on `/atlas` (where `<main>` is `md:h-[100dvh] md:overflow-hidden`) the footer sits below the fold and the user can scroll past the locked work area to find it — that's the "weird scroll" they're describing in addition to the bounce.

The header is already a client component (uses `usePathname`); we add the pathname check inline. The footer is an async server component, so we wrap it with a tiny client component that returns `null` on `/atlas` paths.

**Files:**
- Modify: `src/app/(frontend)/components/site-header.tsx:17-19` (add early return)
- Create: `src/app/(frontend)/components/site-chrome-hide.tsx` (~15 lines)
- Modify: `src/app/(frontend)/layout.tsx:66-68` (wrap footer)

- [ ] **Step 1: Add early return to SiteHeader**

Open `src/app/(frontend)/components/site-header.tsx`. Find the function body opening (around line 17-21):

```tsx
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  // Only the home page renders a full-bleed dark hero; the header floats over
  // it. Every other page is on vellum, so the header sits in normal flow.
  const overDark = usePathname() === '/'
```

Change to:

```tsx
export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Atlas explore + list pages are full-bleed work surfaces (locked viewport,
  // no chrome). Hide the header entirely on those routes. Pilgrimage pages
  // keep chrome — they're long-scroll editorial.
  if (pathname === '/atlas' || pathname === '/atlas/list') return null
  // Only the home page renders a full-bleed dark hero; the header floats over
  // it. Every other page is on vellum, so the header sits in normal flow.
  const overDark = pathname === '/'
```

(The `usePathname` call moves to a local variable so we can use it twice without a second hook call.)

- [ ] **Step 2: Create the SiteChromeHide wrapper for the footer**

Create `src/app/(frontend)/components/site-chrome-hide.tsx`:

```tsx
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
```

- [ ] **Step 3: Wrap the footer in layout.tsx**

Open `src/app/(frontend)/layout.tsx`. Find the import block (around line 4-7) and the JSX (around line 66-68).

Add to imports:

```tsx
import { SiteChromeHide } from './components/site-chrome-hide'
```

Change the JSX:

```tsx
        <ScrollRubric />
        <SiteHeader />
        {children}
        <SiteFooter />
```

To:

```tsx
        <ScrollRubric />
        <SiteHeader />
        {children}
        <SiteChromeHide>
          <SiteFooter />
        </SiteChromeHide>
```

(`SiteHeader` self-hides via the change in Step 1; the footer needs the wrapper because it's async server.)

- [ ] **Step 4: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 5: Visual smoke**

`pnpm dev`. Open `/atlas` — header gone, footer gone, only the work area visible. Open `/` — header + footer still there. Open `/reading`, `/manifesto`, `/atlas/pilgrimages` — header + footer still there. Open `/atlas/list` — header + footer gone.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(frontend\)/components/site-header.tsx src/app/\(frontend\)/components/site-chrome-hide.tsx src/app/\(frontend\)/layout.tsx
git commit -m "feat(atlas): hide global header + footer on /atlas and /atlas/list (Zillow full-bleed)"
```

---

### Task 3: Full-bleed shell + Zillow column ratio

Today the desktop work area is `mx-auto max-w-[1600px]` with `border-y border-ink/10` and a `1fr | 55%` grid (list slightly wider than map). That centers the work area inside the viewport and frames it with hairlines. Zillow is full-bleed, no chrome, map dominates.

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx:298` (one wrapper className)

- [ ] **Step 1: Drop max-width, drop borders, flip column ratio**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`. Find the desktop grid wrapper (around line 298):

```tsx
        <div className="mx-auto grid h-full w-full max-w-[1600px] grid-cols-[minmax(0,1fr)_minmax(0,55%)] overflow-hidden border-y border-ink/10">
```

Change to:

```tsx
        <div className="grid h-full w-full grid-cols-[minmax(380px,42%)_minmax(0,1fr)] overflow-hidden">
```

What changed and why:
- `mx-auto max-w-[1600px]` removed → full viewport width, no side margins. On a 27" monitor this gives the map ~50% more pixels to breathe.
- `border-y border-ink/10` removed → no framing chrome above/below the work area, matches the chrome removal in Task 2.
- Grid template flipped from `1fr | 55%` to `minmax(380px, 42%) | 1fr`:
  - Left column (list/detail) takes 42% but never narrower than 380px so cards stay readable on a 13" laptop.
  - Right column (map) takes the rest — at 1440px viewport the map gets ~58%, at 2560px it gets ~63%. Map dominates as viewport grows. Matches Zillow's behavior.

- [ ] **Step 2: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 3: Visual smoke**

`pnpm dev`. Open `/atlas` at desktop width:

- Work area now spans the full viewport edge-to-edge.
- No hairline borders above/below.
- Map fills the right ~58–63% of the screen (more than the list).
- Resize the window from 1280px → 1920px. Map should grow with the viewport; left column should grow too but more slowly (42% of total, with 380px floor).
- Resize down to 768px (just above the md breakpoint). Left column should snap to 380px and map should fill the rest.

Mobile (`<768px`) is unchanged by this task — verify with the dev tools' device toolbar that mobile still shows the collapsible map → filters → list flow.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "feat(atlas): full-bleed shell + Zillow column ratio (drop max-w, flip 1fr|55% → 42%|1fr)"
```

---

## Phase B — Extract MiracleDetail component

Phase B introduces a new in-column detail view component but does NOT wire it in yet. After Phase B `/atlas` looks identical to the end of Phase A — the drawer is still mounted and used. Phase C does the swap. This split keeps each commit small and reviewable.

### Task 4: Create the MiracleDetail component

The new component is structurally `DrawerBody` from `miracle-drawer.tsx` (lines 121–248), restructured for in-column rendering: no `motion.aside`, no `position: fixed`, no body-scroll-lock. A sticky-top action bar replaces the corner ✕ — `← Back to list` on the left, the existing pause/play pill on the right.

**Files:**
- Create: `src/app/(frontend)/components/atlas/miracle-detail.tsx` (~180 lines)

- [ ] **Step 1: Write the new component**

Create `src/app/(frontend)/components/atlas/miracle-detail.tsx`:

```tsx
// src/app/(frontend)/components/atlas/miracle-detail.tsx
'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

/**
 * In-column miracle detail view. Replaces the list inside the left column
 * when a card is selected; the map column on the right stays untouched
 * (continues to fly + orbit).
 *
 * Replaces the old `<MiracleDrawer>` overlay pattern. No motion wrapper,
 * no position: fixed, no body scroll lock — this is a normal flex column
 * that lives inside `AtlasShell`'s single scroll container.
 */
export function MiracleDetail({
  miracle,
  isOrbiting = false,
  onTogglePlayPause,
  onBack,
}: {
  miracle: MiracleSummary
  /** True if the map is currently auto-rotating around the selected pin. */
  isOrbiting?: boolean
  /** Toggle handler — pauses if orbiting, resumes if paused. */
  onTogglePlayPause?: () => void
  /** Called when the user clicks "Back to list" or presses ESC. */
  onBack: () => void
}) {
  const backButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    // Focus the back button on mount so keyboard users can immediately
    // press Enter to return. Same pattern the old MiracleDrawer used —
    // setTimeout(0) defers focus to after the DOM commit.
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => {
      backButtonRef.current?.focus()
    }, 0)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [onBack])

  return (
    <div className="relative flex flex-col">
      {/* Sticky action bar: Back left, pause/play right. Pins to the top of
          the scroll container so the user can always escape regardless of
          how far they've scrolled into the narrative. */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ink/10 bg-vellum/95 px-6 py-3 backdrop-blur lg:px-10">
        <button
          ref={backButtonRef}
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span>
          Back to list
        </button>
        {onTogglePlayPause ? (
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-pressed={isOrbiting}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-vellum/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden>{isOrbiting ? '⏸' : '▶'}</span>
            {isOrbiting ? 'Pause rotation' : 'Resume rotation'}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 px-6 pt-6 pb-16 lg:px-10">
        {/* Eyebrow + title + meta */}
        <div className="space-y-2">
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
            id="miracle-detail-title"
            className="font-display text-3xl italic leading-tight tracking-tight text-ink md:text-4xl lg:text-5xl"
          >
            {miracle.title}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {miracle.locationName} · {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
            {miracle.isSample ? ' · [Sample]' : ''}
          </p>
        </div>

        <p className="text-base leading-relaxed text-ink-soft lg:text-lg">
          {miracle.summary}
        </p>

        {miracle.artwork.length > 0 ? (
          <div className="atlas-scroll -mx-6 flex snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden px-6 lg:-mx-10 lg:px-10">
            {miracle.artwork.map((art) => (
              <figure
                key={art.id}
                className="relative aspect-[16/10] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-parchment sm:w-[60%] lg:w-[55%]"
              >
                <Image
                  src={art.url}
                  alt={art.alt}
                  fill
                  sizes="(min-width: 1024px) 600px, (min-width: 640px) 60vw, 88vw"
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
    </div>
  )
}

// Permissive Lexical walker — paragraphs and inline text only. Lifted
// verbatim from miracle-drawer.tsx; same rationale (richer formatting can
// switch to @payloadcms/richtext-lexical/react's <RichText/> later).
function NarrativeBlock({ node }: { node: unknown }) {
  const root = (node as { root?: { children?: unknown[] } } | null)?.root
  const children = Array.isArray(root?.children) ? root!.children : []
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink lg:text-lg">
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
```

- [ ] **Step 2: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green. The component is unused so far, so no runtime path runs it yet — typecheck is the meaningful gate here. If lint complains about an unused export, ignore the warning (Task 5 will use it) — but it should not fail.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/miracle-detail.tsx
git commit -m "feat(atlas): add MiracleDetail component (in-column replacement for drawer body)"
```

---

## Phase C — Wire view-swap, delete drawer, sync URL

Phase C is the architectural switch. After this phase the drawer is gone and the left column swaps between list and detail.

### Task 5: Wire MiracleDetail into the desktop column

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx` (import + conditional render in left column)

- [ ] **Step 1: Import MiracleDetail**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`. Find the import block (around line 7-19). Add `MiracleDetail` next to the other atlas imports:

```tsx
import { MiracleDetail } from './miracle-detail'
```

Keep the existing `MiracleDrawer` import for now — Task 7 removes it.

- [ ] **Step 2: Conditionally render MiracleDetail in the desktop left column**

Find the desktop left column (around line 300):

```tsx
          {/* LEFT: single scroll container */}
          <div className="atlas-scroll relative h-full overflow-y-auto overscroll-y-contain">
            {/* Hero — scrolls with the column on first interaction. */}
            <header className="flex flex-col gap-4 px-6 py-10 lg:px-10 lg:py-14">
              {/* ... */}
            </header>

            {/* Sticky filter bar */}
            <div className="sticky top-0 z-10 ...">
              {searchInput}
              {filterChips}
              {timelineScrub}
            </div>

            <div className="flex flex-col gap-4 px-6 py-6 lg:px-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                {visibleMiracles.length} of {miracles.length} miracles
              </p>
              <MiracleList ... />
            </div>
          </div>
```

Restructure to swap based on `selected`:

```tsx
          {/* LEFT: single scroll container. Either list view (default) or
              MiracleDetail (when a card is selected). Map column on the
              right is never covered. */}
          <div className="atlas-scroll relative h-full overflow-y-auto overscroll-y-contain">
            {selected ? (
              <MiracleDetail
                key={selected.slug}
                miracle={selected}
                isOrbiting={isOrbiting}
                onTogglePlayPause={togglePlayPause}
                onBack={() => setSelectedSlug(null)}
              />
            ) : (
              <>
                {/* Hero — scrolls with the column on first interaction. */}
                <header className="flex flex-col gap-4 px-6 py-10 lg:px-10 lg:py-14">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
                      Plate I · Cartography
                    </p>
                    <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink lg:text-6xl xl:text-7xl">
                      The Miracle Atlas
                    </h1>
                    <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-ink-soft lg:text-lg">
                      A globe of approved miracles, anchored to coordinates and
                      centuries. Wander the whole record, or walk a curated
                      pilgrimage.
                    </p>
                  </div>
                  <ModeToggle />
                </header>

                {/* Sticky filter bar — pins to the top of the column so filters stay
                    reachable while the list scrolls. */}
                <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-ink/10 bg-vellum/95 px-6 py-4 backdrop-blur lg:px-10">
                  {searchInput}
                  {filterChips}
                  {timelineScrub}
                </div>

                <div className="flex flex-col gap-4 px-6 py-6 lg:px-10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {visibleMiracles.length} of {miracles.length} miracles
                  </p>
                  <MiracleList
                    miracles={visibleMiracles}
                    selectedSlug={selectedSlug}
                    hoveredSlug={hoveredSlug}
                    onSelect={handleSelect}
                    onHover={setHoveredSlug}
                  />
                </div>
              </>
            )}
          </div>
```

Notes:
- The `key={selected.slug}` on `MiracleDetail` ensures focus + scroll position reset cleanly when the user clicks a different card from the map (selecting a new miracle without going back to the list first).
- Keep the existing `<MiracleDrawer>` mount in place (lines ~356-361) — Task 7 deletes it. Both views render simultaneously for now (drawer over the swapped detail), which is visually weird but means each commit compiles + runs. Don't worry about this, Task 7 cleans it up imminently.

- [ ] **Step 3: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 4: Visual smoke**

`pnpm dev`. Open `/atlas` at desktop width. Click any card:

- Left column swaps to the new MiracleDetail (sticky `← Back` bar at top, full content below).
- The drawer ALSO appears on the right (this is expected — Task 7 removes it).
- Click the back button — left column swaps back to the list. Drawer also closes (its `onClose` is wired to the same `handleDeselect`).
- Press ESC — same as clicking back.

Mobile branch is unchanged in this task. Will be done in Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "feat(atlas): wire MiracleDetail into desktop left column (drawer still mounted)"
```

---

### Task 6: Wire MiracleDetail into the mobile flow

On mobile we keep the collapsible map at top but swap the filter+list section below it for the detail when something is selected. Same mental model as desktop.

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx` (mobile branch around line 261-291)

- [ ] **Step 1: Conditionally render MiracleDetail in the mobile branch**

Find the mobile branch (around line 261-291):

```tsx
      {/* Mobile: chips → collapsible map → timeline → cards. */}
      <div className="md:hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pt-2 pb-4 sm:px-8">
          {searchInput}
          {filterChips}
        </div>
        <CollapsibleMap onResize={() => mobileMapRef.current?.getMap().resize()}>
          <Globe ... />
        </CollapsibleMap>
        <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
          {timelineScrub}
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            {visibleMiracles.length} of {miracles.length} miracles
          </p>
          <MiracleList ... className="mt-3" />
        </div>
      </div>
```

Restructure so the filter bar (above map) and the timeline+list block (below map) are both replaced when `selected`:

```tsx
      {/* Mobile: chips → collapsible map → timeline → cards. When a card is
          selected, filter bar and list are replaced by the detail view. The
          collapsible map at top stays put — same mental model as desktop. */}
      <div className="md:hidden">
        {!selected ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pt-2 pb-4 sm:px-8">
            {searchInput}
            {filterChips}
          </div>
        ) : null}
        <CollapsibleMap onResize={() => mobileMapRef.current?.getMap().resize()}>
          <Globe
            miracles={visibleMiracles}
            styleUrl={styleUrl}
            hoveredSlug={hoveredSlug}
            onHover={setHoveredSlug}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            mapRef={mobileMapRef}
          />
        </CollapsibleMap>
        {selected ? (
          <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
            <MiracleDetail
              key={selected.slug}
              miracle={selected}
              isOrbiting={isOrbiting}
              onTogglePlayPause={togglePlayPause}
              onBack={() => setSelectedSlug(null)}
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
            {timelineScrub}
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              {visibleMiracles.length} of {miracles.length} miracles
            </p>
            <MiracleList
              miracles={visibleMiracles}
              selectedSlug={selectedSlug}
              hoveredSlug={hoveredSlug}
              onSelect={handleSelect}
              onHover={setHoveredSlug}
              className="mt-3"
            />
          </div>
        )}
      </div>
```

- [ ] **Step 2: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 3: Visual smoke (mobile viewport)**

`pnpm dev`. Open dev tools, switch to a mobile viewport (390×844 — iPhone 14). Open `/atlas`:

- Default: search + chips above, collapsible map (h-64) below, timeline + list below the map.
- Tap a card. Filter bar above the map disappears; list below the map is replaced by the detail (back button at top, content below). Collapsible map stays in place.
- Drawer ALSO appears as a bottom sheet (still expected until Task 7).
- Tap back. Filter bar + list reappear, detail disappears.

Verify desktop is still working as it was at the end of Task 5.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "feat(atlas): wire MiracleDetail into mobile flow (drawer still mounted)"
```

---

### Task 7: Delete the drawer, simplify flyTo padding, rename padding constants

Now that both desktop and mobile render `MiracleDetail` inline, the `MiracleDrawer` overlay is dead weight. Delete it. Also: the existing flyTo padding constants (`DRAWER_PADDING_DESKTOP`, `DRAWER_PADDING_MOBILE`) had `right: 440` and `bottom: 320` to keep the pin clear of the drawer. With no drawer covering the map, those offsets become wrong (they push the pin to the wrong side of the map column). Simplify to keep only the pitched-camera headroom (`top`).

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx` (remove import, remove mount, rename + simplify padding constants)
- Delete: `src/app/(frontend)/components/atlas/miracle-drawer.tsx`

- [ ] **Step 1: Verify nothing else imports MiracleDrawer**

```bash
grep -rn "MiracleDrawer\|miracle-drawer" src/
```

Expected: only `atlas-shell.tsx` (the import + the JSX mount we're about to remove). If any other file references it, stop and reconsider — that's a hidden coupling the handoff didn't anticipate.

- [ ] **Step 2: Remove the MiracleDrawer import and mount from atlas-shell.tsx**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`.

Remove the import line:

```tsx
import { MiracleDrawer } from './miracle-drawer'
```

Find the JSX mount (around line 356-361):

```tsx
      <MiracleDrawer
        miracle={selected}
        onClose={handleDeselect}
        isOrbiting={isOrbiting}
        onTogglePlayPause={togglePlayPause}
      />
```

Delete it entirely.

- [ ] **Step 3: Rename + simplify the flyTo padding constants**

Find the constants (around line 50-61):

```tsx
const DRAWER_PADDING_DESKTOP = {
  top: 120,
  bottom: 0,
  left: 0,
  right: 440,
} as const
const DRAWER_PADDING_MOBILE = {
  top: 60,
  bottom: 320,
  left: 0,
  right: 0,
} as const
```

Replace with:

```tsx
// Padding shifts the camera's centre INWARD from each edge. With v3's
// card-replaces-list architecture, the map column is never covered by an
// overlay — the only reason we still need padding is the pitched camera:
// at pitch 60 the 3D building extrudes UP from the pin's screen position,
// so without `top` padding the cathedral's top half clips off-screen.
// `top: 120` (desktop) / `60` (mobile) puts the pin lower on screen so the
// building has room to extend above it.
const MAP_PADDING_DESKTOP = {
  top: 120,
  bottom: 0,
  left: 0,
  right: 0,
} as const
const MAP_PADDING_MOBILE = {
  top: 60,
  bottom: 0,
  left: 0,
  right: 0,
} as const
```

Find the `handleSelect` reference to the old names (around line 178):

```tsx
      padding: desktop ? DRAWER_PADDING_DESKTOP : DRAWER_PADDING_MOBILE,
```

Change to:

```tsx
      padding: desktop ? MAP_PADDING_DESKTOP : MAP_PADDING_MOBILE,
```

- [ ] **Step 4: Delete the drawer file**

```bash
rm src/app/\(frontend\)/components/atlas/miracle-drawer.tsx
```

- [ ] **Step 5: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green. If typecheck flags an unused symbol, search for it — it should be the side-effects of the delete.

- [ ] **Step 6: Visual smoke**

`pnpm dev`. Open `/atlas` desktop:

- Click a card. Drawer is gone. Left column swaps to MiracleDetail. Map flies to the pin (now centered — no right-side offset since drawer is dead) and orbits.
- Click back. Detail swaps back to list. Map's last position holds.
- Click pin on the map (not a card). Same: flies + detail replaces list.
- Click empty map area while orbit is active — orbit stops, detail stays open. Click empty map again — detail closes (this is the existing two-stage `handleDeselect` logic; it's preserved).

Mobile (390×844):

- Click a card. Bottom-sheet drawer is gone. Below the collapsible map, the filter bar disappears and detail appears in its place.
- Back button works. ESC works (if the user has a keyboard).

- [ ] **Step 7: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git rm src/app/\(frontend\)/components/atlas/miracle-drawer.tsx
git commit -m "feat(atlas): delete MiracleDrawer; simplify flyTo padding (no overlay to dodge)"
```

---

### Task 8: URL sync for ?focus= deep linking

Today the page accepts `?focus={slug}` on initial load (`initialFocusSlug` prop) but does NOT update the URL when the user clicks a card. After this task: clicking a card updates the URL to `/atlas?focus={slug}`; clicking back clears it. A user who refreshes mid-detail sees the same miracle's detail. Links from `/atlas/list` deep-link cleanly into the detail view.

**Why `window.history.replaceState` and not `useRouter().replace`:** the App Router's `router.replace` re-runs the server component (`AtlasPage`) on every search-param change, which means re-fetching all miracles from Payload on every card click — wasteful and visually janky. `window.history.replaceState` mutates the URL in-place with no React re-render and no data refetch. Both approaches have the same "browser back" semantics here (replaceState replaces the current history entry just like `router.replace` does).

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx` (add URL-sync effect, no new imports)

- [ ] **Step 1: Add the URL-sync effect**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`. After the existing orbit `useEffect` (the one keyed on `[selectedSlug]`, around line 117-148), add a second effect:

```tsx
  // Keep the URL in sync with selection (cheap — no React re-render, no
  // data refetch). Survives refresh because the server already reads
  // `?focus=` and forwards it as `initialFocusSlug`. We use replaceState
  // (not pushState) so multiple selections don't pile up history entries.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = selectedSlug ? `/atlas?focus=${selectedSlug}` : '/atlas'
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url)
    }
  }, [selectedSlug])
```

The pathname+search comparison guard prevents a redundant `replaceState` call on initial mount (when `selectedSlug` is already in sync with the URL because of `initialFocusSlug`).

- [ ] **Step 2: Verify `pnpm typecheck && pnpm lint && pnpm build` is clean**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 3: Visual smoke**

`pnpm dev`. Open `/atlas`:

- Click a card. URL bar updates to `/atlas?focus=<slug>` without a page reload and without any visible flicker (no re-fetch).
- Refresh the page (F5). The same miracle's detail view loads (`initialFocusSlug` was already wired on the server).
- From `/atlas/list`, click any miracle's "View on map" link. Should land on `/atlas?focus=<slug>` with the detail open.
- Note on browser back: because we use `replaceState` (not `pushState`), pressing browser-back from `/atlas?focus=<slug>` will navigate to whatever route was BEFORE `/atlas`, NOT to `/atlas` (no-focus). That's the trade-off for avoiding the re-render. Users get a working in-app `← Back to list` button for that purpose. If true browser-back-within-atlas is needed later, swap to `pushState` + a `popstate` listener.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "feat(atlas): sync ?focus= URL with selection (browser back + deep links)"
```

---

### Task 9: Final verification + handoff

**Files:**
- None (verification only)

- [ ] **Step 1: Full gate run**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three pass cleanly.

- [ ] **Step 2: Route smoke (12 routes)**

```bash
pnpm dev
```

In a separate terminal:

```bash
for path in / /atlas /atlas/list /atlas/pilgrimages /reading /manifesto /credits /doctrine /catechist; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
  echo "$status $path"
done
```

Expected: every path returns `200`. (Pilgrimage detail pages need a slug — verify `/atlas/pilgrimages/eucharistic-italy` and `/atlas/pilgrimages/marian-witnesses` separately; they should also return 200.)

- [ ] **Step 3: End-to-end interaction smoke**

In the running dev server, exercise the full flow:

**Desktop (≥1280px):**
1. `/atlas` loads. Full-bleed shell, no header, no footer, no border chrome. Map fills ~58% of the screen.
2. Scroll the left column. No rubber-band at top or bottom. Pull the page itself — no body bounce either.
3. Click a card. Left column swaps to detail. Map flies to the pin (centered, no right-side offset). After ~3.7s, orbit begins. URL becomes `/atlas?focus=<slug>` (no flicker — replaceState is silent).
4. While orbiting, click pause/play in the detail's sticky bar. Orbit toggles.
5. Click another card. Detail swaps to the new miracle (key change unmounts/remounts cleanly — back button gets focus). Map re-flies + re-orbits.
6. Click ← Back. List returns. URL is `/atlas`. Scroll position in the list may reset — that's expected; restoring it is Phase D polish, not in scope.
7. Use the search input. Filter narrows. Click a result. Detail opens.
8. Open `/atlas/list` directly. Header + footer absent there too. Click any link to a miracle → lands on `/atlas?focus=<slug>` with the detail open.
9. Refresh while a detail is open (F5). Same detail reloads. Confirm the URL `?focus=<slug>` is preserved.

**Mobile (390×844):**
1. `/atlas` loads. Mobile hero at top (in-page, since chrome is hidden), search + chips, collapsible map (h-64), timeline + list below.
2. Tap a card. Filter bar disappears; list is replaced by detail. Collapsible map stays at h-64.
3. Tap back. Filter bar + list return.
4. Expand the collapsible map (tap its toggle). Map grows to h-[80dvh]. Tap a pin. Detail opens with map still expanded.

**Other pages still have chrome:**
- `/`, `/reading`, `/manifesto`, `/credits`, `/atlas/pilgrimages`, `/atlas/pilgrimages/<slug>` — header at top, footer at bottom, normal scroll. None of them should rubber-band.

- [ ] **Step 4: If any check fails, capture the failure and fix before the handoff commit. Otherwise:**

```bash
git log --oneline e2e49c8..HEAD
```

Confirm the commit history reads cleanly: 8 commits matching the 8 implementation tasks above (Task 9 has no commit).

- [ ] **Step 5: Handoff message to user**

Report final commit SHA + summary back to the user using this format:

> Atlas v3 done. Branch is at `<sha>`. The drawer is gone — clicking a card now swaps the left column to a detail view with a "← Back to list" button at the top. Map column stays full-bleed on the right (Zillow ratio, no chrome above or below). Overscroll bounce is killed site-wide AND inside the left column. URL syncs with selection (replaceState — no re-fetch on click; refresh + deep-links from /atlas/list both work). Mobile uses the same view-swap pattern below the collapsible map.
>
> Verified: `pnpm typecheck && pnpm lint && pnpm build` clean; 12/12 routes return 200; full desktop + mobile interaction loop tested.
>
> Plan 3 (Doctrine LMS) is next, but you trigger it.

---

## Files touched (full inventory)

```
src/app/(frontend)/globals.css                                MODIFY  Task 1
src/app/(frontend)/components/site-header.tsx                 MODIFY  Task 2
src/app/(frontend)/components/site-chrome-hide.tsx            CREATE  Task 2
src/app/(frontend)/layout.tsx                                 MODIFY  Task 2
src/app/(frontend)/components/atlas/atlas-shell.tsx           MODIFY  Tasks 3, 5, 6, 7, 8
src/app/(frontend)/components/atlas/miracle-detail.tsx        CREATE  Task 4
src/app/(frontend)/components/atlas/miracle-drawer.tsx        DELETE  Task 7
```

7 file ops across 8 implementation tasks (Task 9 is verification-only).

---

## Don't-break warnings (carry-over from handoff)

- **Plan 1 surfaces (`/`, `/reading`, `/manifesto`, `/credits`, studio chrome):** untouched. The chrome-hide check in Task 2 is scoped to `/atlas` and `/atlas/list` only — verify with the route smoke in Task 9.
- **Pilgrimage walker (`/atlas/pilgrimages/[slug]`):** uses the `<Pilgrimage>` component, independent of `<MiracleDrawer>`. Don't touch.
- **Pilgrimage gallery (`/atlas/pilgrimages`):** server-rendered, uses `<PilgrimagePlate>`. Untouched.
- **`/atlas/list` (keyboard catalogue):** chrome-hide also applies (matches `/atlas/list`). Its links into `/atlas?focus={slug}` work because of Task 8's URL sync.
- **Studio coordinate-picker:** different route group `(payload)`, untouched.
- **The seed scripts:** untouched.
- **Mapbox config** (`mapbox-style.ts`, `applyDuskPreset`, `resolveStyleUrl`): untouched. The cinematic settings (zoom 17, pitch 60, flyTo 3500ms, orbit 60s) stay.

### Don't introduce regressions on these features the user explicitly likes:

- 3D buildings + dusk lighting on flyTo arrivals
- Pause/play rotation toggle (now lives in MiracleDetail's sticky action bar, parallel to its old position in DrawerBody)
- Card hover ↔ pin highlight sync (works in list view)
- Pagination (8 per page, "Show more") in list view
- Search input filtering by title/location/summary in list view
- Sticky filter bar at the top of list view (preserved when `selected === null`)
- Themed `.atlas-scroll` styling on the single scroll container
- Mobile collapsible map (h-64 ↔ h-[80dvh])
