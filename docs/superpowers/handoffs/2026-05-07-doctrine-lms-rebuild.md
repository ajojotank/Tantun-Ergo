# Tantum Ergo · Doctrine LMS — full rebuild handoff

> **For the next Claude session.** Memory at `MEMORY.md` is auto-loaded.
> Read this end-to-end before doing anything else. The prior conversation
> is full and was closed for context reasons.

---

## 0 · Why we're tearing it down

Plan 3 shipped a working Doctrine LMS — 22 commits across 6 phases, all gates
green, auth + progress + 18 sample units seeded. The user reviewed the live
result and called it out plainly:

> "It's still not correct, I want the full udemy experience… also very
> confusing as the admin to use to add stuff to the LMS and courses etc.
> Can we please look comprehensively and redesign it so that it is actually
> useful to the person and they can see stuff and is easy to use. I am not
> happy with the current design."

Two distinct problems:

**A — Learner-facing UX feels like an editorial site, not a course
platform.** The pages have the right vellum/Cormorant aesthetic but they
read as a magazine: big headlines, lots of whitespace, decorative plates,
no visible course spine. By the time the user has been signed in and
landed on a unit, they don't feel like they're "inside a course." The
late-stage redesign in `c8cde0e` added an outline sidebar, but it still
sits inside an editorial layout instead of replacing it. Density is wrong,
hierarchy is wrong, the "I'm taking a course" affordances are missing
(no per-section collapse, no resources tab, no "up next" tease, no
mark-complete affordance, no time estimate).

**B — Authoring it is painful.** The schema stores tracks, modules, and
units in three separate Payload collections joined by relationships. To
build a track, a content author opens DoctrineTracks → Create. Then
switches to DoctrineModules → Create New for each module, picks the track
from a dropdown. Then switches to DoctrineUnits → Create New for each
unit, picks the module from another dropdown. Three collections, three
sidebars, no sense of hierarchy in the studio. There is no way to see the
whole track at a glance, no drag-to-reorder, no "duplicate this module,"
no inline lecture editor. It does not match how anyone teaches a course.

Both problems trace to the same architectural choice: relationship-joined
collections. The fix is to model the curriculum as a tree, not as three
tables.

This handoff proposes the rebuild. The next session brainstorms with the
user, writes a fresh plan, and executes it.

---

## 1 · Current state at HEAD

**Branch:** `feat/foundation` at `c8cde0e`. Pushed to origin.
**Main:** at `61e7beb` (pre-Plan-3, will be ff'd to whatever ships).
**Health:** `pnpm typecheck && pnpm lint && pnpm build` all green.

### Recent commits (latest first)

- `c8cde0e` — `feat(doctrine): course-platform UX — outline sidebar, progress meter, prev/next folio`
- `cacdadf` — `fix(auth+doctrine): move initial-state constants out of 'use server' modules` (Next 16 forbids non-async exports; was crashing the unit page at runtime)
- `626272b` — `feat(doctrine): seed 3 tracks × 2 modules × 3 units`
- `0061d01` — `feat(account): /account page with profile, avatar upload, password change`
- `392ce9d` — `feat(account): avatar in header dropdown + mobile drawer; new Account link`
- `f2ec3f1` — `feat(account): avatar field on Members, depth-1 auth fetch, Avatar component`
- `4ca1980` — `feat(doctrine): auth-gate module page, resume banner on catalogue, last-read highlight`
- `3b46574` — `feat(doctrine): interactive lane switcher + mastery check with server-action persistence`
- `890a45b` — `feat(doctrine): unit player page + client (auth-gated, breadcrumb, lanes, folio footer)`
- `00268c0` — `feat(doctrine): LmsProgress collection + progress lib`
- `cd89077` — `feat(auth): forgot-password + reset-password flows`
- `f6d9c2b` — `feat(auth): sign-out route, header account menu, mobile drawer account block`
- `e057805` — `feat(auth): sign-up + email verification pages`
- `bd6cf96` — `feat(auth): sign-in page + server action`
- `e12dff9` — `feat(auth): register Members collection, regen types, add server auth helpers`
- `4d0e70a` — `feat(auth): add Members collection`
- `8d0a6cc` — `feat(doctrine): module overview page with unit folios`
- `c6cce9d` — `feat(doctrine): track overview page with cover plate + module folios`
- `96b7ede` — `feat(doctrine): replace coming-soon stub with track catalogue`
- `48e7ca3` — `feat(doctrine): register collections, regen types, add wire shapes + serialisers`
- `a2ffc91` — `feat(doctrine): add DoctrineUnits collection`
- `298c4a4` — `feat(doctrine): add DoctrineModules collection`
- `4e510dc` — `feat(doctrine): add DoctrineTracks collection`
- `1edbd4c` — `docs: implementation plan for Plan 3`

### What lives where (right now)

```
src/collections/
  DoctrineTracks.ts          # title, slug, summary, coverPlate, order, _isSample
  DoctrineModules.ts         # title, slug, summary, order, track→DoctrineTracks
  DoctrineUnits.ts           # title, slug, order, introduction (richText),
                             #   lanes.{reading,watchVideo,listenAudio},
                             #   masteryCheck.{prompt, options[]}
                             #   module→DoctrineModules
  Members.ts                 # email, password (Payload auth), displayName, avatar
  LmsProgress.ts             # member→Members, unit→DoctrineUnits,
                             #   masteryAnswer, masteryCorrect, lastVisitedAt

src/lib/
  auth.ts                    # getMember, requireMember, memberDisplayName, memberAvatarUrl
  doctrine-progress.ts       # findProgressForUnit, findMostRecentProgress,
                             #   touchProgress, saveMasteryAnswer
  doctrine-outline.ts        # getTrackOutline (combined fetcher), firstUnitHref

src/app/(frontend)/components/doctrine/
  types.ts                   # wire shapes (DoctrineTrackSummary etc.) + romanize helpers
  serialise.ts               # Payload-doc → wire-shape mappers
  track-plate.tsx            # catalogue card
  module-folio.tsx           # used on /[track]
  unit-folio.tsx             # used on /[track]/[module]
  unit-player.tsx            # the reading column (client; lanes, mastery, prev/next footer)
  lane-switcher.tsx          # tablist for Read·Watch·Listen
  mastery-check.tsx          # MCQ form with server action
  resume-banner.tsx          # gilt-bordered "continue where you left off" on catalogue
  doctrine-outline.tsx       # course-tree component (NEW — c8cde0e)
  mobile-outline.tsx         # <details> wrapper for mobile (NEW — c8cde0e)
  progress-meter.tsx         # thin gilt progress bar (NEW — c8cde0e)

src/app/(frontend)/components/account/
  auth-shell.tsx, avatar.tsx, header-account-menu.tsx

src/app/(frontend)/account/
  signin/, signup/, verify-email/, sign-out/, forgot-password/, reset-password/, page.tsx (profile), forms.tsx, actions.ts

src/app/(frontend)/doctrine/
  page.tsx                                # catalogue (3 plates)
  [track]/page.tsx                        # course landing (cover + outline)
  [track]/[module]/page.tsx               # focused module (sidebar + units)
  [track]/[module]/[unit]/page.tsx        # unit player (sidebar + reading)
  [track]/[module]/[unit]/actions.ts      # saveMasteryAction

src/scripts/seed-doctrine.ts              # 3 × 2 × 3 = 18 units, idempotent
```

### What works (don't tear down)

- **Auth foundation.** Members collection + Payload built-in auth + sign-in/up/verify/forgot/reset flows + the `/account` page + avatar handling. Solid; keep.
- **Site chrome.** SiteHeader split into server/client, account dropdown with avatar circle + Account link, mobile drawer. Keep.
- **Catalogue page** at `/doctrine` (the three plates) is OK as a "shop window" — light rework only (better preview of what's inside each track).
- **`getTrackOutline()`** in `src/lib/doctrine-outline.ts` is a good shape — once units move into the track, this helper rewrites trivially.
- **Atlas pillar.** Untouched throughout. Don't touch in the rebuild.

### What's broken or wrong

- **Three collections for one curriculum.** Authoring a single course requires navigating between DoctrineTracks, DoctrineModules, DoctrineUnits with manual relationship picking. No tree, no drag reorder, no inline editing.
- **Editorial layout on every learner page.** Even the unit player feels like a magazine article — lots of whitespace, single column, no persistent course chrome. The sidebar added in `c8cde0e` helps but it's docked next to an editorial layout, not anchoring a course shell.
- **No "course feel" cues.** No collapsible sections in the sidebar, no auto-mark-complete, no "up next" preview, no time-to-complete estimate, no Notes / Resources tabs, no jump-to-section from inside the player.
- **Density too low.** The track page shows three modules per screen on a laptop and forces a click + a click to see actual reading material. Udemy shows the entire curriculum at a glance.
- **No drafts strategy that matches reality.** Currently each unit has its own draft state. In practice instructors publish whole courses, not individual lectures.

---

## 2 · Proposed architecture pivot

**Replace the three-collection model with a single `DoctrineCourses`
collection that holds the whole curriculum tree as nested arrays.**

```
DoctrineCourses (renamed from DoctrineTracks; or keep "tracks" if user prefers)
├── title, slug, summary, coverPlate, order, _isSample
├── instructor (text or relationship to Members?)        ← see open question
├── tagline, longDescription (richText)                  ← course landing page copy
├── modules[]  (array)
│   ├── title, slug (unique within course), summary, _isSample
│   └── units[]  (array)
│       ├── title, slug (unique within module)
│       ├── estimatedMinutes (number)                    ← used for "X min" labels
│       ├── introduction (richText)
│       ├── lanes
│       │   ├── reading (richText)
│       │   ├── watchVideo (upload → Media)
│       │   └── listenAudio (upload → Media)
│       ├── resources[] (array)                          ← downloadable files / external links
│       │   ├── label, url? (text), file? (upload → Media)
│       └── masteryCheck (group)
│           ├── prompt (text)
│           └── options[] (array of {text, isCorrect, affirmation})
```

**Why this is right:**

- A single Studio screen for the whole course. The author sees Track Title
  at the top, then an array of Modules expanded as accordion sections,
  each containing an array of Units expanded as inline editable cards.
  Drag-to-reorder is built into Payload's array fields. Add Module / Add
  Unit are inline buttons. No more switching between sidebars.
- Drafts are course-level (which matches teaching reality).
- Live preview shows the whole course in context.
- One DB query loads the entire tree.
- Hierarchy is enforced by the schema, not by remembering to set
  relationships.

**Key migration concerns:**

1. **`LmsProgress` keying.** Currently `unit` is a relationship to
   DoctrineUnits. Once units are array items, they don't have stable
   document IDs (Payload assigns synthetic `row.id`s but these can churn
   on edits). Solution: change `LmsProgress.unitPath` to a TEXT field with
   the format `{courseSlug}/{moduleSlug}/{unitSlug}`. Add a unique index
   on `(member, unitPath)`. Slug stability is enforced by adding a
   `validate` to the Slug fields that prevents renaming once any progress
   row exists for it (or accept that renames orphan progress and let
   the content team handle it).

2. **The seed.** The existing `seed-doctrine.ts` writes to three
   collections. Rewrite to write a single nested `DoctrineCourses`
   document per course. Keeps the same 3 × 2 × 3 = 18 unit content.

3. **Slug uniqueness within array.** Payload doesn't enforce unique-
   within-array natively. Add a `validate` hook on the unit `slug` field
   that checks the parent array for duplicates. Ditto modules. Frontend
   resolves by walking the tree, so duplicates would 404 the duplicate.

4. **Existing data.** The 18-unit seed and any user data created during
   testing will have to be re-seeded. That's fine for v1 (no production
   data yet).

**What stays:**

- `Members` collection unchanged.
- `LmsProgress` collection schema — rename the field but keep the
  collection.
- The Atlas pillar is untouched.
- Auth flows untouched.

---

## 3 · Frontend redesign — Udemy-coded, breviary-styled

The aesthetic stays vellum / ink / Cormorant Garamond. The structure
becomes course-platform.

### Three surfaces, three jobs:

1. **`/doctrine` (catalogue)** — Browse courses. Each course card shows
   cover, title, tagline, module count, total minutes, "X enrolled" if
   we add that, "Begin / Continue" CTA. Density: 2 columns on tablet,
   3 on desktop. Each card previews the first 1–2 modules as small text
   underneath the title (so you don't need to click to see what's in it).
   Resume banner across the top for signed-in members with progress.

2. **`/doctrine/[course]` (course landing page)** — Full Udemy-style
   landing. Hero with cover, title, tagline, instructor, total time,
   module count, completion percentage (if signed in). "Begin reading" /
   "Continue reading" CTA. Below: full curriculum outline (every module
   expanded by default, every unit listed with completion glyph + lane
   chips + estimated minutes). A `<longDescription>` block sits beside
   the outline (sticky on desktop). Optional: "What you'll learn" bullet
   list pulled from a `learnPoints[]` field.

3. **`/doctrine/[course]/[module]/[unit]` (the player)** — The actual
   course-taking experience. This is where the redesign matters most.

   **Layout (desktop ≥1024px):**

   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  ← Course title              Folio iii of vii    Progress N% │   ← sticky course chrome
   ├─────────────────┬───────────────────────────────────────────┤
   │                 │                                           │
   │  Course outline │   Reading / Watch / Listen tab strip      │
   │  ─────────────  │                                           │
   │  ▼ Module I     │   ┌─────────────────────────────────────┐ │
   │   ✓ folio i.    │   │                                     │ │
   │   ⊙ folio ii.   │   │      Lane content here              │ │   ← player main area
   │   ○ folio iii.  │   │      (reading body / video /        │ │
   │  ▶ Module II    │   │       audio)                        │ │
   │     (collapsed) │   │                                     │ │
   │  ▶ Module III   │   └─────────────────────────────────────┘ │
   │                 │                                           │
   │                 │   ── Mastery check (Do you remember?) ──  │
   │                 │                                           │
   │                 │   ── Resources: 2 files, 1 link ──        │
   │                 │                                           │
   │                 │   ┌──────────┬────────────┬──────────┐    │
   │                 │   │ ← Prev    │ Mark done   │ Next →  │    │   ← persistent footer
   │                 │   └──────────┴────────────┴──────────┘    │
   └─────────────────┴───────────────────────────────────────────┘
   ```

   - **Sticky course chrome at top** (1 row, ~52px) — back to course landing,
     folio counter, overall progress %. Stays put as user scrolls.
   - **Sidebar (~280–320px)** — Sections collapsible. Current module's
     section auto-expanded. Other modules collapsed but click to expand.
     Status glyph at start of each unit row: ✓ complete (gilt fill),
     ⊙ current (gilt ring), ○ not-started (thin ink-soft ring).
     Lecture-type icon next to title (📖 Read, ▶ Watch, 🎧 Listen) —
     except in our aesthetic these are mono-text glyphs not emoji.
   - **Player main area** — content max-width 65ch for reading,
     16:9 aspect for watch lane, full-width for listen lane. No more
     editorial tracking-tighter-leading-none headlines stacked over the
     reading text. The unit title sits in a tight header band, not as an
     editorial display.
   - **Mark-complete affordance.** Big button after the lane content:
     "✓ Mark folio complete" (or auto-complete on lane-end events:
     scrolled to bottom of reading, video ended, audio ended). Updates
     `LmsProgress` server-side and refreshes the sidebar checkmark
     immediately via revalidate.
   - **Resources block** — when a unit has uploads/links in the new
     `resources[]` array, render them as a small list with download/link
     icons.
   - **Mastery check** stays where it is, after lane content, before the
     footer nav. Keep the gentle one-line affirmation.
   - **Persistent footer** — Prev / Mark done / Next, always visible.
     "Mark done" duplicates the mark-complete button above; redundancy is
     fine — Udemy does it.

   **Layout (mobile <1024px):**

   - Sticky chrome at top with hamburger that opens the outline as a
     full-screen drawer.
   - Player content full-width below.
   - Footer nav as a sticky bottom bar.

### Pages we can drop

- **`/doctrine/[course]/[module]` (module overview).** With the
  curriculum outline always visible on the course landing page and in
  the player sidebar, the module page adds nothing. Navigation flow:
  catalogue → course landing → unit player. The module page becomes a
  redirect (`/doctrine/[course]/[module]` → first unit in module, or
  `/doctrine/[course]#module-{slug}` anchor on the course page).

### Components to keep mostly-as-is

- `<LaneSwitcher>` (tablist) — works.
- `<MasteryCheck>` — works.
- `<Avatar>` — works.

### Components to rebuild

- All three doctrine pages (catalogue, course landing, unit player).
- `<DoctrineOutline>` — repurpose for collapsible sections.
- `<UnitPlayer>` — strip the editorial header, add sticky chrome above,
  add Mark Complete, add Resources slot.
- `seed-doctrine.ts` — single-document writes per course.

---

## 4 · Open scope questions for the next brainstorm

These need user answers before writing the plan:

1. **Naming.** Is `DoctrineCourses` the right name (we've been using
   "tracks" so far, which is more breviary-coded). Options:
   - Keep `DoctrineTracks` slug, change frontend label to "Course."
   - Rename to `DoctrineCourses` everywhere (cleanest, but disruptive).
   - Use a neutral name like `Curriculum`.

2. **Instructor field.** Single text field? Relationship to Members
   (in case we later let stewards co-author)? Skip for v1?

3. **Estimated minutes per unit.** Just a number authors fill in, or
   computed (words/200 wpm for reading, video duration for watch, audio
   duration for listen)? Computed is hard for v1 (Mux-style metadata not
   set up). User to confirm: manual `estimatedMinutes: number` per unit.

4. **Mark-complete behavior.** Three options:
   - (a) Manual only — user clicks "Mark folio complete" button.
   - (b) Auto-complete on lane-end event (video ended, scroll to bottom
     of reading) — feels more Udemy.
   - (c) Both: auto-complete fires, but a manual "Mark complete" button
     also exists for users who skim.
   Recommend (c).

5. **Resources field.** Add it now or punt to v1.5?

6. **`What you'll learn` bullets.** Same — add now or v1.5?

7. **Drag reorder in studio.** Payload's array field has it built-in for
   array items but not across array bounds. We get free per-array
   reorder but not "move this unit to a different module." Acceptable
   for v1 (cut/paste in the JSON view is the workaround), or
   deal-breaker?

8. **Existing 18-unit seed content.** Re-seed verbatim into the new
   schema? Yes (default).

9. **LmsProgress migration.** No production data yet, so just drop +
   re-create the table on next migration. Confirm.

10. **Module page redirect.** OK to redirect `/doctrine/[course]/[module]`
    to the first unit in that module? (Shorter URL is nicer, but breaks
    a clean drill-down. Recommend: redirect, with the course landing
    page as the canonical "zoom out" target.)

---

## 5 · Phase sketch (for the new plan)

The next session's `superpowers:writing-plans` should turn this into a
real plan. Rough decomposition:

**Phase A — Schema pivot**
- A1. New `DoctrineCourses` collection (everything embedded). Keep
  `DoctrineTracks/Modules/Units` registered for now (parallel) so
  nothing breaks during the cutover.
- A2. New `LmsProgress.unitPath` field (text). Migration of existing
  rows is moot (test data only).
- A3. Helpers: `getCourse(slug)`, `findUnitInCourse(course, modSlug, unitSlug)`,
  `flattenCourse(course)` (returns the ordered unit list).
- A4. Wire shapes + serialisers for the new model.

**Phase B — Seed**
- B1. Rewrite `seed-doctrine.ts` to write whole-course documents.
- B2. Remove the old `DoctrineTracks/Modules/Units` collections and the
  old seed (after the new pages are wired). Drop the old tables.

**Phase C — Course landing page**
- C1. New `/doctrine/[course]/page.tsx` with hero + outline.
- C2. Update `/doctrine/page.tsx` catalogue with denser cards + module
  preview.
- C3. Resume banner enhancements.

**Phase D — Unit player**
- D1. Sticky course chrome component.
- D2. Collapsible sidebar outline.
- D3. New unit player layout (drop the editorial header).
- D4. Mark-complete server action + auto-complete events.
- D5. Resources block (if scoped in).
- D6. Footer nav (Prev / Mark / Next).

**Phase E — Studio polish**
- E1. Maybe: a simple Payload custom view at the course-edit screen that
  re-orders the field rendering for clarity (Payload allows this via
  `admin.components.views.Edit.Default`). Optional.
- E2. Per-row `validate` for unit/module slug uniqueness within the
  parent array.
- E3. Studio QA pass with the user.

**Phase F — Cleanup**
- F1. Delete `DoctrineTracks`, `DoctrineModules`, `DoctrineUnits`
  collection files.
- F2. Delete old route files (`/doctrine/[track]/[module]/page.tsx`).
- F3. Delete `module-folio.tsx`, `unit-folio.tsx` if unused.
- F4. Final verification gate.

Roughly 20–25 tasks across 6 phases. Same shape as Plan 3 was, but the
scope is meaningfully different so it gets a fresh plan.

---

## 6 · Don't-break warnings

- **Atlas pillar** (`/atlas`, `/atlas/list`, `/atlas/pilgrimages`,
  `/atlas/pilgrimages/[slug]`, all `src/collections/Miracles.ts` /
  `Pilgrimages.ts` / studio coordinate-picker / `seed-atlas.ts` /
  `seed-pilgrimages.ts` / `src/app/(frontend)/components/atlas/*`) is
  untouched and must stay that way.
- **Members + auth** (Members collection, `src/lib/auth.ts`, all
  `/account/**` routes, `<Avatar>`, header account menu, mobile drawer
  account block) — keep as-is. The course rebuild reuses these.
- **Pillar pages** (`/`, `/reading`, `/manifesto`, `/credits`) untouched.
- **Site chrome** (SiteHeader server/client split, MobileDrawer,
  ScrollRubric, Wordmark) untouched.
- **Catechist stub** (`/catechist`) — Plan 4 territory, leave alone.

---

## 7 · The bug-fix already in place

The unit page was crashing with `Error: A "use server" file can only
export async functions, found object` (E352 in the user's screenshot).
Caused by `INITIAL_MASTERY` and similar constants exported from
`'use server'` modules. Fixed in `cacdadf` — the constants now live in
their consuming client components. **Don't re-introduce the pattern.**
Rule: a `'use server'` module exports only async functions and types.

---

## 8 · Skills to use, in order

1. Read this handoff end-to-end (you're doing it).
2. Read MEMORY.md (auto-loaded).
3. **`superpowers:brainstorming`** — work through the 10 open questions
   in §4 with the user. Don't skip this; the wrong answer to question 1
   (naming) cascades into 30 file renames.
4. **`superpowers:writing-plans`** — save plan to
   `docs/superpowers/plans/2026-05-08-doctrine-rebuild.md` (or whatever
   today's date is in the next session). Mirror the Plan 3 shape.
5. **`superpowers:subagent-driven-development`** — execute the plan
   task-by-task with two-stage review (spec + code quality). Same
   pattern as Plan 3 ran. Group ~3-4 tasks per dispatch.
6. After all tasks land and final verification passes, hand back. Don't
   auto-trigger Plan 4 (Catechist).

---

## 9 · One last thing

The user wants this to feel **like a real course platform, themed in our
aesthetic** — not a magazine that happens to have units. The breviary
visuals should serve the course-platform structure, not replace it.
When in doubt, copy Udemy / Coursera structure first, then re-skin.
That's the explicit user direction.
