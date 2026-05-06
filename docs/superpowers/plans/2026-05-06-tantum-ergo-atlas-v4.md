# Atlas v4 — Header Restore + Hover Rotate + Pilgrimage Rewrite + Studio Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the global SiteHeader back across the Atlas without making the page scrollable; add hover-to-rotate-globe behavior in the list; make the mobile filters collapsible and reposition them below the map; fix the mode toggle to a proper 50/50 split; rewrite the pilgrimage walker to match the explore page layout (single shared map + paged-chapter "book" reader on both desktop and mobile); add a videos field to the Miracles collection and render it in detail views; verify studio authoring works end-to-end.

**Architecture:** Three phases. Phase A is small surface polish on the explore page (4 commits). Phase B is the meaningful rewrite — the pilgrimage walker becomes a paged-chapter reader inside an explore-style shell with a single shared globe, replacing the current scroll-tell with N inline maps (3 commits). Phase C adds video support to the Miracles schema and renders embeds in MiracleDetail + the new pilgrimage chapter pane, then runs a studio QA pass (4 commits). Final all-up verification at the end.

**Tech Stack:** Next.js 16 (App Router, Turbopack default), React 19, Tailwind CSS v4, Mapbox GL v3 via react-map-gl/mapbox v8, Framer Motion v12, Payload CMS v3, pnpm.

**Verification model:** No unit-test framework — gate is `pnpm typecheck && pnpm lint && pnpm build` after each task. ONE commit per task unless a task explicitly says otherwise.

---

## File map

```
NEW FILES
  src/app/(frontend)/components/atlas/mobile-filter-panel.tsx   # collapsible filters wrapper (Phase A)
  src/app/(frontend)/components/atlas/pilgrimage-book.tsx       # paged-chapter reader (Phase B)
  src/app/(frontend)/components/atlas/pilgrimage-shell.tsx      # full pilgrimage walker shell (Phase B)
  src/app/(frontend)/components/atlas/video-embed.tsx           # YouTube/Vimeo/MP4 embed (Phase C)

MODIFIED FILES
  src/app/(frontend)/components/full-bleed-routes.ts            # Phase A: add /atlas/pilgrimages/* routes
  src/app/(frontend)/layout.tsx                                 # Phase A: body becomes flex-col, header un-wrapped
  src/app/(frontend)/atlas/page.tsx                             # Phase A: main becomes flex-1 min-h-0
  src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx          # Phase B: main becomes flex-1 min-h-0; uses new shell
  src/app/(frontend)/components/atlas/atlas-shell.tsx           # Phase A: hover-rotate effect; mobile filter reorder
  src/app/(frontend)/components/atlas/mode-toggle.tsx           # Phase A: 50/50 layout
  src/collections/Miracles.ts                                   # Phase C: videos field
  src/app/(frontend)/components/atlas/types.ts                  # Phase C: MiracleVideo type
  src/app/(frontend)/components/atlas/serialise.ts              # Phase C: videos mapper
  src/app/(frontend)/components/atlas/miracle-detail.tsx        # Phase C: render videos
  src/scripts/seed-atlas.ts                                     # Phase C: sample video on one miracle

DELETED FILES
  src/app/(frontend)/components/atlas/pilgrimage.tsx            # Phase B: replaced by pilgrimage-book + pilgrimage-shell
```

---

## Phase A — Atlas Explore polish

### Task A1: Restore SiteHeader on /atlas + /atlas/list + /atlas/pilgrimages/[slug]; keep SiteFooter hidden on full-bleed routes

**Why:** users currently can't navigate away from `/atlas` because the SiteHeader was hidden. The fix: make the header render on every route (the feature the v3 hide was intended to address — full-bleed feel — is preserved by hiding the SiteFooter only and by making `<main>` consume exactly the remaining viewport height, no more, no less). The body becomes a flex column so `<main>` can `flex-1 min-h-0` itself into the remaining space.

**Files:**
- Modify: `src/app/(frontend)/components/full-bleed-routes.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/app/(frontend)/atlas/page.tsx`

**Step 1: Update the route predicate to cover pilgrimage walker pages**

`src/app/(frontend)/components/full-bleed-routes.ts` currently reads:

```ts
const FULL_BLEED_ROUTES = new Set(['/atlas', '/atlas/list'])

export function isFullBleedRoute(pathname: string): boolean {
  return FULL_BLEED_ROUTES.has(pathname)
}
```

Replace with:

```ts
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
```

**Step 2: Body becomes flex-col; remove SiteChromeHide wrapper around SiteHeader; keep it around SiteFooter**

Open `src/app/(frontend)/layout.tsx`. Find the `<body>` element (around line 61-69):

```tsx
      <body
        className="min-h-[100dvh] bg-vellum text-ink selection:bg-rubric/20 selection:text-rubric"
        style={{ position: 'relative' }}
      >
        <ScrollRubric />
        <SiteChromeHide>
          <SiteHeader />
        </SiteChromeHide>
        {children}
        <SiteChromeHide>
          <SiteFooter />
        </SiteChromeHide>
      </body>
```

Replace with:

```tsx
      <body
        className="flex min-h-[100dvh] flex-col bg-vellum text-ink selection:bg-rubric/20 selection:text-rubric"
        style={{ position: 'relative' }}
      >
        <ScrollRubric />
        {/* Header is shown on every route — users need it for nav. The
            full-bleed feel of /atlas is preserved by hiding the FOOTER (via
            SiteChromeHide below) and by sizing <main> to fill exactly the
            remaining viewport (`flex-1 min-h-0` on /atlas + walker mains). */}
        <SiteHeader />
        {children}
        <SiteChromeHide>
          <SiteFooter />
        </SiteChromeHide>
      </body>
```

Two changes: body gets `flex flex-col`, the `<SiteChromeHide>` wrapping `<SiteHeader />` is removed (header always renders).

**Step 3: /atlas main becomes flex-1 min-h-0 (consumes remaining viewport, doesn't add to it)**

Open `src/app/(frontend)/atlas/page.tsx`. Find the `<main>` element (around line 57):

```tsx
    <main className="min-h-[80dvh] pb-24 md:flex md:h-[100dvh] md:flex-col md:overflow-hidden md:pb-0">
```

Replace with:

```tsx
    <main className="min-h-[80dvh] pb-24 md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden md:pb-0">
```

Two tokens swapped: `md:h-[100dvh]` → `md:flex-1 md:min-h-0`. The `flex-1` makes main fill the remaining body height after the header; `min-h-0` is required because flex-1 alone doesn't override the implicit `min-h: auto` that would push main back to its content height. Mobile branch (no `md:`) is unchanged — that's a normal scrollable layout.

**Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 5: Visual smoke (mental check)**

After this commit:
- `/atlas` desktop: header at top, work area below filling exactly `100dvh − headerHeight`, no scroll, no footer below.
- `/atlas` mobile: header at top, scrollable mobile flow below (collapsible map → filters → list).
- `/atlas/list`: header at top, normal scrollable catalogue, no footer.
- `/atlas/pilgrimages` (gallery): header at top, normal page flow with footer at bottom (NOT full-bleed).
- `/atlas/pilgrimages/{slug}`: header at top, footer hidden — but the walker layout is still the v2 scroll-tell at this point (will be rebuilt in Phase B).
- `/`, `/reading`, `/manifesto`, `/credits`, `/doctrine`, `/catechist`: header + main + footer, normal scroll.

**Step 6: Commit**

```bash
git add 'src/app/(frontend)/components/full-bleed-routes.ts' 'src/app/(frontend)/layout.tsx' 'src/app/(frontend)/atlas/page.tsx'
git commit -m "feat(atlas): restore SiteHeader on full-bleed routes; keep footer hidden, fit main with flex-1 min-h-0"
```

---

### Task A2: Hover-to-rotate-globe in the list

**Why:** the user wants the globe to rotate (pan to coordinate, no zoom change) when they hover a card in the list. Selection still does the dramatic flyTo zoom 17 / pitch 60 / orbit. Hover should be subtle — `easeTo({ center, duration: 800 })` keeping the current zoom and pitch. Yields to selection (when something is selected and orbiting, hovering other cards does nothing). Debounced 250ms so rapidly tabbing through cards doesn't thrash the camera.

**Files:**
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx`

**Step 1: Add a hover-rotate effect inside AtlasShell**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`. Find the second `useEffect` (the URL-sync one with deps `[selectedSlug]`, around lines 151-157). Immediately AFTER its closing `}, [selectedSlug])`, add a third effect:

```tsx
  // Hover-to-rotate: pan the globe to the hovered card's coordinates without
  // changing zoom or pitch. Subtle — gives the user a sense of where each
  // miracle sits while they browse, without committing to the dramatic
  // selection flyTo. Yields to selection: if anything is currently selected
  // (and therefore the orbit is or will be running), hover is ignored.
  // Debounced 250ms so rapidly tabbing/mousing through cards doesn't thrash
  // the camera; only the last hover within the window actually fires.
  useEffect(() => {
    if (selectedSlug) return
    if (!hoveredSlug) return
    const m = miracles.find((x) => x.slug === hoveredSlug)
    if (!m) return
    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return

    const timer = window.setTimeout(() => {
      target.easeTo({
        center: m.coordinates,
        duration: 800,
        essential: true,
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [hoveredSlug, selectedSlug, miracles])
```

Note: `MiracleList` already calls `onHover(slug)` on `onMouseEnter` AND `onFocus`, and `onHover(null)` on `onMouseLeave`/`onBlur`, so this effect responds to both pointer and keyboard navigation.

**Step 2: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 3: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/atlas-shell.tsx'
git commit -m "feat(atlas): hover-to-rotate globe on list-card hover (debounced 250ms, yields to selection)"
```

---

### Task A3: Mobile collapsible filter panel, repositioned below the map

**Why:** mobile currently shows search + chips ABOVE the collapsible map and the timeline scrub BELOW it (between map and list). The user wants all filters (search + chips + timeline) consolidated into a single collapsible panel positioned BETWEEN the map and the list. Reduces scroll-distance to the list and gets filter UI out of the way until needed.

**Files:**
- Create: `src/app/(frontend)/components/atlas/mobile-filter-panel.tsx`
- Modify: `src/app/(frontend)/components/atlas/atlas-shell.tsx` (mobile branch reorder)

**Step 1: Create the MobileFilterPanel component**

Create `src/app/(frontend)/components/atlas/mobile-filter-panel.tsx`:

```tsx
// src/app/(frontend)/components/atlas/mobile-filter-panel.tsx
'use client'

import { type ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/cn'

/**
 * Mobile-only collapsible wrapper for the search + filter chips + timeline
 * scrub. Renders a sticky-style toggle button with a count of active
 * filters; when expanded, the children render below in a panel that
 * animates open. Designed to live BETWEEN the collapsible map (above) and
 * the miracle list (below) in the mobile branch of AtlasShell.
 *
 * `activeCount` is supplied by the caller — AtlasShell already tracks the
 * filter state and can sum the active chips, the search query, and the
 * timeline scrub's "is restricted" flag into a single number.
 */
export function MobileFilterPanel({
  activeCount,
  children,
  className,
}: {
  activeCount: number
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn('border-b border-ink/10 bg-vellum/95 backdrop-blur', className)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-left sm:px-8"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
        </span>
        <span aria-hidden className="text-base leading-none text-ink-soft">
          {open ? '−' : '+'}
        </span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.6 }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 px-5 pb-4 sm:px-8">{children}</div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Compute activeCount + reorder mobile branch in AtlasShell**

Open `src/app/(frontend)/components/atlas/atlas-shell.tsx`.

Add to the imports near the other atlas-component imports:

```tsx
import { MobileFilterPanel } from './mobile-filter-panel'
```

Add a `MIN_YEAR` reference compute for `activeCount` near the existing `visibleMiracles` useMemo (around line 92). Right after the `visibleMiracles` useMemo, add:

```tsx
  // Count of "active" filter dimensions for the mobile collapsed-panel
  // header label. A non-empty search, any selected chips, or a year scrub
  // pulled back from MAX_YEAR each count as one active filter.
  const activeFilterCount =
    (query.trim().length > 0 ? 1 : 0) +
    selectedTypes.size +
    selectedStatuses.size +
    (yearMax < MAX_YEAR ? 1 : 0)
```

Now find the mobile branch (around lines 261-291). It currently reads (after Phase A1's flex-1 change):

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
          <Globe ... />
        </CollapsibleMap>
        {selected ? (
          <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
            <MiracleDetail ... />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
            {timelineScrub}
            <p className="mt-6 ...">{visibleMiracles.length} of {miracles.length} miracles</p>
            <MiracleList ... className="mt-3" />
          </div>
        )}
      </div>
```

Replace the entire mobile branch with:

```tsx
      {/* Mobile: collapsible map at top → collapsible Filters panel → list
          (or detail when a card is selected). Filters consolidate search +
          chips + timeline scrub behind a single toggle so the list is closer
          to the map by default. */}
      <div className="md:hidden">
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

        {!selected ? (
          <MobileFilterPanel activeCount={activeFilterCount}>
            {searchInput}
            {filterChips}
            {timelineScrub}
          </MobileFilterPanel>
        ) : null}

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
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
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

Key changes:
- The mobile hero block (lines ~244-258, `<header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-12 sm:px-8 md:hidden">` — Plate I · Cartography + title + paragraph + ModeToggle) STAYS untouched. Don't delete it. The page title and ModeToggle still belong there.
- `<CollapsibleMap>` is now the FIRST child of the mobile work area (the `md:hidden` div), positioned above where the filters used to be (was: filter chips above map; now: map first).
- `<MobileFilterPanel>` replaces the old above-map filter `<div>` and absorbs the timeline that used to sit below the map.
- Count + list block no longer contains the timeline (it's in the filter panel now).

**Step 3: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 4: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/mobile-filter-panel.tsx' 'src/app/(frontend)/components/atlas/atlas-shell.tsx'
git commit -m "feat(atlas): collapsible mobile filter panel between map and list; drop redundant mobile hero"
```

---

### Task A4: Mode toggle 50/50 layout

**Why:** the ModeToggle currently uses `inline-flex` with each tab sized to its text — "Explore" (7 chars) is narrower than "Pilgrimages" (11 chars), so the split is asymmetric whenever the parent forces the toggle to full width. Switching to `flex` + `flex-1` per tab makes the split exactly 50/50 regardless of label length. Parent containers control the toggle's outer width.

**Files:**
- Modify: `src/app/(frontend)/components/atlas/mode-toggle.tsx`

**Step 1: Change container to flex and tabs to flex-1 text-center**

Open `src/app/(frontend)/components/atlas/mode-toggle.tsx`. Find the `<nav>` (around line 24):

```tsx
    <nav
      aria-label="Atlas mode"
      className={cn(
        'inline-flex items-center gap-px rounded-full border border-ink/10 bg-vellum/85 p-0.5 backdrop-blur',
        className,
      )}
    >
```

Replace with:

```tsx
    <nav
      aria-label="Atlas mode"
      className={cn(
        'flex items-center gap-px rounded-full border border-ink/10 bg-vellum/85 p-0.5 backdrop-blur',
        className,
      )}
    >
```

(One token: `inline-flex` → `flex`. The container is now block-level and fills its parent's available width.)

Find the `<Link>` className (around line 38):

```tsx
            className={cn(
              'rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              active
                ? 'bg-ink text-vellum'
                : 'text-ink-soft hover:text-ink',
            )}
```

Replace with:

```tsx
            className={cn(
              'flex-1 rounded-full px-4 py-1.5 text-center font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              active
                ? 'bg-ink text-vellum'
                : 'text-ink-soft hover:text-ink',
            )}
```

(Two tokens added: `flex-1 text-center`. Each tab now fills exactly half the container regardless of label length, with text centered.)

**Step 2: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 3: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/mode-toggle.tsx'
git commit -m "feat(atlas): mode toggle is now exact 50/50 split (flex + flex-1 text-center per tab)"
```

---

## Phase B — Pilgrimage rewrite

### Task B1: New PilgrimageBook component (paged-chapter reader, no map yet)

**Why:** the user wants pilgrimage chapters to read like a book — one chapter at a time, advance with prev/next, full-screen takeover, no vertical scroll-tell. Build the chapter UI first (Prev/Next + keyboard ←/→ + swipe gesture + Framer slide animation + chapter dots). The shell that wires it to a map comes in Task B2.

**Files:**
- Create: `src/app/(frontend)/components/atlas/pilgrimage-book.tsx` (~220 lines)

**Step 1: Create PilgrimageBook**

Create `src/app/(frontend)/components/atlas/pilgrimage-book.tsx`:

```tsx
// src/app/(frontend)/components/atlas/pilgrimage-book.tsx
'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'
import {
  type PilgrimageRouteStop,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
  romanize,
} from './types'

const SWIPE_THRESHOLD_PX = 60

/**
 * Paged-chapter reader for a pilgrimage. One chapter visible at a time;
 * advance via Prev/Next buttons, keyboard ←/→, or horizontal swipe on
 * touch. Pure UI — accepts `activeIdx` and change handlers from the
 * parent (PilgrimageShell), which also drives the shared map.
 */
export function PilgrimageBook({
  stops,
  activeIdx,
  onPrev,
  onNext,
  onJump,
  className,
}: {
  stops: PilgrimageRouteStop[]
  activeIdx: number
  onPrev: () => void
  onNext: () => void
  onJump: (idx: number) => void
  className?: string
}) {
  const onPrevRef = useRef(onPrev)
  const onNextRef = useRef(onNext)
  useEffect(() => {
    onPrevRef.current = onPrev
    onNextRef.current = onNext
  }, [onPrev, onNext])

  // Keyboard nav. Listener installed once; reads handlers from refs so the
  // parent can pass inline arrows without re-installing the listener.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't hijack typing in inputs (none expected in this view, but be safe).
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrevRef.current()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNextRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD_PX) onPrev()
      else if (info.offset.x < -SWIPE_THRESHOLD_PX) onNext()
    },
    [onPrev, onNext],
  )

  if (stops.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-6 py-24 text-center',
          className,
        )}
      >
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  const stop = stops[activeIdx]
  const total = stops.length
  const isFirst = activeIdx === 0
  const isLast = activeIdx === total - 1

  return (
    <section
      aria-label="Pilgrimage chapters"
      className={cn('relative flex h-full flex-col', className)}
    >
      {/* Chapter pane — Framer animates between activeIdx values. Drag-x lets
          touch users swipe through. */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={activeIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 220, damping: 30, mass: 0.7 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 flex flex-col gap-6 overflow-y-auto px-6 pb-24 pt-6 lg:px-10"
          >
            <Chapter stop={stop} index={activeIdx} total={total} />
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Sticky bottom bar: Prev / "Chapter X of Y" / Next + dot indicators. */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-ink/10 bg-vellum/95 px-6 py-3 backdrop-blur lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={isFirst}
            aria-label="Previous chapter"
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              isFirst ? 'text-ink-soft/30' : 'text-ink-soft hover:text-ink',
            )}
          >
            <span aria-hidden>←</span>
            Prev
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Chapter {romanize(activeIdx + 1)} of {romanize(total)}
          </p>
          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            aria-label="Next chapter"
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              isLast ? 'text-ink-soft/30' : 'text-ink-soft hover:text-ink',
            )}
          >
            Next
            <span aria-hidden>→</span>
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Jump to chapter"
          className="flex items-center justify-center gap-1.5"
        >
          {stops.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Chapter ${i + 1}`}
              onClick={() => onJump(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeIdx ? 'w-6 bg-ink' : 'w-1.5 bg-ink/25 hover:bg-ink/40',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Chapter({
  stop,
  index,
  total,
}: {
  stop: PilgrimageRouteStop
  index: number
  total: number
}) {
  const { miracle, chapterNote } = stop
  const body = chapterNote && chapterNote.trim() ? chapterNote : miracle.summary

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Chapter {romanize(index + 1)} of {romanize(total)}
      </p>
      <h2 className="font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
        {miracle.title}
      </h2>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-full"
          style={{ backgroundColor: PIN_HEX[miracle.type] }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]} ·{' '}
          {miracle.locationName} ·{' '}
          {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
        </span>
      </div>
      <p className="text-base leading-relaxed text-ink-soft lg:text-lg">{body}</p>

      {miracle.sources.length > 0 ? (
        <ul className="mt-2 space-y-1 border-l-2 border-rubric/40 pl-4 font-mono text-[11px] text-ink-soft">
          {miracle.sources.slice(0, 3).map((s, i) => (
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
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

**Step 2: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. The component is unused so far (no runtime path renders it yet) — typecheck is the meaningful gate.

**Step 3: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/pilgrimage-book.tsx'
git commit -m "feat(atlas): add PilgrimageBook (paged chapter reader with kbd + swipe + slide animation)"
```

---

### Task B2: New PilgrimageShell component (full layout with shared map)

**Why:** mirror the AtlasShell layout so the pilgrimage walker feels like the explore page — desktop split (left: book, right: sticky map), mobile collapsible map at top with book below. Single shared Mapbox instance per branch (desktop + mobile), driven by `activeIdx` from the book.

**Files:**
- Create: `src/app/(frontend)/components/atlas/pilgrimage-shell.tsx` (~250 lines)

**Step 1: Create PilgrimageShell**

Create `src/app/(frontend)/components/atlas/pilgrimage-shell.tsx`:

```tsx
// src/app/(frontend)/components/atlas/pilgrimage-shell.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  AttributionControl,
  Marker,
  type MapRef,
} from 'react-map-gl/mapbox'

import { cn } from '@/lib/cn'
import { CollapsibleMap } from './collapsible-map'
import { applyDuskPreset, resolveStyleUrl } from './mapbox-style'
import { PilgrimageBook } from './pilgrimage-book'
import { type PilgrimageSummary, PIN_HEX } from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

// Cinematic flyTo per chapter — same as the v3 walker so visual continuity
// holds: zoom 15 brings 3D buildings + landmarks into view, pitch 55 gives
// the dramatic-approach angle, alternating bearing prevents the camera from
// feeling locked in one orientation across chapters.
const CHAPTER_FLY_OPTS = {
  zoom: 15,
  pitch: 55,
  duration: 2200,
  essential: true,
} as const

/**
 * Full pilgrimage walker shell. Mirrors AtlasShell's layout so users get
 * the same mental model when switching modes:
 *
 * Desktop: 42% book | 1fr map (sticky)
 * Mobile:  collapsible map at top, book below
 *
 * Single shared map per branch — flyTo on activeIdx change. Markers render
 * for every stop, with the active one highlighted. Map is non-interactive
 * (interactive=false) so users navigate via the book, not by panning.
 */
export function PilgrimageShell({
  pilgrimage,
  styleUrl,
}: {
  pilgrimage: PilgrimageSummary
  styleUrl?: string
}) {
  const stops = pilgrimage.route
  const [activeIdx, setActiveIdx] = useState(0)
  const desktopMapRef = useRef<MapRef | null>(null)
  const mobileMapRef = useRef<MapRef | null>(null)

  const handlePrev = useCallback(() => {
    setActiveIdx((i) => Math.max(0, i - 1))
  }, [])
  const handleNext = useCallback(() => {
    setActiveIdx((i) => Math.min(stops.length - 1, i + 1))
  }, [stops.length])
  const handleJump = useCallback((i: number) => {
    setActiveIdx(i)
  }, [])

  // flyTo on chapter change. Picks whichever branch is currently visible
  // (desktop or mobile), same approach AtlasShell uses for selection flyTo.
  useEffect(() => {
    const stop = stops[activeIdx]
    if (!stop) return
    const desktopVisible =
      desktopMapRef.current && isMapVisible(desktopMapRef.current)
    const target = desktopVisible
      ? desktopMapRef.current
      : mobileMapRef.current
    if (!target) return
    target.flyTo({
      center: stop.miracle.coordinates,
      bearing: (activeIdx % 2 === 0 ? -20 : 20),
      ...CHAPTER_FLY_OPTS,
    })
  }, [activeIdx, stops])

  // Initial map view: centered on first stop, zoomed out enough to feel
  // like "the journey ahead". flyTo will commit the camera to chapter 1 on
  // mount via the effect above.
  const initialView = useMemo(() => {
    const first = stops[0]?.miracle.coordinates ?? [12.4534, 41.9029] // fallback: Vatican
    return {
      longitude: first[0],
      latitude: first[1],
      zoom: 3.4,
      pitch: 0,
    }
  }, [stops])

  if (stops.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  return (
    <div className="relative md:flex md:h-full md:flex-col">
      {/* Mobile: collapsible map → paged book. */}
      <div className="md:hidden">
        <CollapsibleMap onResize={() => mobileMapRef.current?.getMap().resize()}>
          {TOKEN ? (
            <Map
              ref={mobileMapRef}
              mapboxAccessToken={TOKEN}
              initialViewState={initialView}
              mapStyle={resolveStyleUrl(styleUrl)}
              projection={{ name: 'globe' }}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              interactive={false}
              onLoad={() => applyDuskPreset(mobileMapRef.current)}
            >
              <AttributionControl compact position="bottom-left" />
              {stops.map((s, i) => (
                <ChapterMarker key={s.miracle.id} stop={s} active={i === activeIdx} />
              ))}
            </Map>
          ) : (
            <MapTokenMissing />
          )}
        </CollapsibleMap>
        <div className="mx-auto w-full max-w-3xl px-5 py-4 sm:px-8">
          <PilgrimageBook
            stops={stops}
            activeIdx={activeIdx}
            onPrev={handlePrev}
            onNext={handleNext}
            onJump={handleJump}
          />
        </div>
      </div>

      {/* Desktop: 42%/1fr split with sticky map on the right. */}
      <div className="hidden md:flex md:flex-1 md:overflow-hidden">
        <div className="grid h-full w-full grid-cols-[minmax(380px,42%)_minmax(0,1fr)] overflow-hidden">
          <div className="atlas-scroll relative h-full overflow-hidden">
            <PilgrimageBook
              stops={stops}
              activeIdx={activeIdx}
              onPrev={handlePrev}
              onNext={handleNext}
              onJump={handleJump}
              className="h-full"
            />
          </div>
          <div className="h-full bg-ink">
            {TOKEN ? (
              <Map
                ref={desktopMapRef}
                mapboxAccessToken={TOKEN}
                initialViewState={initialView}
                mapStyle={resolveStyleUrl(styleUrl)}
                projection={{ name: 'globe' }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                interactive={false}
                onLoad={() => applyDuskPreset(desktopMapRef.current)}
              >
                <AttributionControl compact position="bottom-left" />
                {stops.map((s, i) => (
                  <ChapterMarker key={s.miracle.id} stop={s} active={i === activeIdx} />
                ))}
              </Map>
            ) : (
              <MapTokenMissing />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterMarker({
  stop,
  active,
}: {
  stop: { miracle: { id: string; coordinates: [number, number]; type: keyof typeof PIN_HEX } }
  active: boolean
}) {
  return (
    <Marker
      longitude={stop.miracle.coordinates[0]}
      latitude={stop.miracle.coordinates[1]}
      anchor="center"
    >
      <span
        aria-hidden
        className={cn(
          'block size-2.5 rounded-full ring-2 transition-transform',
          active ? 'scale-150 ring-vellum' : 'ring-vellum/40',
        )}
        style={{ backgroundColor: PIN_HEX[stop.miracle.type] }}
      />
    </Marker>
  )
}

function MapTokenMissing() {
  return (
    <div className="flex h-full items-center justify-center px-6 text-center font-display text-lg italic text-vellum/80">
      Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to render the map.
    </div>
  )
}

// Lifted from atlas-shell.tsx — same visibility check pattern. Both branches
// mount their own Mapbox context (the hidden branch idles via display:none);
// we forward to whichever ref currently has a visible container.
function isMapVisible(mapRef: MapRef): boolean {
  const container = mapRef.getMap().getContainer()
  return container.offsetParent !== null
}
```

**Step 2: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. Component is still unused at this point.

**Step 3: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/pilgrimage-shell.tsx'
git commit -m "feat(atlas): add PilgrimageShell (matches explore layout, single shared map per branch)"
```

---

### Task B3: Wire PilgrimageShell into the route, delete the old Pilgrimage component

**Files:**
- Modify: `src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx`
- Delete: `src/app/(frontend)/components/atlas/pilgrimage.tsx`

**Step 1: Confirm nothing else imports the old Pilgrimage component**

```bash
grep -rn "from.*atlas/pilgrimage'\\|from.*atlas/pilgrimage\"\\|/pilgrimage'\\|/pilgrimage\"" src/ | grep -v "pilgrimage-book\\|pilgrimage-shell\\|/pilgrimages/"
```

Expected: only the import line in `[slug]/page.tsx`. If anything else appears, STOP and report BLOCKED.

**Step 2: Update the route to use PilgrimageShell + flex-1 main**

Open `src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx`. Find the import:

```tsx
import { Pilgrimage } from '../../../components/atlas/pilgrimage'
```

Change to:

```tsx
import { PilgrimageShell } from '../../../components/atlas/pilgrimage-shell'
```

Find the JSX (around line 67-90):

```tsx
  return (
    <main className="min-h-[80dvh] pb-12">
      <header className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
          Pilgrimage{pilgrimage.isSample ? ' · [Sample]' : ''}
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
          {pilgrimage.title}
        </h1>
        {pilgrimage.subtitle ? (
          <p className="mt-4 max-w-[55ch] font-display text-xl italic leading-relaxed text-ink-soft md:text-2xl">
            {pilgrimage.subtitle}
          </p>
        ) : null}
      </header>

      <Pilgrimage pilgrimage={pilgrimage} styleUrl={styleUrl} />

      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
```

Replace with:

```tsx
  return (
    <main className="min-h-[80dvh] pb-12 md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden md:pb-0">
      <PilgrimageShell pilgrimage={pilgrimage} styleUrl={styleUrl} />
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
```

The pre-rewrite hero `<header>` is gone — the title + subtitle now live inside the chapter pane (the first chapter's `<h2>` is the visible heading, and the pilgrimage title is shown as the page metadata + via SiteHeader's pilgrimage breadcrumb if you want it later). The main element gets the same `flex-1 min-h-0` treatment as `/atlas` so the walker fills exactly the remaining viewport on desktop.

**Step 3: Delete the old Pilgrimage component**

```bash
git rm 'src/app/(frontend)/components/atlas/pilgrimage.tsx'
```

**Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. If typecheck flags an unused import (e.g. `framer-motion` or `Link` only used by the deleted component), check whether the import was in `[slug]/page.tsx`'s import list and remove it. Report any unexpected complaints.

**Step 5: Commit**

```bash
git add 'src/app/(frontend)/atlas/pilgrimages/[slug]/page.tsx'
git commit -m "feat(atlas): replace Pilgrimage scroll-tell with PilgrimageShell (paged book + shared map)"
```

(`pilgrimage.tsx` was already staged via `git rm`.)

---

## Phase C — Studio media + QA

### Task C1: Add videos field to Miracles collection + types + serialise

**Why:** users want videos on miracles (YouTube, Vimeo, direct MP4). Sources currently store URLs but render as plain links — videos need to embed inline. URL-based (no upload) so editors paste a link.

**Files:**
- Modify: `src/collections/Miracles.ts`
- Modify: `src/app/(frontend)/components/atlas/types.ts`
- Modify: `src/app/(frontend)/components/atlas/serialise.ts`

**Step 1: Add the videos field to Miracles**

Open `src/collections/Miracles.ts`. Find the artwork field (around line 68-76):

```ts
            {
              name: 'artwork',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Reliquary images shown in the drawer carousel.',
              },
            },
          ],
        },
```

Update the description AND add a videos field immediately after, so the block reads:

```ts
            {
              name: 'artwork',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Reliquary images shown in the detail carousel.',
              },
            },
            {
              name: 'videos',
              type: 'array',
              labels: { singular: 'Video', plural: 'Videos' },
              admin: {
                description:
                  'Embed videos by pasting a YouTube, Vimeo, or direct MP4 URL. They render inline on the miracle detail view.',
              },
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'Full URL. YouTube/Vimeo links are converted to privacy-enhanced embeds; direct .mp4/.webm URLs render in a native <video> player.',
                  },
                },
                { name: 'label', type: 'text' },
                { name: 'attribution', type: 'text' },
              ],
            },
          ],
        },
```

**Step 2: Add MiracleVideo type**

Open `src/app/(frontend)/components/atlas/types.ts`. Below the existing `MiracleSource` type (around line 30), add:

```ts
export type MiracleVideo = {
  url: string
  label?: string | null
  attribution?: string | null
}
```

Then find the `MiracleSummary` type (around line 33) and add a `videos` field:

```ts
export type MiracleSummary = {
  id: string
  slug: string
  title: string
  type: MiracleType
  ecclesialStatus: EcclesialStatus
  locationName: string
  coordinates: [number, number] // [lng, lat]
  yearOccurred: number
  dateApproximate: boolean
  approvalDate?: string | null
  approvingAuthority?: string | null
  summary: string
  narrative?: unknown // Lexical JSON
  sources: MiracleSource[]
  artwork: MiracleArtwork[]
  videos: MiracleVideo[]
  isSample: boolean
}
```

(One field added: `videos: MiracleVideo[]`.)

**Step 3: Map videos in serialise**

Open `src/app/(frontend)/components/atlas/serialise.ts`. Find the imports (top of file):

```ts
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
  type PilgrimageRouteStop,
  type PilgrimageSummary,
} from './types'
```

Add `MiracleVideo` to the import list:

```ts
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
  type MiracleVideo,
  type PilgrimageRouteStop,
  type PilgrimageSummary,
} from './types'
```

Find the `toMiracleSummary` function. Inside it, after the `artwork` mapping block (around line 30), before the `return` statement, add:

```ts
  const videosRaw = Array.isArray(r.videos) ? r.videos : []
  const videos: MiracleVideo[] = videosRaw
    .map((v): MiracleVideo | null => {
      if (typeof v !== 'object' || v === null) return null
      const o = v as Record<string, unknown>
      const url = typeof o.url === 'string' ? o.url.trim() : ''
      if (!url) return null
      return {
        url,
        label: typeof o.label === 'string' ? o.label : null,
        attribution: typeof o.attribution === 'string' ? o.attribution : null,
      }
    })
    .filter((v): v is MiracleVideo => v !== null)
```

In the same function's `return` block, add `videos` to the returned object alongside `sources` and `artwork`:

```ts
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    type: r.type as MiracleType,
    ecclesialStatus: r.ecclesialStatus as EcclesialStatus,
    locationName: String(r.locationName ?? ''),
    coordinates: [Number(coords[0] ?? 0), Number(coords[1] ?? 0)],
    yearOccurred: Number(r.yearOccurred ?? 0),
    dateApproximate: Boolean(r.dateApproximate),
    approvalDate:
      typeof r.approvalDate === 'string' ? r.approvalDate : null,
    approvingAuthority:
      typeof r.approvingAuthority === 'string' ? r.approvingAuthority : null,
    summary: String(r.summary ?? ''),
    narrative: r.narrative ?? null,
    sources,
    artwork,
    videos,
    isSample: Boolean(r._isSample),
  }
```

**Step 4: Regenerate Payload types**

```bash
pnpm generate:types
```

This regenerates `src/payload-types.ts` from the updated collection schema so TypeScript knows about the `videos` field on miracle docs.

**Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. The newly committed `payload-types.ts` should also be staged.

**Step 6: Commit**

```bash
git add 'src/collections/Miracles.ts' 'src/app/(frontend)/components/atlas/types.ts' 'src/app/(frontend)/components/atlas/serialise.ts' 'src/payload-types.ts'
git commit -m "feat(atlas): add videos[] field to Miracles (URL-based YouTube/Vimeo/MP4 embeds)"
```

---

### Task C2: VideoEmbed component + render in MiracleDetail

**Why:** the detail view needs to render the new `videos` array. YouTube/Vimeo URLs become privacy-enhanced iframe embeds; direct video URLs (`.mp4`, `.webm`, `.mov`) become native `<video>` elements.

**Files:**
- Create: `src/app/(frontend)/components/atlas/video-embed.tsx`
- Modify: `src/app/(frontend)/components/atlas/miracle-detail.tsx`

**Step 1: Create VideoEmbed**

Create `src/app/(frontend)/components/atlas/video-embed.tsx`:

```tsx
// src/app/(frontend)/components/atlas/video-embed.tsx
'use client'

import { useMemo } from 'react'

import { type MiracleVideo } from './types'

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])
const VIDEO_FILE_EXTS = ['.mp4', '.webm', '.mov', '.m4v']

type Resolved =
  | { kind: 'youtube'; embedUrl: string; originalUrl: string }
  | { kind: 'vimeo'; embedUrl: string; originalUrl: string }
  | { kind: 'file'; url: string }
  | { kind: 'unknown'; url: string }

function resolveVideo(rawUrl: string): Resolved {
  let parsed: URL | null = null
  try {
    parsed = new URL(rawUrl)
  } catch {
    parsed = null
  }
  if (!parsed) return { kind: 'unknown', url: rawUrl }

  const host = parsed.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(host)) {
    // youtu.be/<id> | youtube.com/watch?v=<id> | youtube.com/embed/<id>
    let id = ''
    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split('/')[0] ?? ''
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/')[2] ?? ''
    } else {
      id = parsed.searchParams.get('v') ?? ''
    }
    if (id) {
      // youtube-nocookie.com is the privacy-enhanced host (no cookies until
      // the user actually plays the video).
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        originalUrl: rawUrl,
      }
    }
  }

  if (VIMEO_HOSTS.has(host)) {
    // vimeo.com/<id> | vimeo.com/<id>/<hash> | player.vimeo.com/video/<id>
    const segs = parsed.pathname.split('/').filter(Boolean)
    const id = segs[0] === 'video' ? segs[1] : segs[0]
    if (id && /^\d+$/.test(id)) {
      return {
        kind: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
        originalUrl: rawUrl,
      }
    }
  }

  const lowerPath = parsed.pathname.toLowerCase()
  if (VIDEO_FILE_EXTS.some((ext) => lowerPath.endsWith(ext))) {
    return { kind: 'file', url: rawUrl }
  }

  return { kind: 'unknown', url: rawUrl }
}

/**
 * Render a single video from the miracle's `videos[]` array. YouTube and
 * Vimeo URLs use privacy-enhanced iframe embeds (no cookies until play);
 * direct video files use a native <video> player. Unrecognised URLs fall
 * back to a plain link so the editor's content is never silently dropped.
 */
export function VideoEmbed({ video }: { video: MiracleVideo }) {
  const resolved = useMemo(() => resolveVideo(video.url), [video.url])

  if (resolved.kind === 'youtube' || resolved.kind === 'vimeo') {
    return (
      <figure className="flex flex-col gap-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-ink">
          <iframe
            src={resolved.embedUrl}
            title={video.label ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            loading="lazy"
          />
        </div>
        <Caption video={video} />
      </figure>
    )
  }

  if (resolved.kind === 'file') {
    return (
      <figure className="flex flex-col gap-2">
        <video
          src={resolved.url}
          controls
          preload="metadata"
          className="aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-ink"
        />
        <Caption video={video} />
      </figure>
    )
  }

  // Unknown URL — render as a labelled link so we don't silently drop content.
  return (
    <p className="font-mono text-[11px] text-ink-soft">
      <a
        href={resolved.url}
        target="_blank"
        rel="noreferrer"
        className="text-ink underline-offset-2 hover:underline"
      >
        {video.label ?? resolved.url}
      </a>
      {video.attribution ? ` — ${video.attribution}` : ''}
    </p>
  )
}

function Caption({ video }: { video: MiracleVideo }) {
  if (!video.label && !video.attribution) return null
  return (
    <figcaption className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
      {video.label}
      {video.label && video.attribution ? ' · ' : ''}
      {video.attribution}
    </figcaption>
  )
}
```

**Step 2: Render videos in MiracleDetail**

Open `src/app/(frontend)/components/atlas/miracle-detail.tsx`. Add to the imports near `next/image`:

```tsx
import { VideoEmbed } from './video-embed'
```

Find the artwork carousel block (around line 117-140) — the one that starts with:

```tsx
        {miracle.artwork.length > 0 ? (
          <div className="atlas-scroll -mx-6 flex snap-x snap-proximity gap-3 overflow-x-auto overflow-y-hidden px-6 lg:-mx-10 lg:px-10">
```

Immediately AFTER the closing `) : null}` of that block (and BEFORE the `{miracle.narrative ? <NarrativeBlock node={miracle.narrative} /> : null}` line), add:

```tsx
        {miracle.videos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {miracle.videos.map((v, i) => (
              <VideoEmbed key={i} video={v} />
            ))}
          </div>
        ) : null}
```

**Step 3: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 4: Commit**

```bash
git add 'src/app/(frontend)/components/atlas/video-embed.tsx' 'src/app/(frontend)/components/atlas/miracle-detail.tsx'
git commit -m "feat(atlas): render miracle videos in MiracleDetail (YouTube/Vimeo/MP4 embeds)"
```

---

### Task C3: Add a sample video to one seeded miracle

**Why:** verify the new field flows end-to-end (collection → seed → DB → fetch → serialise → render). Add ONE video to ONE existing seeded miracle in `seed-atlas.ts` so re-seeding produces a renderable example.

**Files:**
- Modify: `src/scripts/seed-atlas.ts`

**Step 1: Find the first sample miracle in seed-atlas.ts**

Open `src/scripts/seed-atlas.ts` and find the first miracle's data block. The seed defines an array of miracle objects. Find the FIRST miracle in that array (likely Sample-Lanciano or similar — the first Eucharistic miracle).

**Step 2: Add a `videos` field to that one miracle**

Locate the first miracle's object literal. After its `sources` array (or whichever field comes last in its current object), add a `videos` array. The exact insertion point depends on the file's structure — find the closing brace of the first miracle's object literal and insert the field before it. Example shape (use this verbatim, adjust only the indentation to match the surrounding block):

```ts
videos: [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    label: 'Sample explanatory video',
    attribution: 'Sample · replace with a real source',
  },
],
```

(URL is a placeholder for testing the embed pipeline — the seed already calls these "[Sample]" miracles, so the placeholder labelling is consistent. The content team will replace these in production.)

If the seed file's miracle definitions use a TypeScript helper or factory function rather than literal objects, find the call for the first miracle and pass an extra argument or property to attach the videos array. Match the existing pattern.

**Step 3: Re-run the seed and verify the field round-trips**

```bash
pnpm seed:atlas
```

Expected: idempotent re-seed succeeds, no errors. The first miracle now has one video in its document.

**Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 5: Commit**

```bash
git add 'src/scripts/seed-atlas.ts'
git commit -m "chore(atlas): add a sample video to the first seeded miracle for round-trip verification"
```

---

### Task C4: Final verification + studio QA + handoff

This task verifies the full v4 implementation and runs a manual studio walkthrough. No new commits unless QA surfaces a fixable gap.

**Step 1: Full gate run**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 2: Route smoke**

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

Expected: every path returns `200`. Then verify each pilgrimage walker URL — for each pilgrimage slug seeded:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/atlas/pilgrimages/eucharistic-italy"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/atlas/pilgrimages/marian-witnesses"
```

Both should return `200`.

**Step 3: End-to-end interaction smoke (manual, browser)**

Walk through these in a browser at the running dev server:

**Desktop (≥1280px):**
1. `/atlas` loads. SiteHeader is at the top. Below it: full-bleed work area with NO scroll. Hover a miracle card → globe pans (no zoom change) to that pin after ~250ms. Click a card → detail replaces list, map flies in + orbits as before.
2. Mode toggle in the hero shows two equally-wide tabs ("Explore" + "Pilgrimages"), neither wider than the other.
3. Click "Pilgrimages" → land on `/atlas/pilgrimages` gallery. Header at top, footer at bottom (this page is NOT full-bleed — it's a card grid).
4. Click a pilgrimage card → land on `/atlas/pilgrimages/{slug}`. Walker is full-bleed (no footer), 42% book on the left + sticky map on the right. Active marker is highlighted on the map. Map has flown to chapter 1.
5. Click "Next" in the book's bottom bar → animation slides chapter 2 in, map flies to chapter 2's coordinate, marker highlight moves.
6. Press the `→` arrow key → advances to chapter 3. Press `←` → back to chapter 2.
7. Click a dot in the bottom bar → jumps directly to that chapter.
8. On the last chapter, "Next" is disabled. On the first chapter, "Prev" is disabled.

**Mobile (390×844 in dev tools):**
1. `/atlas` loads. SiteHeader at top. Below it: collapsible map at the top of the work area (mobile), then a "Filters" toggle button (collapsed by default), then count + miracle list.
2. Tap "Filters" → panel animates open showing search + chips + timeline. Tap again → collapses.
3. Set a filter → "Filters · 1" badge appears in the toggle.
4. Tap a card → detail replaces filters + list (filter panel disappears with the list when selected, per Phase A3 logic). Collapsible map stays put. Tap back → list returns.
5. Navigate to `/atlas/pilgrimages/{slug}` → ONE collapsible map at the top, paged book below. Swipe left/right on the chapter pane → advances/retreats.
6. Bottom bar's Prev/Next buttons work. Dots work.

**Step 4: Studio QA — create a miracle from scratch**

Open `/admin` (Payload studio). Sign in.

1. Go to Miracles → "Create New".
2. Fill the **Content** tab:
   - Title: `Test Miracle — Pleae Delete`
   - Summary: `A short test summary.`
   - Narrative: write 2 paragraphs of richtext, including a bold word and an inline link to `https://example.com`.
   - Sources: add 1 source with `label: Test source`, `url: https://example.com`, `attribution: Test`.
   - Artwork: upload 2 images (any test images).
   - Videos: add 1 video with a YouTube URL (e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).
3. Fill the **Provenance** tab:
   - Type: Eucharistic
   - Ecclesial status: Approved
   - Location name: `Test City, Italy`
   - Coordinates: open the picker. Click on the map → a pin drops. Drag the pin → coordinates update. Type "Vatican" in the geocode input → press the Geocode button → coordinates update to Vatican.
   - Year occurred: `1500`
   - Date approximate: leave unchecked
   - Approving authority: `Test Bishop`
4. Set the slug field in the sidebar to `test-miracle-please-delete`.
5. Click **Save Draft**, then **Publish**.

**Step 5: Verify the new miracle appears on the frontend**

In the browser:
- Go to `/atlas` → the new miracle should appear in the list (with title "Test Miracle — Pleae Delete").
- Click it → detail opens, shows the eyebrow, title, location, summary, 2 image carousel, 1 embedded YouTube player, narrative paragraphs, source, no [Sample] tag.
- Go to `/atlas/list` → the new miracle is listed alphabetically.
- Go to `/atlas?focus=test-miracle-please-delete` → page loads with the detail open.

**Step 6: Verify live-preview still works on the studio**

Back in studio, edit the test miracle's title (e.g. add " (edited)" to the end). Click the live-preview tab in the studio sidebar. The preview pane should show the updated title in the detail view within a few seconds (autosave + LivePreviewListener).

**Step 7: Delete the test miracle from studio**

Studio → Miracles → click the test miracle → Delete (admin role required).

**Step 8: Final summary**

If every check passes, report DONE. If any check fails, capture the failure mode (URL + screenshot description + error) and report it. Likely fix candidates:
- 404 on `/atlas/pilgrimages/{slug}`: the seed may need re-running.
- YouTube embed shows but won't play: the URL was likely a non-video URL — paste a real video URL.
- Coordinate picker fails to geocode: check `MAPBOX_GEOCODING_TOKEN` env var (separate from the map style token).

**Step 9: Handoff message to user**

Format the response:

> Atlas v4 done. Branch is at `<sha>`. Header is back globally; full-bleed feel preserved on /atlas, /atlas/list, and the pilgrimage walker by hiding only the footer and sizing main with flex-1 min-h-0. Hover-to-rotate-globe works on the list (debounced 250ms, yields to selection). Mobile filters are collapsible and live between the map and the list. Mode toggle is exact 50/50. Pilgrimage walker is rebuilt: paged-chapter book with kbd + swipe + dots, single shared map per branch, full-bleed lock matching explore. Miracles now accept videos (YouTube/Vimeo/MP4) and they render in the detail view.
>
> Verified: typecheck + lint + build clean; route smoke 12/12; studio create/edit/publish round-trip works for all field types including videos and the coordinate picker.
>
> Plan 3 (Doctrine LMS) is next, but you trigger it.

---

## Don't-break warnings (carry-over from v3 + new for v4)

- **Plan 1 surfaces (`/`, `/reading`, `/manifesto`, `/credits`, studio chrome):** chrome restored on these too (they were never hidden). Verify they still scroll naturally with header at top + footer at bottom.
- **Pilgrimage gallery (`/atlas/pilgrimages` no slug):** card grid, NOT full-bleed. Verify chrome shows + footer shows + page scrolls naturally.
- **Pilgrimage walker (`/atlas/pilgrimages/{slug}`):** new shell, full-bleed lock, no footer. Verify the chapter URL still resolves; verify the existing seed pilgrimages (`eucharistic-italy`, `marian-witnesses`) still load and play through.
- **Studio coordinate-picker:** unchanged — but verified in C4 Step 4. Field component path: `/app/(payload)/components/coordinate-picker#default`.
- **Mapbox config (`mapbox-style.ts`, `applyDuskPreset`, `resolveStyleUrl`):** untouched. PilgrimageShell uses `applyDuskPreset` exactly as the old Pilgrimage component did, so dusk lighting renders on chapter arrivals.
- **Cinematic settings:** preserved — selection flyTo zoom 17 / pitch 60 / 3500ms / 60s orbit (atlas explore); chapter flyTo zoom 15 / pitch 55 / 2200ms with alternating bearing (pilgrimage walker, lifted from the old Pilgrimage code).
- **Hover↔pin sync** on `/atlas`: still works; the new hover-rotate effect is additive — it consumes the same `hoveredSlug` state without disrupting the visual pin highlight in `<Globe>`.
- **`/atlas/list` keyboard catalogue:** route untouched; just gets the header back like everything else.
- **URL sync (`?focus=`):** unchanged — `window.history.replaceState` still mirrors selection.
- **Mobile collapsible map (h-64 ↔ h-[80dvh]):** unchanged. The new `MobileFilterPanel` lives in the layout slot below it.
- **Seed scripts:** `seed-pilgrimages.ts` is NOT modified — the existing two pilgrimages (`eucharistic-italy`, `marian-witnesses`) are exercised through the new shell automatically. Only `seed-atlas.ts` gains one sample video on one miracle.
