# Tantum Ergo · Plan 3 (Doctrine LMS) — kickoff handoff

> **For the next Claude session:** This document is self-contained. Memory at `MEMORY.md` is auto-loaded. Read this end-to-end first, then act. The prior conversation does **not** need to be read — it's full and was closed for context reasons.

---

## 0 · Current state

**Branch:** `feat/foundation` (also pushed to `origin/feat/foundation` as backup).
**Main:** at `61e7beb`. Fast-forward merged from `feat/foundation` and pushed to `origin/main`.
**HEAD:** `61e7beb` (both branches in sync).
**Health:** `pnpm typecheck && pnpm lint && pnpm build` all green. **Studio QA passed manually** by user — content authoring works end-to-end (miracles + pilgrimages), coordinate picker works, video URL validation works, live preview works.
**Repo:** https://github.com/ajojotank/Tantun-Ergo (note the typo "Tantun" is the actual repo name — not a typo to fix).

**What's already shipped (do NOT redo):**

- **Plan 1** (Foundation) — site shell, palette (vellum/ink/rubric/gilt/etc.), Cormorant Garamond + Geist typography, Pages collection, home + manifesto + credits + reading routes, scroll-rubric, mobile drawer, full motion grammar.
- **Phase A** (home Sistine polish) + **Phase B** (Gemini imagery) + **Plan 5** (Supabase Storage with `@payloadcms/storage-s3` adapter).
- **Plan 2** (Atlas pillar v1) — Miracles collection, dark globe, drawer, timeline scrub, type+status chips, /atlas/list keyboard catalogue, 9 sample miracles seeded.
- **Plan 2.5** (Atlas v2) — Mapbox Standard + dusk `lightPreset`, Pilgrimages collection (multi-route), gallery + walker pages, custom coordinate-picker custom field, 2 sample pilgrimages.
- **Atlas v2.1–v2.5** explore-page UX iterations — Zillow split, pagination, search, 360° orbit, flyTo cinematics (zoom 17 / pitch 60 / 3500ms / 60s orbit), single-scroll-container desktop.
- **Atlas v3** — card-replaces-list architecture (drawer deleted, MiracleDetail rendered in column), URL sync via `window.history.replaceState`, full-bleed Zillow shell, overscroll-bounce killed.
- **Atlas v4** — SiteHeader restored globally + footer hidden on full-bleed routes via `data-atlas-lock="true"` + `:has()` CSS rule (body forced to exactly 100dvh, main flex-1 min-h-0); hover-rotate-globe (debounced 250ms, yields to selection, zoom-aware reset); mobile collapsible filter panel between map and list; mode toggle exact 50/50 capped at 280px; pilgrimage rewrite (PilgrimageBook paged-chapter reader + PilgrimageShell layout mirroring explore + cover page with fitBounds/orbit + chapter media inheriting from miracle + chapter orbit + "All pilgrimages →" link on last chapter); videos field on Miracles (URL-based YouTube/Vimeo/MP4 embeds with two-layer protocol allowlist hardening — Payload `validate` + frontend `resolveVideo`).
- **Post-v4 polish** — gold chi-rho on all pages (`text-gilt`), gold thin scrollbar (`rgba(176,138,62,X)`, 8px wide), navbar symmetric padding (`py-4 md:py-6`), mobile globe pulled to zoom 0 (short landscape canvas), back-to-list flies camera back to globe view, "All pilgrimages →" replaces disabled Next on the last chapter, mobile pilgrimage chapter responsive layout fix (h-full collapsing to 0 on mobile → use `md:h-full` only).

**Operational decisions (locked in):**

- **Content team onboarding deferred** until ALL three pillars ship (Atlas + LMS + Catechist). No production deploy yet — local dev only. Will deploy + onboard content team after Plan 4 ships.
- **No member accounts** for end-users (per spec). Stewards (admin/theologian/editor) only.
- **All LMS progress state is client-side via `localStorage`** — no server-side tracking, no accounts.

---

## 1 · The next pillar — Plan 3: Doctrine LMS

Second of three pillars. Atlas (done) + Doctrine + Catechist (Plan 4, deferred — heavy). Doctrine is the next meaningful build.

**Spec source:** `docs/superpowers/specs/2026-05-04-tantum-ergo-v1-design.md`. Specifically:
- §4.3 — frontend pages + the "breviary surface" unit player UX
- §5.2 — DoctrineTracks / DoctrineModules / DoctrineUnits Payload schemas (the spec lists exact fields)
- §1, §3 — palette / typography / motion grammar (already locked in)

Read those sections in full before planning. The schema is detailed; the page layouts are described in tight prose.

**One-liner:** "Breviary visuals, course-platform bones." Three nested collections (Tracks → Modules → Units), four page levels, unit player with Read/Watch/Listen lanes + a mastery check, all progress state in `localStorage`.

---

## 2 · Three scope decisions to confirm with user FIRST

The user explicitly deferred these to the next session. Confirm them before invoking `writing-plans`. Defaults are listed; user can adjust.

1. **All three nesting levels (Tracks → Modules → Units)?** Spec keeps the three. Default: yes, build all three.
2. **Mastery check styling — gentle (per spec) or celebratory?** Spec says: single MCQ, one-line affirmation/correction on submit, no streaks, no badges, vellum aesthetic. Default: gentle, as spec'd.
3. **Seed content volume.** Proposed: 3 tracks × 2 modules × 3 units = 18 sample units. Each with a short reading paragraph + a placeholder mastery question. Watch/audio lanes empty (tabs auto-hide when no media). Default: 18 units.

---

## 3 · Implementation phases (rough — finalize in plan)

Mirror the shape of `2026-05-06-tantum-ergo-atlas-v4.md`: 3-4 phases × 3-5 tasks each = ~14 tasks total.

**Phase A — Schema + types**
- New collections: `DoctrineTracks`, `DoctrineModules`, `DoctrineUnits` in `src/collections/`
- `masteryCheck` group field with `options[]` array subfield
- Wire into `src/payload.config.ts` collections list
- `pnpm generate:types` to regenerate `src/payload-types.ts`
- New `src/app/(frontend)/components/doctrine/types.ts` for client wire shapes
- Serialise mappers in `src/app/(frontend)/components/doctrine/serialise.ts`

**Phase B — Catalogue + overview pages**
- `src/app/(frontend)/doctrine/page.tsx` — track catalogue (plates layout, mirror PilgrimagePlate shape)
- `src/app/(frontend)/doctrine/[track]/page.tsx` — track overview (modules as folio entries)
- `src/app/(frontend)/doctrine/[track]/[module]/page.tsx` — module overview (units listed)
- Reading-position restoration via `localStorage` on track + module pages (highlight last-read unit)

**Phase C — Unit player (the breviary surface)**
- `src/app/(frontend)/doctrine/[track]/[module]/[unit]/page.tsx`
- Top: track › module breadcrumb in italic Cormorant display
- Primary lane = reading (default). Lane switcher: "Read · Watch · Listen" tabs in gutter
- Watch/Listen tabs hidden (NOT greyed) when their media field is empty
- A unit with only Reading shows no tab strip at all
- Mastery check at end: single MCQ, "Do you remember?" prompt, one-line affirmation/correction, self-graded, stored in localStorage
- Footer: "Folio iii. of vii." in mono + "Turn page →" CTA → next unit (or next module's first unit if last in module)
- Note: spec calls this "single-page reading" — body has `max-w-[65ch]` per design language. NOT full-bleed locked like atlas.

**Phase D — Seed + studio QA**
- `src/scripts/seed-doctrine.ts` following the `seed-atlas.ts` / `seed-pilgrimages.ts` patterns (idempotent, marks all docs `_isSample: true`)
- ~18 sample units distributed across 3 tracks × 2 modules × 3 units
- Sample tracks: e.g. "Eucharist", "Mariology", "Liturgical Year" (or similar broad doctrinal categories — content team will replace with their own)
- Final verification: `pnpm typecheck && pnpm lint && pnpm build` clean, route smoke for /doctrine/{track}/{module}/{unit} for each seeded unit, manual studio walkthrough by user

---

## 4 · Skills to use, in order

1. Read this handoff end-to-end (you're doing it).
2. Confirm the 3 scope decisions in §2 with the user.
3. **`superpowers:writing-plans`** — for plan decomposition. Save plan to `docs/superpowers/plans/2026-05-07-tantum-ergo-doctrine.md` (or today's date if different). Mirror the shape of `2026-05-06-tantum-ergo-atlas-v4.md`.
4. **`superpowers:subagent-driven-development`** — for execution. Group ~3-4 tasks per subagent dispatch. Two-stage review (spec + quality) per group. Same pattern as Atlas v3 / v4.
5. After all tasks land and final verification passes, hand back to user. **Don't auto-trigger Plan 4** — user paces.

---

## 5 · Don't-break warnings

Specific files / surfaces that are SHIPPED and STABLE — leave them alone unless explicitly extending:

- **Atlas explore page** (`src/app/(frontend)/atlas/page.tsx`, `atlas-shell.tsx`, `globe.tsx`, `miracle-detail.tsx`, `miracle-list.tsx`, `mode-toggle.tsx`, `filter-panel.tsx`, `filter-chips.tsx`, `search-input.tsx`, `timeline-scrub.tsx`, `collapsible-map.tsx`).
- **Pilgrimage walker** (`pilgrimage-shell.tsx`, `pilgrimage-book.tsx`, `pilgrimage-cover.tsx`, `pilgrimage-plate.tsx`).
- **Shared atlas modules** (`mapbox-style.ts`, `orbit.ts`, `narrative.tsx`, `video-embed.tsx`, `serialise.ts`, `types.ts`, `full-bleed-routes.ts`).
- **Atlas collections** (`src/collections/Miracles.ts`, `Pilgrimages.ts`, `Articles.ts`, `Media.ts`).
- **Studio coordinate-picker** (`src/app/(payload)/components/coordinate-picker.tsx` + `.scss`) — used only by Miracles, leave alone.
- **Pillar pages** (`/`, `/reading`, `/manifesto`, `/credits`) — Plan 1 surfaces, untouched.
- **Site chrome** (`SiteHeader`, `SiteFooter`, `SiteChromeHide`, `Wordmark`, `ChiRho`, `MobileDrawer`, `ScrollRubric`).
- **Catechist route stub** (`src/app/(frontend)/catechist/page.tsx`) — leave as the placeholder for Plan 4.
- **Globals + helpers** (`globals.css`'s atlas-scroll + atlas-lock rules, `lib/cn.ts`, `lib/payload.ts`, `db/init-raw-tables.ts`).
- **Seed scripts** (`seed-foundation.ts`, `seed-atlas.ts`, `seed-pilgrimages.ts`) — read these for the pattern, but don't modify them. Add `seed-doctrine.ts` alongside.

### Don't introduce regressions on these:

- The body lock CSS rule `body:has(main[data-atlas-lock="true"]) { height: 100dvh; overflow: hidden }` is for **/atlas + walker only**. The /doctrine routes should NOT carry `data-atlas-lock="true"` — they're long-form reading and should scroll naturally.
- `min-h-[80dvh]` on doctrine main mains is fine (matches the catalogue / reading patterns).
- localStorage keys must NOT collide. Suggested namespacing: `tantum:doctrine:lastUnit:{trackSlug}` for last-read tracking, `tantum:doctrine:mastery:{unitSlug}` for mastery answers.

---

## 6 · Repo + remote

- Repo: https://github.com/ajojotank/Tantun-Ergo (typo in repo name — leave as-is).
- `feat/foundation` is the working branch. `main` and `feat/foundation` are at `61e7beb` and pushed to origin.
- Continue work on `feat/foundation`. Fast-forward merge to main + push when Plan 3 is complete.

---

## 7 · Closing message format when done

After Plan 3 ships:

> Plan 3 (Doctrine LMS) done. Branch is at `<sha>`. Three nested collections shipped (Tracks → Modules → Units), four page levels, unit player with Read/Watch/Listen lane switcher and mastery check (localStorage). 18 sample units seeded. Studio QA verified by user.
>
> Plan 4 (AI Catechist + RAG) is next, but you trigger it.

---

## 8 · Project pace + context

- **We are the technical team.** Non-technical content team gets onboarded only AFTER all three pillars ship — locked in by user this session.
- v1.0 polished-shell target was ~2026-05-10. Today is ~2026-05-07. Plan 3 fits the window if execution moves quickly.
- Plan 4 (AI Catechist + RAG with embedding pipeline + retrieval + chat UI + rate-limit raw table) is heavier — likely a week. Will likely run past 2026-05-10. Acceptable per user pacing.
- Mobile-first hard requirement — every doctrine surface must work cleanly on a 390×844 viewport.
- Aesthetic discipline — vellum + ink + rubric + gilt only, Cormorant + Geist + Geist Mono only, motion via Framer springs (`{stiffness: 110, damping: 22, mass: 0.5}`), reduced-motion honored.

---

## 9 · One last thing

The user explicitly said the LMS should NOT have streaks/badges/celebratory UX. Per the spec: "gentle". The mastery check is "Do you remember?" — affirming or correcting in one line, vellum-toned, no fanfare. If you find yourself reaching for a confetti animation or a streak meter, stop.
