# Tantum Ergo · Atlas v3 — kickoff handoff (card-replaces-list architecture)

> **For the next Claude session:** This document is self-contained. Memory at `MEMORY.md` is auto-loaded. Read this end-to-end first, then act. The prior conversation does **not** need to be read — it's full and was closed for context reasons.

---

## 0 · Current state

**Branch:** `feat/foundation`
**HEAD:** `e2e49c8fe67bb7cdc53e86fa2a3aa544a09d2205` (Atlas v2.5 shipped)
**Health:** `pnpm typecheck`, `pnpm lint`, `pnpm build` all green. `pnpm seed:atlas` and `pnpm seed:pilgrimages` are idempotent. All routes return 200.

**What's already shipped on this branch (do not redo):**

- **Plan 1** (Foundation), **Phase A** (home Sistine polish), **Phase B** (Gemini imagery), **Plan 5** (Supabase Storage). All stable; do not touch.
- **Plan 2** (Atlas pillar v1) — `Miracles` collection, dark-v11 globe, side drawer, timeline scrub, type+status chips, single curated pilgrimage, `/atlas/list` keyboard catalogue, 9 sample miracles seeded.
- **Plan 2.5** (Atlas v2 — standout feature):
  - Mapbox **Standard** style with `lightPreset: 'dusk'` (sacred Caravaggio palette + 3D buildings + landmark cathedrals worldwide)
  - **Pilgrimages collection** with ordered `route` array of `{miracle, chapterNote}` stops, drafts/autosave/scheduled-publish/livePreview at `/atlas/pilgrimages/{slug}`
  - `/atlas/pilgrimages` gallery (force-dynamic) → `/atlas/pilgrimages/[slug]` walker
  - Pitched flyTo cinematics on the walker (zoom 15, pitch 55, alternating bearing) so 3D buildings render at chapter arrivals
  - Custom **coordinate-picker** field at `src/app/(payload)/components/coordinate-picker.tsx` — embedded Mapbox map (click + drag pin) + Mapbox Geocoding API "Geocode from location name" button
  - 2 sample pilgrimages seeded (`Eucharistic Italy`, `Marian Witnesses`)
- **Atlas v2.1–v2.5** (the explore-page UX iterations — read this carefully because the v3 work touches these directly):
  - **v2.1** — Zillow-style split: hero full-width on top, then 2-col grid below (`1fr | 55%`). Left: scrollable miracle cards (hover↔pin sync). Right: sticky 3D globe.
  - **v2.2** — pagination (8 per page, "Show more"), search (title/location/summary), 360° cinematic orbit on selection (60s/full revolution, stops on user map interaction), drawer header polish.
  - **v2.3** — sticky-100dvh columns, body scroll lock when drawer opens, **flyTo zoom 17, pitch 60, duration 3500ms**.
  - **v2.4** — drawer scroll bug fixed (was `md:bottom-auto`), body lock scoped to mobile only, pause/play rotation **moved into drawer** (was a floating pill on the map), `padding.top` on flyTo so 3D buildings don't clip at top.
  - **v2.5** — **single scroll container on desktop**: hero, sticky filter bar, and list now all live inside the left column's `overflow-y-auto`. Body has `overflow: hidden` on `md+` (`<main md:h-[100dvh] md:overflow-hidden>`). New `.atlas-scroll` utility class in `globals.css` for themed thin scrollbars.

The most important file for your work: [`src/app/(frontend)/components/atlas/atlas-shell.tsx`](../../../src/app/(frontend)/components/atlas/atlas-shell.tsx). Read it in full before writing the plan.

---

## 1 · The user's complaint (verbatim, summarized)

> "Its still not working. The scrollbars are like rubber banding all of them. If I look at Zillow it is like the map is stuck and takes up the full screen — there is no footer or anything and it takes up half of the screen. And maybe we make it so that when you press the list it brings up the card OVER the list — like it replaces the list and there is a back button or something that goes back to the list."

Translated:

1. **Scrollbars feel rubber-band-y** — likely macOS / Safari overscroll bounce, but possibly also competing wheel-event routing despite the v2.5 single-container fix.
2. **Map should feel "stuck" and take half the screen** — they want the map to feel completely fixed, page-like; **no footer**, no scroll past, no chrome below the work area on `/atlas`.
3. **The drawer overlay pattern is wrong.** When a card is clicked, the right-side drawer covers part of the map. The user finds this clunky — they want the **detail view to REPLACE THE LIST in the left column**, with a "Back" button to return. Map stays untouched on the right (fly + orbit as today).

This is a real architectural shift, not a tweak. The existing `<MiracleDrawer>` overlay should be deleted entirely on desktop and replaced with an in-column view swap. Map column never gets covered.

---

## 2 · Architecture for Atlas v3

Two views, swapped within the SAME column. Map is permanently visible on the right.

### Desktop (`≥md`)

```
┌──────────────────────────────────────────────────────────────┐
│ ← LEFT COLUMN (h-100dvh, single scroll) ─────┬─ MAP (h-100dvh)│
│                                               │                │
│  [Atlas hero — scrolls away on first scroll]  │                │
│  [Sticky filter bar — search + chips + scrub] │                │
│  [N of M miracles]                            │   3D Globe     │
│  [Card 1]                                     │   (sticky to   │
│  [Card 2]    ← LIST VIEW (default)            │    viewport,   │
│  [Card 3]                                     │    flies on    │
│  [Card 4]                                     │    selection,  │
│                                               │    orbits)     │
│                                               │                │
│         ─── click a card ───→                 │                │
│                                               │                │
│  [← Back to list]   [⏸ Pause rotation]        │                │
│  ●  EUCHARISTIC · APPROVED                    │                │
│  Eucharistic Miracle of Sample-Lanciano       │                │
│  Sample-Lanciano, Italy · c. 700 · [Sample]   │                │
│  [Image carousel]                             │                │
│  [Summary / narrative]                        │                │
│  [Approving authority]    ← DETAIL VIEW       │                │
│  [Sources]                                    │                │
│                                               │                │
└──────────────────────────────────────────────┴─────────────────┘
                                                  ↕ map never
                                                    obscured
```

- Page is locked: `<main md:h-[100dvh] md:overflow-hidden>` (unchanged from v2.5).
- Left column: single `overflow-y-auto overscroll-y-contain atlas-scroll` container at `h-full`.
- Whichever VIEW is mounted (list or detail) lives entirely inside that one container — only ONE scrollable element on the page at any time.
- No drawer overlay. Map is never covered.

### Mobile (`<md`)

Mobile already uses a collapsible-top map + list below (page scrolls naturally). Apply the same view-swap pattern:

- Default: collapsible map → filters → list (current behavior).
- When a card is tapped: list (and filter bar) is replaced by detail view in the same vertical position. Collapsible map stays at top. Back button at top of detail view.
- The bottom-sheet drawer is gone; detail just flows in the page.

This is consistent with desktop (one mental model, one component for view-swapping), and avoids the iOS Safari scroll-bleed-behind-bottom-sheet bug entirely.

### Routing / state

- A single `selectedSlug: string | null` in `AtlasShell` drives the view choice. `null` = list view, set = detail view.
- The URL stays in sync via `?focus={slug}` — already wired (the `initialFocusSlug` prop is forwarded from the server page). When the user clicks a card, push `?focus={slug}` (shallow). When they click "Back", clear the param. Browser back button then works.
- The map's flyTo + orbit stays exactly as in v2.4 (zoom 17, pitch 60, duration 3500, 60s orbit, click-empty-map-to-stop-orbit, etc).

### What's deleted

- **`MiracleDrawer`** component (`miracle-drawer.tsx`) — gone. All its content layout (header, eyebrow, title, meta, pause/play pill, image carousel, narrative, authority, sources) moves into a new `MiracleDetail` component that's rendered INSIDE the left column.
- The body-scroll-lock useEffect in MiracleDrawer — gone (no overlay, no need).
- The `<AnimatePresence>` slide-from-bottom animation — gone. The view swap is inline; consider a subtle cross-fade or slide-up if you want motion polish, but it's optional.

### What's preserved (do not redesign)

- The **map** behavior — Globe component, `applyDuskPreset`, click-empty-map-stops-rotation, hover popup, click-pin-selects.
- **Pilgrimages** routes (`/atlas/pilgrimages`, `/atlas/pilgrimages/[slug]`) — they're a separate flow with their own scrolltelling component. Don't touch.
- `/atlas/list` catalogue — separate route, untouched.
- The **coordinate-picker** custom field — studio-side, untouched.
- The **filter chips, search input, timeline scrub, mode toggle, miracle list, pilgrimage plate** components — UI primitives, untouched.
- The **sticky filter bar pattern** at the top of the left column — preserved in list view; in detail view there's a sticky "Back + actions" bar instead.

---

## 3 · Implementation phases

Suggested 3-phase plan. Each phase ends in commits that compile + lint + build clean.

### Phase A — New `MiracleDetail` component (no behavior change yet)

Create `src/app/(frontend)/components/atlas/miracle-detail.tsx`. It's roughly the contents of `MiracleDrawer`'s `DrawerBody`, restructured for in-column rendering:

- A sticky-top action bar: `← Back to list` button on the left + the existing pause/play pill on the right.
- Below: the existing eyebrow + title + meta + image carousel + summary + narrative + approving authority + sources blocks. Same Tailwind classes, same Lexical walker, same artwork carousel with `atlas-scroll`.
- Props: `{ miracle: MiracleSummary, isOrbiting: boolean, onTogglePlayPause?: () => void, onBack: () => void }`.
- Full keyboard support: Back button gets focused on mount via `useEffect + useRef + setTimeout(0)` — same pattern the drawer used. ESC also calls `onBack()`.
- No `position: fixed`, no `motion.aside`, no z-index. Just a normal flex column.

Don't wire it into AtlasShell yet — Phase B does that.

### Phase B — AtlasShell view swap

Modify `src/app/(frontend)/components/atlas/atlas-shell.tsx`:

- Inside the left column (the `atlas-scroll relative h-full overflow-y-auto overscroll-y-contain` div on desktop), conditionally render either the existing list-view content (hero + sticky filter bar + list) OR `<MiracleDetail miracle={selected} ... onBack={() => setSelectedSlug(null)} />` based on `selected` being non-null.
- Same pattern in the mobile branch — when `selected`, replace the filter+list section with `<MiracleDetail>`. Collapsible map stays at top.
- Delete the `<MiracleDrawer>` mount and the `MiracleDrawer` import.
- Delete `src/app/(frontend)/components/atlas/miracle-drawer.tsx`. Confirm no other file imports it (`grep -rn "MiracleDrawer\|miracle-drawer" src/`).
- Keep `selectedSlug` state, `handleSelect` (still flies the map), `handleDeselect` (now becomes the back handler), `togglePlayPause` / `playOrbit` / `pauseOrbit`, the orbit `useEffect`, the `isOrbiting` state.
- Update the URL on select/deselect using `next/navigation`'s `useRouter().replace('/atlas?focus=...', { scroll: false })` so deep-linking + browser back work. Optional but high value.
- Optional polish: when transitioning from list → detail, scroll the new column to top (`element.scrollTo({ top: 0 })`). When transitioning from detail → list, restore the prior scroll position (cache it in a ref on detail-mount).

### Phase C — Scroll-bounce / rubber-band cleanup

Address the "rubber-band" complaint at the CSS layer:

- On the left column (`atlas-scroll relative h-full overflow-y-auto overscroll-y-contain`), the `overscroll-y-contain` should already block the macOS bounce-into-body. If it's still felt, try `overscroll-behavior: none` (instead of `contain`) — this fully disables overscroll bounce, not just chaining.
- On `<html>` and `<body>`, add `overscroll-behavior: none` site-wide via `globals.css` so even outside `/atlas` there's no rubber-band on the body.
- On the map column, Mapbox's canvas already handles its own gestures; no overflow CSS needed.
- On mobile inside the collapsible map, ensure the touch events don't bubble to the page (Mapbox handles this internally; verify by testing).

After this, run `pnpm build && pnpm dev` and test:

- Desktop: load `/atlas`. Wheel anywhere over the left column — smooth, no bounce. Click a card — list swaps to detail view, map flies + orbits. Click Back — detail swaps back to list, scroll position restored. Map never gets covered.
- Mobile: same test on a 390×844 viewport. Card tap swaps the list area to detail. Back returns to list.
- Browser back button: tested with the URL sync from Phase B.

### Phase D (optional, ship-only-if-quick)

- Subtle cross-fade between list and detail views (Framer Motion `<AnimatePresence mode="wait">`).
- Browser-history sync for the focus param.
- "Next miracle / Previous miracle" arrows in the detail view's sticky bar (so the user can browse without going back to list).

These are polish — defer if time-constrained.

---

## 4 · Files you will touch

```
src/app/(frontend)/components/atlas/miracle-detail.tsx   NEW (~200 lines)
src/app/(frontend)/components/atlas/atlas-shell.tsx      MODIFY (view swap, drop drawer)
src/app/(frontend)/components/atlas/miracle-drawer.tsx   DELETE
src/app/(frontend)/globals.css                            MODIFY (overscroll-behavior: none if needed)
```

That's it. Three component files + one CSS rule. Should be ~3–6 commits total.

---

## 5 · Don't-break warnings

- **Plan 1 surfaces (`/`, `/reading`, `/manifesto`, `/credits`, studio chrome):** untouched.
- **Pilgrimage walker (`/atlas/pilgrimages/[slug]`):** uses the `<Pilgrimage>` component which is independent of `<MiracleDrawer>`. Don't touch the walker.
- **Pilgrimage gallery (`/atlas/pilgrimages`):** server-rendered, uses `<PilgrimagePlate>`. Untouched.
- **`/atlas/list` (keyboard catalogue):** uses Link to `/atlas?focus={slug}`. After your URL-sync work in Phase B, this should still deep-link cleanly into detail view.
- **Studio coordinate-picker:** different route group `(payload)`, untouched.
- **The seed scripts** (`seed-atlas.ts`, `seed-pilgrimages.ts`): untouched.
- **Mapbox config** (`mapbox-style.ts`, `applyDuskPreset`, `resolveStyleUrl`): untouched. The cinematic settings (zoom 17, pitch 60, flyTo 3500ms, orbit 60s) stay.

### Don't introduce regressions on these features the user explicitly likes:

- 3D buildings + dusk lighting on flyTo arrivals
- Pause/play rotation toggle (must move from the drawer to the new detail view's sticky action bar)
- Card hover ↔ pin highlight sync (works in list view)
- Pagination (8 per page, "Show more") in list view
- Search input filtering by title/location/summary in list view
- Sticky filter bar at the top of list view
- Themed `.atlas-scroll` styling on the single scroll container
- Mobile collapsible map (h-64 ↔ h-[80dvh])

---

## 6 · Skills to use, in order

1. **Don't re-invoke `superpowers:brainstorming`** — direction is settled in this handoff.
2. **`superpowers:writing-plans`** — for v3 task decomposition. Save plan to `docs/superpowers/plans/2026-05-06-tantum-ergo-atlas-v3.md`. Mirror the shape of [Plan 2](../plans/2026-05-05-tantum-ergo-atlas.md) and [Plan 2.5](../plans/2026-05-05-tantum-ergo-atlas-v2.md). 3 phases × ~3-5 tasks each = ~12 tasks total.
3. **`superpowers:subagent-driven-development`** — for execution. Group ~3 tasks per subagent dispatch (the prior plans worked well at this granularity). Two-stage review (spec compliance + code quality) per group.
4. After all tasks land and final verification passes, hand back to user. Don't auto-trigger Plan 3 (Doctrine LMS) — user paces.

---

## 7 · Closing message format when done

After v3 ships:

> Atlas v3 done. Branch is at `<sha>`. The drawer is gone — clicking a card now swaps the left column to a detail view with a "← Back to list" button at the top. Map stays untouched on the right (flies + orbits as before). No more scrollbar competition or rubber-banding — body is locked at 100dvh, only the left column scrolls. Test: load `/atlas`, scroll the list, click a card → detail view replaces list while map flies to the pin and orbits. Click Back → returns to list at the same scroll position. Mobile: same pattern, collapsible map at top stays put.
>
> Plan 3 (Doctrine LMS) is next, but you trigger it.

---

## 8 · One last thing

If during execution you find that the rubber-band feeling persists despite the architecture fix, **try this CSS first** before doing anything more invasive:

```css
html, body {
  overscroll-behavior: none;
}
```

That single rule disables the entire macOS / iOS Safari overscroll bounce site-wide. It's the most likely root cause of the user's "rubber-band" feeling — the v2.5 architecture was correct, but the OS-level bounce on the body element was still triggering.

If that fixes it, you can ship without the URL sync or animation polish (Phase D items) and tell the user.
