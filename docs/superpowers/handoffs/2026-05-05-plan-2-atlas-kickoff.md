# Tantum Ergo · Plan 2 — Atlas pillar kickoff handoff

> **For the next Claude session:** This document is self-contained. Memory at `MEMORY.md` is auto-loaded. Read this end-to-end first, then act. The prior conversation does **not** need to be read.

---

## 0 · Where we are when you start

**Branch:** `feat/foundation` (already checked out)
**Latest commit:** `0e16759` — `fix(studio): brand mark + accent palette adapt to light AND dark mode`

**Completion state:**

| Milestone | State |
|---|---|
| Plan 1 — Foundation (shell, marketing, /reading, /manifesto, /credits, coming-soon placeholders) | ✅ shipped |
| Phase A — home Sistine polish (full-bleed hero, drop cap, GildedRule, pillar plates with image bg, chi-rho watermark) | ✅ shipped + motion-polish iterations |
| Phase B — Gemini image uploads | 🟡 user happy with what they've uploaded so far |
| **Plan 5 — Supabase Storage adapter** | ✅ shipped *ahead of schedule* (`@payloadcms/storage-s3` + `migrate:media` script + direct-URL bypass) |
| Plan 2 — Atlas pillar | ⏳ **starting now** |
| Plan 3 — Doctrine LMS pillar | ⏳ later |
| Plan 4 — Catechist pillar (Bible + Catechism ingestion + RAG) | ⏳ later |

The repo is healthy: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm seed:foundation` all pass on `0e16759`. `pnpm dev` boots cleanly.

---

## 1 · STEP ONE — answer 5 questions before writing anything

The user explicitly committed to Plan 2 (Atlas) but **has not yet answered five scoping questions**. Before invoking `superpowers:writing-plans` or doing any code work, ask these one at a time (or in a single multi-part question — the user has been moving fast). Multi-choice format preferred where possible. Don't proceed past this section until all 5 are answered.

### Q1 · Mapbox style

Sacred-friendly base map. Pick one:

- **A.** Muted dark navigation style — closer to Caravaggio shadow. Pins glow against ink-black landmasses. Best for the cinematic feel.
- **B.** Warm parchment-coloured "old map" style — vellum-toned, sepia rivers, subtle period engraving feel. Best for the manuscript-tradition motif. Requires a custom Mapbox style.
- **C.** Both, toggled by a small button on the globe — adds 30 min of build, more product surface for editors.

Recommend **A** by default; the parchment style is genuinely better lookwise but custom Mapbox styles cost editorial time the content team won't have for v1.0.

### Q2 · Pilgrimage mode pacing + audio

How long is a pilgrimage chapter? Audio?

- **A.** Short — 4–6 chapters, no audio. Pure visual scrolltelling, captions only.
- **B.** Medium — 6–10 chapters, optional text-to-speech narration the studio enables per chapter (cheap, robotic but functional).
- **C.** Long — 10+ chapters with real recorded audio (per-miracle), uploaded to the Reliquary. Heaviest commit; v1.0 ships with 1–2 sample recordings, content team adds the rest.

Recommend **A** for v1.0. Audio is meaningful but pilgrimage is already cinematically dense; content team can add narration in v1.1.

### Q3 · Sample miracles for the seed

The seed needs ~8–10 placeholder miracles, each marked `_isSample: true`, with deliberately fictional names so the content team knows to replace. Ask the user to list them, OR offer the user a generated default list and let them OK it. Sample shape:

```
1. "Eucharistic Miracle of Lanciano [Sample]"  · Eucharistic · approved · 700 AD · Lanciano, Italy
2. "Marian Apparition of Sample-Town [Sample]"  · Marian · worthy of belief · 1858 · Sample-Town
3. "Healing of Brother Placeholder [Sample]"  · Healing · under investigation · 1923 · Anywhere
4. "Stigmata of Saint Lorem [Sample]"  · Stigmata · recognised · 1224 · Ipsum Abbey
…
```

Mix types: at least 2 Eucharistic, 2 Marian, 2 Healing, 1 Stigmata, 1 Incorruptible, 1 Other. Mix ecclesial statuses. 3–4 marked `inPilgrimage: true` (for scrolltelling chapters) with `pilgrimageOrder` set.

If user defers to your judgment, generate a default list using deliberately fictional names that match the format above and confirm before seeding.

### Q4 · 3D "approach" cinematics on each pilgrimage chapter

Per the original brainstorm note: do you want a per-miracle short scroll-scrubbed image sequence as the user "arrives" at each pin? Like a mini manifesto-sequence inside each chapter?

- **A.** Yes — each miracle has 2–3 frames the editor can upload (the globe pans + zooms in, then the frames swap as the user keeps scrolling). Maximum cinematic feel. ~half a day extra.
- **B.** No — globe pan/zoom + caption + Reliquary image array carousel is enough. Lighter spec.

Recommend **B** for v1.0. The globe motion *is* the cinematic. Adding per-miracle sequences would mean the content team must produce 3 images × 4 chapters = 12 frames, on top of everything else. Defer to v1.1.

### Q5 · Build order — Atlas first or Catechist first?

User mentioned wanting Bible + Catechism ingested for the AI Catechist. That's Plan 4. Atlas is Plan 2 in the original spec but Plan 4 might serve them faster.

- **A.** Atlas first (this plan). The headline 3D moment. Locks in the cinematic vocabulary.
- **B.** Catechist first. Get the AI tool usable, even if the UI is plain. Atlas after.

Recommend **A** as originally agreed. Atlas establishes the visual language; Plan 4's epistolary UI borrows tonally from it. But ask — the user may have shifted priority.

### How to ask

Prefer one message containing all 5 questions with my recommendations highlighted. The user is in execute mode and will pick fast. Don't bring up the visual companion unless they push back on the Mapbox style choice — questions 2–5 are conceptual and best answered in terminal.

---

## 2 · STEP TWO — write Plan 2

Once all 5 questions are answered, invoke the `superpowers:writing-plans` skill. **Do NOT re-brainstorm** — the high-level brainstorm is already done and captured in the spec. Plan 2's job is task decomposition, not design exploration.

**Save plan to:** `docs/superpowers/plans/2026-05-05-tantum-ergo-atlas.md`

**Plan structure:** mirror Plan 1's shape ([docs/superpowers/plans/2026-05-04-tantum-ergo-foundation.md](../plans/2026-05-04-tantum-ergo-foundation.md) is the reference). Header → file structure → 25–35 bite-sized tasks → self-review notes.

Each task ends in a commit. No placeholders in the plan. Full code in every step.

After writing the plan, **show it to the user for approval** (per writing-plans skill flow). Do not begin execution until they say go.

---

## 3 · STEP THREE — execute via subagents

Once Plan 2 is approved, invoke `superpowers:subagent-driven-development`. Pattern from Plan 1 worked well: group ~3–6 logically-related tasks per subagent dispatch (rather than one subagent per task — the plan is prescriptive enough that grouping doesn't sacrifice quality).

After all groups complete, run final verification (typecheck + lint + build + smoke tests on `/atlas` and `/atlas/list`), then report back to user with the final commit SHA.

---

## 4 · Reference — Atlas design (already decided, do not redesign)

These are settled. Do **not** ask the user about them again unless you discover a contradiction.

### From the spec ([docs/superpowers/specs/2026-05-04-tantum-ergo-v1-design.md](../specs/2026-05-04-tantum-ergo-v1-design.md))

**§4.2 Atlas page design:**
- Two modes: **Explore** (default — free 3D Mapbox globe, drag, click pins, side drawer with miracle detail, bottom timeline scrub bar, filter chips for type + ecclesial status) and **Pilgrimage** (curated scroll-storytelling chapters of pre-flagged miracles).
- Mode toggle CTA on the page.
- Pin colour by type: Eucharistic = `rubric`, Marian = `lapis`, Healing = `gilt`, Other = `ink`.
- Detail drawer right-side on desktop, bottom-sheet on mobile.
- **Mobile:** pilgrimage-only as the default. Free-globe is desktop-only (≥`md`). Mobile gets a "View all miracles" CTA at the end of the pilgrimage that routes to `/atlas/list` (the keyboard-accessible catalogue, see §6.4).

**§5.2 Miracles collection schema** (this is the canonical schema — don't deviate):

| field | type | notes |
|---|---|---|
| `title` | text | required |
| `slug` | text | required, unique, indexed, sidebar |
| `type` | select | Eucharistic, Marian, Healing, Stigmata, Incorruptible, Other |
| `ecclesialStatus` | select | Approved, Recognised, Worthy of belief, Under investigation, Not constatat |
| `locationName` | text | "Lanciano, Italy" |
| `coordinates` | point | lat/lng |
| `yearOccurred` | number | year only |
| `dateApproximate` | boolean | renders "c. 700" if true |
| `approvalDate` | date | optional |
| `approvingAuthority` | text | "Bishop of Tours, 1574" |
| `summary` | textarea | 1–2 sentences, used in pin tooltip |
| `narrative` | richText | Lexical |
| `sources` | array | `{label, url, attribution}` |
| `artwork` | upload (multi) | rel to Media |
| `inPilgrimage` | boolean | sidebar |
| `pilgrimageOrder` | number | conditional on `inPilgrimage` |
| `_isSample` | boolean | admin |

Drafts + autosave (375 ms) + scheduled publish (mirror Articles). Live preview URL: `/atlas?focus={slug}` routed through `/next/preview?path=/atlas?focus={slug}&previewSecret=…`.

**§6.5 Tech additions for Plan 2:**

| Need | Package | Notes |
|---|---|---|
| Map | `mapbox-gl` + `react-map-gl` | Globe view via Mapbox's projection: 'globe' |

Env: `MAPBOX_ACCESS_TOKEN` already in `.env` and `.env.example`. User has the key.

### Conventions to reuse from Plan 1

- **`_isSample` flag** on every collection. Sample names use deliberately fictional placeholders ("Saint Placeholder of Sample-Town"). Show `[Sample]` chip in the UI when `Settings.showSampleBadges` is on.
- **`ChiRho` component** at `src/components/brand/chi-rho.tsx` — reuse for ornaments inside Atlas (e.g. between pilgrimage chapters).
- **`GildedRule` component** at `src/app/(frontend)/components/gilded-rule.tsx` — reuse between Atlas hero and globe / between explore mode and pilgrimage CTA.
- **`SectionReveal` + `RevealItem`** at `src/app/(frontend)/components/section-reveal.tsx` — for stagger reveals in the detail drawer + filter bar.
- **Live preview pipeline** via `/next/preview` route + `LivePreviewListener` — wire on `/atlas` page when `draftMode` is active so editors see Miracle drafts instantly.
- **Sacred palette** tokens (`bg-vellum`, `text-ink`, `text-rubric`, `text-gilt`, `text-lapis`) — already in Tailwind v4 `@theme`.
- **Seed pattern** idempotent `ensure*` helpers at `src/scripts/seed-foundation.ts` — `src/scripts/seed-atlas.ts` should mirror this. Add `seed:atlas` to `package.json` scripts.

### Existing `/atlas` placeholder to REPLACE

- `src/app/(frontend)/atlas/page.tsx` — currently renders the `<ComingSoon />` placeholder. Plan 2 replaces this entirely.

### NEW files Plan 2 will create

(Not exhaustive — your job to expand this in the plan.)

```
src/collections/Miracles.ts
src/app/(frontend)/atlas/page.tsx          (rewrite)
src/app/(frontend)/atlas/list/page.tsx     (NEW — mobile catalogue + a11y fallback)
src/app/(frontend)/components/atlas/
  globe.tsx                                (client — Mapbox GL JS + react-map-gl)
  pilgrimage.tsx                           (client — scroll-scrubbed chapters)
  miracle-drawer.tsx                       (client — side / bottom-sheet detail)
  timeline-scrub.tsx                       (client — bottom scrub bar)
  filter-chips.tsx                         (client — type + status filters)
  mode-toggle.tsx                          (client — explore ⇄ pilgrimage)
src/scripts/seed-atlas.ts                  (NEW — 8–10 sample miracles)
```

---

## 5 · Don't-break warnings (carry over from Plan 1 and prior work)

Read these before writing the plan and again before each subagent dispatch.

### 5a · Tantum schema, not payload

Raw application tables (rate_limits, source_chunks, media_chunks) live in `tantum.*`, **not** `payload.*`. If Plan 2 needs any new raw tables (it shouldn't — Miracles is a normal Payload collection), put them in `tantum`. See [project_runtime_gotchas.md](/home/ajojotank/.claude/projects/-home-ajojotank-Documents-Tantum-Ergo-webapp/memory/project_runtime_gotchas.md) entry #4.

### 5b · Drizzle push hangs on ambiguous schema changes

When you add a collection, Drizzle's dev-mode push creates the new tables silently — pure additions are safe. **But**: if you ever rename a field, OR delete a collection that other things reference, Drizzle will prompt interactively and deadlock the seed/build. Pattern: drop the orphan tables/enums/`_rels` columns via Supabase MCP `execute_sql` BEFORE booting Payload. See gotcha #8.

### 5c · Studio CSS — don't touch `--theme-elevation-*`

`src/app/(payload)/custom.scss` overrides only `--theme-success-*` (rubric accent) and brand strip. Do **not** override elevation tokens. Doing so cracks input contrast. Lessons from Phase A.

### 5d · Live preview wiring is delicate — don't refactor

`/next/preview` route handler + `RefreshRouteOnSave` + `draftMode().isEnabled` on each page is already wired and working as-you-type. When Plan 2 adds the `/atlas` page, follow the same pattern (read `draftMode` → query Miracles with `draft: isDraft` → mount `<LivePreviewListener />` when draft).

### 5e · Image hostnames

Mapbox tile URLs are not images going through `next/image`, so they're fine. But if Miracle artwork (Reliquary uploads) is rendered via `<Image>` and served from local Payload (`http://localhost:3000/api/media/file/...`), `localhost:3000` is already in `next.config.ts` `images.remotePatterns`. For Supabase-served URLs (the prior session wired `s3-storage` for prod), `**.supabase.co` is also already allowed. No new entries needed unless you introduce a new image host.

### 5f · Mobile-first is non-negotiable

Per [feedback_design_motion_dials.md](/home/ajojotank/.claude/projects/-home-ajojotank-Documents-Tantum-Ergo-webapp/memory/feedback_design_motion_dials.md): asymmetric desktop layouts collapse cleanly to single-column below `md`. The Atlas free-globe is desktop-only — mobile gets pilgrimage + `/atlas/list`. Plan 2 must spec the mobile fallback completely before any subagent touches code.

### 5g · Mapbox costs

Free tier: 50k map loads / month. Sufficient for v1.0 demo. If Plan 2 introduces something that blows past that (e.g. multiple map instances per page, autoplay rotation), flag it. Per spec §6.3.

### 5h · Don't break Plan 1

The home, /reading, /manifesto, /credits, the studio chrome, the email pipeline — all already work. Plan 2 should not touch any of those files except where strictly necessary (e.g. registering the Miracles collection in `src/payload.config.ts`).

---

## 6 · Skills to use, in order

1. **Don't re-invoke `superpowers:brainstorming`** — design is settled. Re-invoking will pad the conversation unnecessarily.
2. **`superpowers:writing-plans`** — for Plan 2 task decomposition + bite-sized steps with full code.
3. **`superpowers:subagent-driven-development`** — for execution. Group 3–6 tasks per subagent.
4. After all tasks complete and final verification passes, **`superpowers:finishing-a-development-branch`** — to handle the merge / PR question. Plan 1 didn't reach this step yet; Plan 2 might be the right time, or may defer until Plan 4 also ships.

---

## 7 · Closing message format for the user when done

After Plan 2 ships and `0e16759 → <new-sha>` is the chain of commits:

> Plan 2 (Atlas) done. Branch is at `<sha>`. Test: open `/atlas` on desktop — globe loads with N sample miracle pins, click a pin → drawer opens with detail, scrub the timeline. Open `/atlas` on mobile — pilgrimage scrolltelling. Bottom-of-page CTA → `/atlas/list` for the catalogue. Sample miracles are clearly `[Sample]`-marked; the content team replaces them via studio.
>
> Plan 3 (Doctrine LMS) is next, but you trigger it.

Don't open Plan 3 unsolicited. The user has been driving milestone-by-milestone; let them pace.
