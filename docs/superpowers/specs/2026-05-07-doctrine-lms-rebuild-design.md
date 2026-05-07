# Doctrine LMS — full rebuild design spec

**Date:** 2026-05-07
**Status:** Approved (brainstorm complete)
**Supersedes:** Plan 3 (shipped at `c8cde0e`, learner-facing UX rejected by user)
**Predecessor read:** `docs/superpowers/handoffs/2026-05-07-doctrine-lms-rebuild.md`

---

## 1 · Why this rebuild

Plan 3 shipped a working Doctrine LMS, but the user reviewed it and rejected
two distinct things:

1. **The learner UX feels editorial, not course-platform.** The pages have
   the right vellum / Cormorant aesthetic but read as a magazine. There's
   no visible course spine, no "I'm inside a course" affordances, density
   is wrong.
2. **The studio is painful to author in.** Tracks, modules, and units live
   in three relationship-joined collections. To build a single course an
   author switches between three sidebars and manually picks parents
   from dropdowns. There's no tree, no drag, no inline editing.

Both problems trace to the same architectural choice — relationship-joined
collections — and the fix is to model the curriculum as a tree, not as
three tables.

This spec defines the rebuild.

---

## 2 · Scope

### In scope
- New `DoctrineCourses` collection that holds the entire curriculum tree as
  nested arrays.
- Drop `DoctrineTracks`, `DoctrineModules`, `DoctrineUnits` collections at
  the end of the rebuild.
- Modified `LmsProgress` keyed on `unitPath` text instead of unit
  relationship.
- Role-based access control on `Members` (`admin` / `instructor` /
  `learner`) with studio-sidebar scoping.
- Frontend rebuild of all three doctrine surfaces: catalogue, course
  landing, unit player.
- Rich-media seed (3 sample courses with bundled video / audio / PDFs).
- One-shot `pnpm admin:promote <email>` script for bootstrapping admins.

### Out of scope (untouched by this rebuild)
- Atlas pillar (`/atlas/**`, `Miracles`, `Pilgrimages`, all related
  components and seeds).
- Auth foundation (`Members` collection schema apart from the new `roles`
  field, sign-in / sign-up / verify / forgot / reset flows, `/account/**`,
  `<Avatar>`, `<HeaderAccountMenu>`, mobile drawer).
- Pillar pages (`/`, `/reading`, `/manifesto`, `/credits`).
- Site chrome (`SiteHeader`, `MobileDrawer`, `ScrollRubric`, `Wordmark`).
- Catechist stub (`/catechist`) — Plan 4 territory.

---

## 3 · Architectural decision

**Approved: Single nested `DoctrineCourses` collection with arrays of
modules, each containing arrays of units.**

Why this and not the alternatives:
- **Three collections + a custom tree component.** Worst-of-both: keeps
  the relational complexity, requires fighting Payload internals to build
  a tree UI, drafts still publish per-unit (wrong unit-of-work for
  instruction), and `LmsProgress` relationships still need re-keying.
- **Two collections (Course + Unit, module as a group field on Unit).**
  Re-introduces the studio split — units appear in their own sidebar,
  authors still pick a parent course from a dropdown.
- **Single nested (chosen).** One Studio screen for the whole course.
  Drafts publish at the course level. Per-array drag-reorder is free.
  One DB query loads the whole tree. Hierarchy enforced by the schema.

Trade-off accepted: cross-array drag (moving a unit from Module I to
Module II) is not free — the JSON edit view is the workaround. Documented
and accepted (Q7).

---

## 4 · Data model

### 4.1 · `Members.roles` (new field, additive)

```ts
{
  name: 'roles',
  type: 'select',
  hasMany: true,
  options: ['admin', 'instructor', 'learner'],
  defaultValue: ['learner'],
  saveToJWT: true,
  access: {
    update: ({ req: { user } }) => user?.roles?.includes('admin') ?? false,
  },
}
```

- New sign-ups receive `['learner']`.
- `saveToJWT` is required so per-collection access functions can read the
  role from `req.user.roles` without a database round-trip.
- Field-level update access restricted to admins, so a user editing their
  own profile cannot grant themselves admin.

All other `Members` fields (email, password, displayName, avatar) stay
untouched.

### 4.2 · `DoctrineCourses` (new collection)

```ts
slug: 'doctrineCourses'
admin: { useAsTitle: 'title', defaultColumns: ['title', 'instructors', 'order', '_status'] }
versions: { drafts: true }    // course-level drafts (Q replaces per-unit drafts)

fields:
  title: text (required)
  slug: text (required, unique, indexed)
  tagline: text                                 // hero subtitle on landing page
  summary: text                                 // one-line for catalogue card
  longDescription: richText                     // landing page body prose
  coverPlate: upload → media
  order: number (default 0)
  _isSample: checkbox (default false, sidebar)

  instructors: relationship → members
    hasMany: true
    filterOptions: members where 'instructor' in roles

  learnPoints: array of { point: text }         // "What you'll learn" bullets

  modules: array (minRows: 1) of:
    title: text (required)
    slug: text (required, validated unique-within-course)
    summary: text
    _isSample: checkbox

    units: array (minRows: 1) of:
      title: text (required)
      slug: text (required, validated unique-within-module)
      estimatedMinutes: number (required, default 5)
      introduction: richText

      lanes: group of:
        reading: richText
        watchVideo: upload → media
        listenAudio: upload → media

      resources: array of:
        label: text (required)
        description: text
        kind: select (required) of [download, link, citation]
        file: upload → media         (when kind === download)
        url: text                    (when kind === link)
        citation: text               (when kind === citation, required)
        citationUrl: text            (when kind === citation, optional)

      masteryCheck: group of:
        prompt: text
        options: array of:
          text: text (required)
          isCorrect: checkbox
          affirmation: text

hooks:
  beforeChange:
    - autoAttributeInstructorOnCreate
        // when operation === 'create' and req.user has 'instructor' role
        // but not 'admin', push req.user.id into doc.instructors
```

Slug uniqueness within array is enforced by `validate` functions on the
module and unit `slug` fields. The validator walks the parent array and
rejects duplicates.

Slug renames are permitted. A rename of a course / module / unit slug
orphans any existing `LmsProgress` rows keyed on the old `unitPath`.
Acceptable for v1 since there is no production data; the content team
can be advised post-launch that slug renames lose progress.

### 4.3 · `LmsProgress` (modified — drop and recreate per Q9)

```ts
slug: 'lmsProgress'
fields:
  member: relationship → members (required, indexed)
  unitPath: text (required, indexed)            // {courseSlug}/{moduleSlug}/{unitSlug}
  masteryAnswer: text
  masteryCorrect: checkbox
  completedAt: date                              // null until marked complete
  lastVisitedAt: date

indexes:
  - fields: [member, unitPath], unique: true
```

- The current `unit: relationship → DoctrineUnits` field is removed.
  Existing rows (test data only) are dropped via Drizzle migration.
- `completedAt` is the new "is this unit done" signal. Set by:
  - manual click on Mark Complete button (footer or above-footer)
  - lane-end auto-complete event (scroll-to-bottom of reading,
    `<video>.ended`, `<audio>.ended`)
  - mastery-correct submission
- All three paths POST to the same idempotent server action; re-firing
  does not overwrite `completedAt` if already set.

---

## 5 · Access control

### 5.1 · Per-role permissions matrix

| Collection            | admin    | instructor                                    | learner            |
|-----------------------|----------|-----------------------------------------------|--------------------|
| `DoctrineCourses` read | all      | published + own drafts                        | published only     |
| `DoctrineCourses` create | yes      | yes (auto-attributed to self via hook)         | no                 |
| `DoctrineCourses` update | yes      | only when `req.user.id` is in `instructors[]`  | no                 |
| `DoctrineCourses` delete | yes      | no (must unpublish instead)                    | no                 |
| `Miracles`, `Pilgrimages`, `Members` | full | hidden in studio                              | hidden in studio   |
| `Media`                | full     | full (needed for video / audio / PDF uploads)  | hidden in studio   |
| `LmsProgress` read     | all      | none                                           | own rows           |
| `LmsProgress` write    | yes      | none                                           | server-action only |

### 5.2 · Studio sidebar visibility

Apply to `Miracles`, `Pilgrimages`, `Members`, `LmsProgress`:

```ts
admin: { hidden: ({ user }) => !user?.roles?.includes('admin') }
```

Do NOT apply to `DoctrineCourses` (instructors need it) or `Media`
(instructors need uploads).

### 5.3 · Bootstrap

There is no UI to grant the first admin role to yourself. Use the
one-shot CLI:

```bash
pnpm admin:promote you@example.com
```

- Lives at `src/scripts/promote-admin.ts`.
- Idempotent — re-running on an already-admin email is a no-op.
- Run once per environment (local, staging, prod).
- Rejected alternative: `INITIAL_ADMIN_EMAIL` env-var auto-promotion at
  boot. A typo'd env-var silently fails to promote anyone, and we'd run
  the promotion logic on every dev start.

### 5.4 · Server-action writes

Server actions that write `LmsProgress` (mark complete, save mastery)
use Payload's local API with `overrideAccess: true`. The matrix-defined
access functions stay in place as a safety net for any future
REST/GraphQL caller.

---

## 6 · Routes + redirects

### 6.1 · Final route map

```
/doctrine                                    catalogue (redesigned)
/doctrine/[course]                           Udemy-style landing (rebuilt)
/doctrine/[course]/[module]                  → 301 to /doctrine/[course]#module-{slug}
/doctrine/[course]/[module]/[unit]           player (rebuilt)
/doctrine/[course]/[module]/[unit]/actions   server actions (mark complete, save mastery)
```

### 6.2 · Folder rename

`src/app/(frontend)/doctrine/[track]/...` → `src/app/(frontend)/doctrine/[course]/...`

The old `[track]` directory is deleted in cleanup phase F.

### 6.3 · Module redirect (Q10)

`/doctrine/[course]/[module]/page.tsx` is a thin server-component file
that returns `redirect(\`/doctrine/${course}#module-${module}\`)` using
Next 16's `redirect()` helper. Status 301.

---

## 7 · Frontend redesign

The aesthetic stays vellum / ink / Cormorant Garamond. The structure
becomes course-platform. Three surfaces, three jobs.

### 7.1 · Catalogue (`/doctrine`)

- **Resume banner** at top (gilt-bordered) when signed-in member has
  any `lastVisitedAt`. Links into the most-recent unit.
- **Grid:** 1 column mobile / 2 tablet / 3 desktop. Denser than current.
- **Each card:**
  - cover plate (16:10)
  - title, tagline (1 line)
  - meta row: `instructor · N modules · ~Xm`
  - 2-line preview listing first 2 module titles
  - progress bar + percentage when signed in and progress exists
  - CTA: "Begin reading" or "Continue" (when progress > 0)

### 7.2 · Course landing (`/doctrine/[course]`) — fully rebuilt

```
┌────────────────────────────────────────────────────────────────┐
│  [cover plate]   Course title                                   │
│   16:10 art       Tagline                                       │
│                   instructor · N modules · ~Xm · NN% complete   │
│                   [Begin reading / Continue reading]            │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │ ABOUT THIS COURSE    │    │  CURRICULUM                  │  │
│  │ longDescription rich │    │  ▼ Module I — Title          │  │
│  │ prose (sticky on     │    │    ✓ folio i.  ~5m  glyphs   │  │
│  │ desktop scroll)      │    │    ⊙ folio ii. ~8m  glyphs   │  │
│  │                      │    │    ○ folio iii.~6m  glyphs   │  │
│  │ WHAT YOU'LL LEARN    │    │  ▼ Module II — Title         │  │
│  │ ✓ learnPoint 1       │    │    ○ folio i.  ~7m  glyphs   │  │
│  │ ✓ learnPoint 2       │    │  ▼ Module III ...            │  │
│  └──────────────────────┘    └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

- All modules expanded by default (this *is* the curriculum view).
- Status glyphs: ✓ done · ⊙ in progress · ○ not started.
- Lane glyphs: monochrome text-style (e.g. small caps `R · W · L` or
  unicode breviary marks). No emoji — clashes with Cormorant Garamond.
- Instructor rendering when `hasMany`: 1 → "Fr. Lyle"; 2 → "Fr. Lyle &
  Sr. Bernadette"; 3+ → "Fr. Lyle and N others". Same rule on catalogue
  card meta row.
- Each unit row links directly into the player; no module page.
- Mobile stacks single-column with About above Curriculum.
- Hash anchor `#module-{slug}` scrolls to the module heading; used by
  the redirect from old module URLs.

### 7.3 · Unit player (`/doctrine/[course]/[module]/[unit]`) — fully rebuilt

#### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Course title           Folio iii of vii    Progress 28%        │   sticky chrome 52px
├────────────────────┬─────────────────────────────────────────────┤
│  CURRICULUM        │  Unit Title (tight, not editorial)          │
│ ───────────────    │  Read · Watch · Listen   [tab strip]        │
│ ▼ Module I         │  ┌─────────────────────────────────────┐    │
│   ✓ folio i.       │  │  Lane content (max 65ch reading,    │    │
│   ⊙ folio ii.      │  │  16:9 video, full-width audio)      │    │
│   ○ folio iii.     │  └─────────────────────────────────────┘    │
│ ▶ Module II        │  ── Mastery check ──                        │
│ ▶ Module III       │  ── References (resources block) ──         │
│ progress meter     │  ┌────────┬───────────────┬─────────┐       │
│ ▰▰▰▱▱ 28%          │  │ ← Prev │ ✓ Mark folio  │ Next →  │       │
│                    │  └────────┴───────────────┴─────────┘       │
└────────────────────┴─────────────────────────────────────────────┘
   ~300px sidebar           main content area
```

- Sticky course chrome at top (back to course landing, folio counter,
  overall progress %).
- Sidebar: current module auto-expanded, others collapsed; click a
  heading to expand. State per-page-load, not persisted.
- Strip the editorial display header from current player (no more
  `tracking-tighter leading-none` over the reading body).
- Mark Complete: a button in the footer **and** above the footer, both
  posting to the same idempotent server action (Q4 — both auto and
  manual triggers).
- Resources block renders between mastery check and footer when unit
  has any resources.

#### Mobile (<1024px)

- Sticky chrome at top with hamburger that opens the outline as a
  full-screen drawer.
- Player content full-width.
- Sticky bottom bar: ← Prev | ✓ Done | Next →

### 7.4 · Components

| Component | Disposition |
|---|---|
| `<Avatar>`, `<LaneSwitcher>`, `<MasteryCheck>` | keep |
| `<DoctrineOutline>` | rebuild as collapsible-by-module |
| `<UnitPlayer>` | rebuild without editorial header |
| `<CourseChrome>` (sticky top bar) | new |
| `<CourseHero>` (landing hero) | new |
| `<CourseCurriculum>` (landing outline) | new |
| `<ResourcesBlock>` | new |
| `<LearnPoints>` | new |
| `<MarkCompleteButton>` | new |
| `<ProgressMeter>` | keep, light tweak for sidebar use |
| `<UnitFolio>`, `<ModuleFolio>` | drop |

---

## 8 · Helpers + serializers

New helpers in `src/lib/doctrine.ts` (replaces `src/lib/doctrine-outline.ts`):

```ts
getCourse(slug: string): Promise<Course | null>          // depth-2 fetch
getCourseList(): Promise<CourseSummary[]>                 // catalogue
findUnitInCourse(course, modSlug, unitSlug): { module, unit, indexInCourse, totalUnits }
flattenCourse(course): UnitWithPath[]                     // ordered list with unitPath strings
firstUnitHref(course): string                             // for "Begin reading" CTA

// progress
findProgressForMember(memberId): Progress[]
findProgressForUnit(memberId, unitPath): Progress | null
findMostRecentProgress(memberId): Progress | null         // for resume banner
touchProgress(memberId, unitPath): void                   // sets lastVisitedAt
markComplete(memberId, unitPath): void                    // sets completedAt (idempotent)
saveMasteryAnswer(memberId, unitPath, answer, isCorrect): void
```

Wire shapes (`src/app/(frontend)/components/doctrine/types.ts`) replace
the current Track/Module/Unit shapes with `Course / Module / Unit` shapes
that mirror the schema. Romanize helpers for folio numerals are kept.

`src/app/(frontend)/components/doctrine/serialise.ts` reduces to a single
`serialiseCourse(payloadDoc)` function.

---

## 9 · Seed plan

### 9.1 · Bundled media

Four small public-domain assets in `src/scripts/seed-assets/`, sourced
from Wikimedia Commons / archive.org with public-domain or CC0 licenses:

- 1 short Gregorian chant MP3 (~500KB)
- 1 short Catholic-themed MP4 clip (~3MB)
- 2 PDFs: a CCC excerpt one-pager + a generic prayer-card handout

Total repo bloat: ~5–10MB. License attribution recorded in
`src/scripts/seed-assets/LICENSES.md`.

### 9.2 · Seed content

Re-seed the same 3 courses × 2 modules × 3 units = 18 units from the
current seed, with verbatim existing prose. Plus the new fields:

- 4–6 real `learnPoints` per course
- `estimatedMinutes` set realistically per unit (5–12m range)
- `instructors` left empty in seed (admin assigns post-seed)
- At least one media-rich unit per course exercising each lane
- `resources` mixed across kinds: every course has at least one
  `download`, one `link` (Vatican.va URL), one `citation` (CCC paragraph)
- `_isSample: true` on every seeded course

### 9.3 · Idempotency

Script checks for existing courses by slug; skips if present. Media
uploads check by filename. Safe to re-run: `pnpm seed:doctrine`.

---

## 10 · Cleanup (Phase F)

Files deleted at the end of the rebuild:

- `src/collections/DoctrineTracks.ts`
- `src/collections/DoctrineModules.ts`
- `src/collections/DoctrineUnits.ts`
- `src/app/(frontend)/doctrine/[track]/` (entire folder, recursively)
- `src/app/(frontend)/components/doctrine/module-folio.tsx`
- `src/app/(frontend)/components/doctrine/unit-folio.tsx`
- `src/lib/doctrine-outline.ts` (replaced by `src/lib/doctrine.ts`)

Database tables dropped via Drizzle migration:

- `tantum.doctrine_tracks`
- `tantum.doctrine_modules`
- `tantum.doctrine_units`
- `tantum.lms_progress` (recreated with new shape per §4.3)

Untouched: Atlas, Members, all auth flows, site chrome, pillar pages.

---

## 11 · Verification gate

The rebuild is complete when:

- [ ] `pnpm typecheck && pnpm lint && pnpm build` all green
- [ ] `pnpm seed:doctrine` runs cleanly on a fresh DB
- [ ] Manual click-through verified by the user:
  - **Setup:** create three test members; promote one to `admin` via
    `pnpm admin:promote`; admin then promotes another to `instructor`
    via the studio and assigns them to one seeded course; the third
    stays `learner`.
  - Sign in as the `learner` → take a sample course end-to-end →
    progress persists across reload → resume banner reflects last unit
  - Sign in as the `instructor` → studio shows only DoctrineCourses +
    Media → can edit the assigned course → cannot edit Atlas / Miracles
    → cannot edit a different instructor's course
  - Sign in as the `admin` → full studio access → can flip `roles`
    field on a Members record → can delete a course
- [ ] All three lanes (Read / Watch / Listen) work in at least one unit
- [ ] Resources block renders correctly with all three `kind`s
- [ ] Mark complete fires from all three triggers (manual button,
      lane-end event, mastery-correct)
- [ ] `/doctrine/[course]/[module]` URLs 301-redirect to the course
      landing hash anchor `#module-{slug}`

---

## 12 · Don't-break warnings (carried forward from handoff)

- **Atlas pillar** untouched.
- **Members + auth flows** untouched (only adding `roles` field is new).
- **Pillar pages** (`/`, `/reading`, `/manifesto`, `/credits`) untouched.
- **Site chrome** untouched.
- **Catechist stub** (`/catechist`) untouched.
- **`'use server'` modules** export only async functions and types
  (rule from `cacdadf` bug-fix; do not re-introduce constants in
  `'use server'` files).

---

## 13 · Open scope questions — all closed

| # | Question | Decision |
|---|----------|----------|
| 1 | Naming | Rename to `DoctrineCourses` everywhere |
| 2 | Instructor field | Relationship → Members, `hasMany: true`, plus role-based access |
| 3 | Estimated minutes | Manual `estimatedMinutes: number` per unit |
| 4 | Mark-complete behavior | Auto + manual + mastery-correct (all three) |
| 5 | Resources field | Add now, with `kind: download \| link \| citation` and citation supporting optional URL |
| 6 | "What you'll learn" | Add now (`learnPoints[]` array) |
| 7 | Drag reorder | Per-array only (cross-array via JSON edit view) |
| 8 | Existing seed | Re-seed same content + rich media files for end-to-end testing |
| 9 | LmsProgress migration | Drop and recreate with `unitPath: text` + unique index |
| 10 | Module page | 301 redirect to course landing `#module-{slug}` anchor |
