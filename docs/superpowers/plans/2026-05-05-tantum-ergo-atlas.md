# Tantum Ergo · Plan 2 — Atlas pillar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/atlas` placeholder with the headline cinematic — a Mapbox GL globe of approved miracles in **Explore** mode (free 3D globe, side drawer, timeline scrub, filter chips) and a scroll-storytelling **Pilgrimage** mode that the map auto-pans through. Mobile collapses to pilgrimage-only with a parallel keyboard-accessible catalogue at `/atlas/list`. The content team authors miracles in the studio with drafts + autosave + scheduled publish + live preview.

**Architecture:** A new `Miracles` Payload collection holds the data (drafts/autosave/scheduled-publish, live-preview at `/atlas?focus={slug}`). The server `/atlas/page.tsx` queries published miracles, then hands them to a single client `<AtlasShell>` orchestrator. The shell owns mode + filter + selected-miracle state and mounts either `<Globe>` or `<Pilgrimage>`. `<MiracleDrawer>` is a portalled aside (right-side desktop, bottom-sheet mobile) driven by Framer Motion. `<TimelineScrub>` and `<FilterChips>` mutate filter state. Pin colour is mapped from `type` via a single helper. `/atlas/list` is a server-rendered, fully keyboard-accessible catalogue mirroring `/reading`'s shape — also the mobile fallback for users who want the index instead of the cinematic. Sample seed: 9 deliberately fictional miracles (`_isSample: true`, names like "Sample-Lanciano"), 4 marked `inPilgrimage`.

**Tech Stack:** Carries forward Next.js 16.2 (Turbopack), React 19, Payload 3.84, Tailwind v4, Framer Motion 12. New for this plan: `mapbox-gl@^3` and `react-map-gl@^8` (Mapbox GL JS bindings). No new server libraries; the existing `payload()` helper, `LivePreviewListener`, `SectionReveal`, `GildedRule`, `ChiRho`, and `cn()` utilities are reused as-is.

**Reference spec:** [`../specs/2026-05-04-tantum-ergo-v1-design.md`](../specs/2026-05-04-tantum-ergo-v1-design.md) §3 (design language), §4.2 (Atlas page), §5.2 (Miracles schema), §6.3 (perf budget), §6.4 (a11y), §6.5 (tech additions). Handoff: [`../handoffs/2026-05-05-plan-2-atlas-kickoff.md`](../handoffs/2026-05-05-plan-2-atlas-kickoff.md).

**Decisions locked from kickoff (do not re-ask):**

| Question | Choice |
|---|---|
| Mapbox style | Muted dark navigation (`mapbox://styles/mapbox/dark-v11`) — Settings global's `mapboxStyle` field overrides at runtime |
| Pilgrimage pacing + audio | Short — 4 chapters, no audio, captions only |
| Sample miracles | Plan generates the list (§ "Sample miracle seed" below). User OKs in plan review. |
| Per-chapter "approach" cinematics | Deferred to v1.1 — globe pan/zoom + caption + Reliquary carousel is enough |
| Build order | Atlas first (this plan), Catechist (Plan 4) after |

---

## File structure for this plan

| File | Responsibility | Status |
|---|---|---|
| `package.json` | Add `mapbox-gl`, `react-map-gl` deps; add `seed:atlas` script | MODIFY |
| `.env.example` | Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` and `MAPBOX_STYLE_URL` blocks | MODIFY |
| `src/collections/Miracles.ts` | Miracles collection (drafts + autosave 375 ms + scheduled publish + livePreview) | NEW |
| `src/payload.config.ts` | Register `Miracles` in `collections: [...]` | MODIFY |
| `src/app/(frontend)/components/atlas/types.ts` | Shared `MiracleSummary` server-to-client shape + pin colour helper | NEW |
| `src/app/(frontend)/components/atlas/mode-toggle.tsx` | Explore ⇄ Pilgrimage toggle | NEW (client) |
| `src/app/(frontend)/components/atlas/filter-chips.tsx` | Type + ecclesial-status chips | NEW (client) |
| `src/app/(frontend)/components/atlas/timeline-scrub.tsx` | Range input filtering by year | NEW (client) |
| `src/app/(frontend)/components/atlas/miracle-drawer.tsx` | Right-aside / bottom-sheet detail panel | NEW (client) |
| `src/app/(frontend)/components/atlas/globe.tsx` | `react-map-gl` globe + pins | NEW (client) |
| `src/app/(frontend)/components/atlas/pilgrimage.tsx` | Scroll-driven chapter sequence (sticky map, fly-to per chapter) | NEW (client) |
| `src/app/(frontend)/components/atlas/atlas-shell.tsx` | Client orchestrator (mode + selected + filter state) | NEW (client) |
| `src/app/(frontend)/atlas/page.tsx` | Rewrite — server: query miracles, render shell | MODIFY |
| `src/app/(frontend)/atlas/list/page.tsx` | Mobile catalogue + keyboard-accessible a11y fallback | NEW (server) |
| `src/scripts/seed-atlas.ts` | Idempotent seed for 9 sample miracles | NEW |

After this plan: 11 new files, 4 modified files. The `/atlas` route is no longer a placeholder. All other Plan 1 surfaces (home, reading, manifesto, credits, doctrine + catechist placeholders, studio chrome) are untouched.

---

## Sample miracle seed (9 entries)

Each `_isSample: true`, `_status: 'published'`, deliberately fictional names. Coordinates approximate (the content team replaces names AND coordinates when authoring real miracles). 4 marked `inPilgrimage` with `pilgrimageOrder: 1..4`.

| # | Title | Type | Ecclesial status | Year | Approx? | Location | Coords (lng, lat) | Pilgrimage |
|---|---|---|---|---|---|---|---|---|
| 1 | Eucharistic Miracle of Sample-Lanciano `[Sample]` | Eucharistic | Approved | 700 | yes | Sample-Lanciano, Italy | 14.388, 42.227 | order 1 |
| 2 | The Bleeding Host of Placeholder-Bolsena `[Sample]` | Eucharistic | Recognised | 1263 | no | Placeholder-Bolsena, Italy | 11.985, 42.642 | — |
| 3 | Apparition at Sample-Town `[Sample]` | Marian | Worthy of belief | 1858 | no | Sample-Town, France | -0.060, 43.094 | order 2 |
| 4 | Our Lady of Lorem `[Sample]` | Marian | Approved | 1531 | no | Lorem-Tepeyac, Mexico | -99.117, 19.486 | — |
| 5 | Healing of Brother Placeholder `[Sample]` | Healing | Under investigation | 1923 | no | Anywhere, Spain | -3.703, 40.416 | order 3 |
| 6 | Restoration at Sample-Spring `[Sample]` | Healing | Approved | 1879 | no | Sample-Spring, France | 0.044, 43.099 | — |
| 7 | Stigmata of Saint Ipsum `[Sample]` | Stigmata | Recognised | 1224 | yes | Ipsum Abbey, Italy | 12.611, 43.062 | order 4 |
| 8 | The Incorrupt Body of Saint Lorem `[Sample]` | Incorruptible | Approved | 1582 | no | Lorem-City, Spain | -4.728, 40.640 | — |
| 9 | Levitation of Brother Sample `[Sample]` | Other | Under investigation | 1671 | no | Sample-Cupertino, Italy | 16.500, 40.750 | — |

Pin colour mapping (locked):

| Type | Colour token | Hex |
|---|---|---|
| Eucharistic | `rubric` | `#8c2a2a` |
| Marian | `lapis` | `#1f3358` |
| Healing | `gilt` | `#b08a3e` |
| Stigmata | `rubric-deep` | `#5e1a1a` |
| Incorruptible | `incense` | `#6f7a3a` |
| Other | `ink` | `#1a1410` |

---

## Conventions used throughout this plan

- **No tests for pure JSX components** — verified by `pnpm typecheck`, `pnpm lint`, `pnpm build`, and visual smoke at the end. (TDD is reserved for logic — none in this plan; everything is rendering + state.)
- **Path-relative-to-repo-root** (`/home/ajojotank/Documents/Tantum-Ergo/webapp/`) for all file paths. The `src/` prefix is already accounted for.
- **Exact commit messages** in `git commit -m` lines — copy verbatim, no edits. All commits prefixed `feat(atlas):` or `docs(atlas):`.
- **Stop and verify** at each step that says "Run X and confirm Y."
- **Don't re-style Plan 1 surfaces.** Touch only files listed above.

---

## Task 1 · Install Mapbox dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add mapbox-gl@^3 react-map-gl@^8
```

Expected: both packages added to `dependencies`. `react-map-gl` declares `mapbox-gl` as a peer dep.

- [ ] **Step 2: Install Mapbox GL JS type stubs (devDep)**

```bash
pnpm add -D @types/mapbox-gl
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. (No source uses these packages yet.)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(atlas): add mapbox-gl + react-map-gl dependencies"
```

---

## Task 2 · Document Mapbox env in `.env.example`

**Files:**
- Modify: `.env.example`

The Mapbox token must be exposed to the browser (the globe runs client-side), so it lives under `NEXT_PUBLIC_*`. The style URL is server-readable too (the Settings global default), so it does not need the prefix.

- [ ] **Step 1: Append the Mapbox block**

Open `.env.example`. Find the trailing `# ─── Supabase Storage…` block (already there from Plan 5). After the last Supabase line and a single blank line, append:

```
# ─── Mapbox (Atlas) ─────────────────────────────────────────────────────────
# Public-domain access token. Required for /atlas. Create at
# https://account.mapbox.com/access-tokens — keep the default URL restrictions
# pointed at your hosts (localhost + production origin).
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.replace-with-mapbox-public-token

# Optional default style override. Settings → mapboxStyle in the studio takes
# precedence; this is the fallback when the global is unset. Leave blank to
# use mapbox://styles/mapbox/dark-v11 (the sacred-friendly dark navigation
# style chosen for v1.0).
MAPBOX_STYLE_URL=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(atlas): document NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN + MAPBOX_STYLE_URL"
```

> **Note for the executor (do not commit this part):** Plan 2 assumes the user has placed a real token at `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...` in `.env`. If the dev server logs `[mapbox] missing token`, prompt the user to add it before continuing past Task 22.

---

## Task 3 · Miracles collection — content tab

**Files:**
- Create: `src/collections/Miracles.ts`

Build the collection skeleton + the Content tab (title, slug, summary, narrative, sources, artwork). Sidebar fields, draft/autosave, and live-preview wiring come in Tasks 4 + 5 — keep this task focused so it's reviewable on its own.

- [ ] **Step 1: Create Miracles.ts with content fields**

```ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Miracles: CollectionConfig = {
  slug: 'miracles',
  labels: { singular: 'Miracle', plural: 'Miracles' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'ecclesialStatus', 'yearOccurred', '_status'],
    description:
      'The Atlas corpus. Each miracle gets a pin on /atlas; the inPilgrimage flag promotes it to the curated scrolltelling chapters.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/atlas?focus=${slug}`,
          previewSecret: process.env.PREVIEW_SECRET || '',
        })
        return `${SERVER_URL}/next/preview?${params.toString()}`
      },
    },
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  '1–2 sentences. Shown in the pin tooltip and the drawer header.',
              },
            },
            { name: 'narrative', type: 'richText' },
            {
              name: 'sources',
              type: 'array',
              labels: { singular: 'Source', plural: 'Sources' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text' },
                { name: 'attribution', type: 'text' },
              ],
            },
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
      ],
    },
  ],
}
```

> **Why a single tab here:** Tabs 2 and 3 (Provenance, SEO) come in Task 4. Splitting keeps each commit readable.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. (Collection is defined but not yet registered.)

- [ ] **Step 3: Commit**

```bash
git add src/collections/Miracles.ts
git commit -m "feat(atlas): scaffold Miracles collection — content tab"
```

---

## Task 4 · Miracles collection — provenance + classification fields

**Files:**
- Modify: `src/collections/Miracles.ts`

Add the second tab (Provenance: type, ecclesialStatus, location, dates, approving authority) and the third tab (SEO).

- [ ] **Step 1: Append Provenance + SEO tabs**

In `src/collections/Miracles.ts`, find the `tabs: [` array and the existing `{ label: 'Content', ... }` entry. After the closing `}` of the Content tab and before the closing `]` of `tabs:`, append the two new tabs so the array reads:

```ts
tabs: [
  {
    label: 'Content',
    fields: [
      // …existing content fields unchanged…
    ],
  },
  {
    label: 'Provenance',
    fields: [
      {
        name: 'type',
        type: 'select',
        required: true,
        options: [
          { label: 'Eucharistic', value: 'eucharistic' },
          { label: 'Marian', value: 'marian' },
          { label: 'Healing', value: 'healing' },
          { label: 'Stigmata', value: 'stigmata' },
          { label: 'Incorruptible', value: 'incorruptible' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        name: 'ecclesialStatus',
        type: 'select',
        required: true,
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Recognised', value: 'recognised' },
          { label: 'Worthy of belief', value: 'worthy-of-belief' },
          { label: 'Under investigation', value: 'under-investigation' },
          { label: 'Not constatat', value: 'not-constatat' },
        ],
      },
      {
        name: 'locationName',
        type: 'text',
        required: true,
        admin: { description: 'Human-readable place name, e.g. "Lanciano, Italy".' },
      },
      {
        name: 'coordinates',
        type: 'point',
        required: true,
        admin: {
          description:
            'Pin position. Payload stores [longitude, latitude] — the same order Mapbox expects.',
        },
      },
      {
        name: 'yearOccurred',
        type: 'number',
        required: true,
        admin: { description: 'Year only (no month/day). Negative for BC.' },
      },
      {
        name: 'dateApproximate',
        type: 'checkbox',
        defaultValue: false,
        admin: { description: 'Renders as "c. 700" instead of "700" when true.' },
      },
      { name: 'approvalDate', type: 'date' },
      {
        name: 'approvingAuthority',
        type: 'text',
        admin: { description: 'e.g. "Bishop of Tours, 1574".' },
      },
    ],
  },
  {
    label: 'SEO',
    fields: [
      {
        name: 'meta',
        type: 'group',
        fields: [
          { name: 'title', type: 'text' },
          { name: 'description', type: 'textarea' },
          { name: 'ogImage', type: 'upload', relationTo: 'media' },
        ],
      },
    ],
  },
],
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/collections/Miracles.ts
git commit -m "feat(atlas): add provenance + SEO tabs to Miracles"
```

---

## Task 5 · Miracles collection — sidebar fields (slug, pilgrimage, sample)

**Files:**
- Modify: `src/collections/Miracles.ts`

Sidebar fields (slug, inPilgrimage, pilgrimageOrder, _isSample) sit outside the tabs block.

- [ ] **Step 1: Append sidebar fields**

In `src/collections/Miracles.ts`, the top-level `fields:` array currently contains a single `{ type: 'tabs', tabs: [...] }` entry. Append four sidebar fields after it:

```ts
fields: [
  { type: 'tabs', tabs: [/* …unchanged… */] },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'URL fragment for live preview (/atlas?focus={slug}).',
    },
  },
  {
    name: 'inPilgrimage',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description:
        'Promotes this miracle into the curated pilgrimage scrolltelling on /atlas.',
    },
  },
  {
    name: 'pilgrimageOrder',
    type: 'number',
    admin: {
      position: 'sidebar',
      description: 'Chapter order in the pilgrimage. Only used when inPilgrimage is true.',
      condition: (data) => Boolean(data?.inPilgrimage),
    },
  },
  {
    name: '_isSample',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      position: 'sidebar',
      description: 'Marks this miracle as filler. Frontend renders a [Sample] badge.',
    },
  },
],
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/collections/Miracles.ts
git commit -m "feat(atlas): add Miracles sidebar fields (slug, pilgrimage, sample)"
```

---

## Task 6 · Register Miracles in payload.config.ts

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Wire the import + collection registration**

In `src/payload.config.ts`, find the line:

```ts
import { Articles } from './collections/Articles'
```

Add immediately after it:

```ts
import { Miracles } from './collections/Miracles'
```

Then find the existing line:

```ts
  collections: [Users, Media, Articles],
```

Replace it with:

```ts
  collections: [Users, Media, Articles, Miracles],
```

If `s3Storage` is configured and the user expects miracle artwork to land in Supabase, no change is needed — the plugin already routes the entire `media` collection (the `relationTo` target of `artwork`) through Supabase. `Miracles` itself does not own uploads.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Boot dev and verify schema sync**

```bash
pnpm dev
```

Wait for `Ready in …`. Watch the log for Drizzle table-creation lines for `payload.miracles`, `payload._miracles_v`, etc. If the log shows an interactive prompt (it should not — these are pure additions), Ctrl-C and investigate.

In a second terminal, sanity-check the table exists:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
```

Expected: `200`. Then via Supabase MCP `execute_sql` (or `psql`):

```sql
SELECT count(*) FROM payload.miracles;
```

Expected: `0`.

- [ ] **Step 4: Stop dev (Ctrl-C). Commit config + regenerated types.**

Payload's `typescript.outputFile` regenerates `src/payload-types.ts` on every boot. After registering a new collection, that file *will* have changed — commit it alongside `payload.config.ts`. (Without it, downstream tasks' `pnpm typecheck` fails because the `'miracles'` collection literal isn't in the generated union.)

```bash
git add src/payload.config.ts src/payload-types.ts
git commit -m "feat(atlas): register Miracles collection + regenerate types"
```

If `git status` shows no changes to `src/payload-types.ts`, the dev server didn't boot far enough — re-run Step 3 and wait for the `[INFO] Type generation complete` log line before stopping.

---

## Task 7 · Atlas shared types + pin-colour helper

**Files:**
- Create: `src/app/(frontend)/components/atlas/types.ts`

A single file the server page and every client component import for the serialisable miracle shape and the type-to-colour mapping. Keep this trivial — no logic, just data.

- [ ] **Step 1: Create the file**

```ts
// src/app/(frontend)/components/atlas/types.ts
//
// Wire shape passed from the server `/atlas` page into the client AtlasShell.
// Strictly serialisable (no Date objects, no rich-text trees beyond JSON).

export type MiracleType =
  | 'eucharistic'
  | 'marian'
  | 'healing'
  | 'stigmata'
  | 'incorruptible'
  | 'other'

export type EcclesialStatus =
  | 'approved'
  | 'recognised'
  | 'worthy-of-belief'
  | 'under-investigation'
  | 'not-constatat'

export type MiracleArtwork = {
  id: string
  url: string
  alt: string
  caption?: string | null
  attribution?: string | null
}

export type MiracleSource = {
  label: string
  url?: string | null
  attribution?: string | null
}

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
  narrative?: unknown // Lexical JSON; rendered via a permissive walker
  sources: MiracleSource[]
  artwork: MiracleArtwork[]
  inPilgrimage: boolean
  pilgrimageOrder?: number | null
  isSample: boolean
}

export const TYPE_LABEL: Record<MiracleType, string> = {
  eucharistic: 'Eucharistic',
  marian: 'Marian',
  healing: 'Healing',
  stigmata: 'Stigmata',
  incorruptible: 'Incorruptible',
  other: 'Other',
}

export const STATUS_LABEL: Record<EcclesialStatus, string> = {
  approved: 'Approved',
  recognised: 'Recognised',
  'worthy-of-belief': 'Worthy of belief',
  'under-investigation': 'Under investigation',
  'not-constatat': 'Not constatat',
}

// Pin colour by type. Tokens match @theme entries in globals.css. Hex is for
// Mapbox marker SVGs, which can't read CSS variables.
export const PIN_HEX: Record<MiracleType, string> = {
  eucharistic: '#8c2a2a', // rubric
  marian: '#1f3358', // lapis
  healing: '#b08a3e', // gilt
  stigmata: '#5e1a1a', // rubric-deep
  incorruptible: '#6f7a3a', // incense
  other: '#1a1410', // ink
}

// "c. 700" vs "700" rendering.
export function formatYear(yearOccurred: number, dateApproximate: boolean): string {
  const sign = yearOccurred < 0 ? ' BC' : ''
  const abs = Math.abs(yearOccurred)
  return `${dateApproximate ? 'c. ' : ''}${abs}${sign}`
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/types.ts
git commit -m "feat(atlas): add shared MiracleSummary type + pin-colour helper"
```

---

## Task 8 · Mode-toggle component (Explore ⇄ Pilgrimage)

**Files:**
- Create: `src/app/(frontend)/components/atlas/mode-toggle.tsx`

A small two-button group rendered top-right of the page on desktop, hidden on mobile (mobile is pilgrimage-only).

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/mode-toggle.tsx
'use client'

import { cn } from '@/lib/cn'

export type AtlasMode = 'explore' | 'pilgrimage'

export function ModeToggle({
  mode,
  onChange,
  className,
}: {
  mode: AtlasMode
  onChange: (next: AtlasMode) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Atlas mode"
      className={cn(
        'inline-flex items-center gap-px rounded-full border border-ink/10 bg-vellum/85 p-0.5 backdrop-blur',
        className,
      )}
    >
      {(['explore', 'pilgrimage'] as const).map((m) => {
        const active = mode === m
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={cn(
              'rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors',
              active
                ? 'bg-ink text-vellum'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {m === 'explore' ? 'Explore' : 'Pilgrimage'}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/mode-toggle.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/mode-toggle.tsx
git commit -m "feat(atlas): add Explore/Pilgrimage mode toggle"
```

---

## Task 9 · Filter-chips component (type + ecclesial status)

**Files:**
- Create: `src/app/(frontend)/components/atlas/filter-chips.tsx`

Two horizontal rows of toggleable chips. Empty `selectedTypes` / `selectedStatuses` mean "all" (no filter applied).

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/filter-chips.tsx
'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import {
  type EcclesialStatus,
  type MiracleType,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
} from './types'

const TYPE_ORDER: MiracleType[] = [
  'eucharistic',
  'marian',
  'healing',
  'stigmata',
  'incorruptible',
  'other',
]

const STATUS_ORDER: EcclesialStatus[] = [
  'approved',
  'recognised',
  'worthy-of-belief',
  'under-investigation',
  'not-constatat',
]

export function FilterChips({
  selectedTypes,
  onToggleType,
  selectedStatuses,
  onToggleStatus,
  className,
}: {
  selectedTypes: Set<MiracleType>
  onToggleType: (type: MiracleType) => void
  selectedStatuses: Set<EcclesialStatus>
  onToggleStatus: (status: EcclesialStatus) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Row label="Type">
        {TYPE_ORDER.map((t) => {
          const active = selectedTypes.has(t)
          return (
            <Chip
              key={t}
              active={active}
              onClick={() => onToggleType(t)}
              dotColor={PIN_HEX[t]}
            >
              {TYPE_LABEL[t]}
            </Chip>
          )
        })}
      </Row>
      <Row label="Status">
        {STATUS_ORDER.map((s) => {
          const active = selectedStatuses.has(s)
          return (
            <Chip key={s} active={active} onClick={() => onToggleStatus(s)}>
              {STATUS_LABEL[s]}
            </Chip>
          )
        })}
      </Row>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  dotColor,
  children,
}: {
  active: boolean
  onClick: () => void
  dotColor?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors',
        active
          ? 'border-ink bg-ink text-vellum'
          : 'border-ink/15 bg-vellum/85 text-ink-soft hover:border-ink/30 hover:text-ink',
      )}
    >
      {dotColor ? (
        <span
          aria-hidden
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/filter-chips.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/filter-chips.tsx
git commit -m "feat(atlas): add type + status filter chips"
```

---

## Task 10 · Timeline-scrub component

**Files:**
- Create: `src/app/(frontend)/components/atlas/timeline-scrub.tsx`

A native `<input type="range">` over the year domain, tracked in state by `<AtlasShell>`. Two handles is non-trivial; for v1.0 we use a single handle representing the **upper bound** — pins with `yearOccurred > value` are filtered out. This matches the spec's "filter pins by year" behaviour while keeping the slider semantically a single range input.

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/timeline-scrub.tsx
'use client'

import { cn } from '@/lib/cn'

export function TimelineScrub({
  min,
  max,
  value,
  onChange,
  className,
}: {
  min: number
  max: number
  value: number
  onChange: (next: number) => void
  className?: string
}) {
  const safeValue = Math.min(Math.max(value, min), max)
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-2xl border border-ink/10 bg-vellum/90 px-4 py-3 backdrop-blur',
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Up to year
        </span>
        <span className="font-display text-2xl italic leading-none text-ink">
          {safeValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={safeValue}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Filter miracles by year"
        className="h-1 w-full cursor-ew-resize appearance-none rounded-full bg-ink/15 accent-rubric"
      />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
```

> **Why no double-handle slider:** custom dual-handles are 100+ lines of pointer math and a11y wiring. Single-handle "up to year" reads as "show me everything that had occurred by this date" — closer to a pilgrim's path through history than a year-window. If editors want a window in v1.1, the change is local to this file.

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/timeline-scrub.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/timeline-scrub.tsx
git commit -m "feat(atlas): add timeline scrub bar (single-handle, up-to-year)"
```

---

## Task 11 · Miracle-drawer component

**Files:**
- Create: `src/app/(frontend)/components/atlas/miracle-drawer.tsx`

Right-side aside on `≥md`, bottom-sheet on mobile. Uses Framer's `<AnimatePresence>` for enter/exit. `role="dialog"` + `aria-modal="false"` (it's a non-blocking detail panel; the globe stays interactive behind it). ESC closes. Click on backdrop also closes.

The narrative is a Lexical tree; we render it via a permissive walker for v1.0 (paragraphs only, links inline) — this matches how Plan 1's reading article renders rich text. Anything more elaborate is deferred.

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/miracle-drawer.tsx
'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

import { cn } from '@/lib/cn'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const SPRING = { type: 'spring', stiffness: 220, damping: 30, mass: 0.7 } as const

export function MiracleDrawer({
  miracle,
  onClose,
}: {
  miracle: MiracleSummary | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!miracle) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [miracle, onClose])

  return (
    <AnimatePresence>
      {miracle ? (
        <>
          <motion.button
            key="backdrop"
            type="button"
            aria-label="Close detail panel"
            onClick={onClose}
            className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[2px] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="false"
            aria-labelledby="miracle-drawer-title"
            className={cn(
              'fixed z-40 overflow-y-auto bg-vellum text-ink shadow-altar',
              // Bottom-sheet (mobile) / right-aside (md+)
              'inset-x-0 bottom-0 max-h-[80dvh] rounded-t-3xl border-t border-ink/10',
              'md:inset-y-0 md:right-0 md:bottom-auto md:max-h-none md:w-[440px] md:rounded-none md:border-l md:border-t-0',
            )}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={SPRING}
          >
            <DrawerBody miracle={miracle} onClose={onClose} />
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function DrawerBody({
  miracle,
  onClose,
}: {
  miracle: MiracleSummary
  onClose: () => void
}) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
      <header className="flex items-start justify-between gap-4">
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
        >
          Close
        </button>
      </header>

      <div>
        <h2
          id="miracle-drawer-title"
          className="font-display text-3xl italic leading-tight tracking-tight text-ink md:text-4xl"
        >
          {miracle.title}
        </h2>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {miracle.locationName} · {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
          {miracle.isSample ? ' · [Sample]' : ''}
        </p>
      </div>

      <p className="text-base leading-relaxed text-ink-soft">{miracle.summary}</p>

      {miracle.artwork.length > 0 ? (
        <div className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
          {miracle.artwork.map((art) => (
            <figure
              key={art.id}
              className="relative aspect-[4/5] min-w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl bg-parchment"
            >
              <Image
                src={art.url}
                alt={art.alt}
                fill
                sizes="(min-width: 768px) 360px, 78vw"
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
  )
}

// Permissive Lexical walker — paragraphs and inline text only. Anything else
// silently degrades to plain text. Matches Plan 1's reading article render.
function NarrativeBlock({ node }: { node: unknown }) {
  const root = (node as { root?: { children?: unknown[] } } | null)?.root
  const children = Array.isArray(root?.children) ? root!.children : []
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink">
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

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/miracle-drawer.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/miracle-drawer.tsx
git commit -m "feat(atlas): add miracle drawer (right-aside / bottom-sheet)"
```

---

## Task 12 · Globe component

**Files:**
- Create: `src/app/(frontend)/components/atlas/globe.tsx`

Mounts `react-map-gl` Map in `globe` projection at the world centre. Renders one Marker per miracle in `visibleMiracles` (the parent already filtered by year + chips). Click a Marker → calls `onSelect(slug)`.

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/globe.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, { AttributionControl, Marker, NavigationControl } from 'react-map-gl/mapbox'
import { useCallback, useMemo } from 'react'

import { cn } from '@/lib/cn'
import { type MiracleSummary, PIN_HEX } from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
const DEFAULT_STYLE = 'mapbox://styles/mapbox/dark-v11'

export function Globe({
  miracles,
  styleUrl,
  onSelect,
  className,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  onSelect: (slug: string) => void
  className?: string
}) {
  const initial = useMemo(
    () => ({
      longitude: 8,
      latitude: 30,
      zoom: 1.4,
    }),
    [],
  )

  const handleSelect = useCallback(
    (slug: string) => {
      onSelect(slug)
    },
    [onSelect],
  )

  if (!TOKEN) {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center bg-ink text-vellum/85',
          className,
        )}
      >
        <p className="max-w-md px-6 text-center font-display text-lg italic leading-relaxed">
          Set <span className="font-mono">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span> in{' '}
          <span className="font-mono">.env</span> to render the Atlas.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={initial}
        mapStyle={styleUrl || DEFAULT_STYLE}
        projection={{ name: 'globe' }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <AttributionControl compact position="bottom-left" />
        <NavigationControl position="bottom-right" showCompass={false} />
        {miracles.map((m) => (
          <Marker
            key={m.id}
            longitude={m.coordinates[0]}
            latitude={m.coordinates[1]}
            anchor="center"
            onClick={(e) => {
              // Stop the click from propagating to the Map (which would close
              // any popup / clear the selection).
              e.originalEvent.stopPropagation()
              handleSelect(m.slug)
            }}
          >
            <button
              type="button"
              aria-label={`Open detail for ${m.title}`}
              className="group relative grid place-items-center"
            >
              <span
                aria-hidden
                className="absolute size-5 rounded-full opacity-40 blur-md transition-opacity group-hover:opacity-90"
                style={{ backgroundColor: PIN_HEX[m.type] }}
              />
              <span
                aria-hidden
                className="relative size-2.5 rounded-full ring-2 ring-vellum/85 transition-transform group-hover:scale-125"
                style={{ backgroundColor: PIN_HEX[m.type] }}
              />
            </button>
          </Marker>
        ))}
      </Map>
    </div>
  )
}
```

> **Why `mapbox-gl/dist/mapbox-gl.css` is imported here:** Mapbox ships its own component CSS; without it the navigation control + attribution badge render unstyled. Importing in the leaf component (rather than `globals.css`) keeps it co-located with the only consumer.

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/globe.tsx
```

Expected: no errors. (Type stubs from `@types/mapbox-gl` cover the marker click event.)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/globe.tsx
git commit -m "feat(atlas): add Mapbox globe with type-coloured pins"
```

---

## Task 13 · Pilgrimage component

**Files:**
- Create: `src/app/(frontend)/components/atlas/pilgrimage.tsx`

Vertical scroll-storytelling: a sticky map on the right and chapter cards stacked on the left. Each chapter card uses `IntersectionObserver` (via Framer's `useInView`) — when it enters the viewport, the map calls `flyTo({ center: coords, zoom: 4 })`. Mobile collapses to a single column where map + caption render in series per chapter.

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/pilgrimage.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import Map, { AttributionControl, Marker, type MapRef } from 'react-map-gl/mapbox'
import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { GildedRule } from '../gilded-rule'
import {
  type MiracleSummary,
  PIN_HEX,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from './types'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
const DEFAULT_STYLE = 'mapbox://styles/mapbox/dark-v11'

export function Pilgrimage({
  miracles,
  styleUrl,
  onViewAll,
  className,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  onViewAll: () => void
  className?: string
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const mapRef = useRef<MapRef | null>(null)

  // When activeIdx changes, fly to that miracle's coordinates.
  useEffect(() => {
    const m = miracles[activeIdx]
    if (!m || !mapRef.current) return
    mapRef.current.flyTo({
      center: m.coordinates,
      zoom: 4.2,
      duration: 1800,
      essential: true,
    })
  }, [activeIdx, miracles])

  if (miracles.length === 0) {
    return (
      <div
        className={cn(
          'mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8',
          className,
        )}
      >
        <p className="font-display text-2xl italic text-ink-soft">
          The pilgrimage opens soon.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>
      {/* Mobile: stacked single column. md+: 2-col with sticky map */}
      <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,46%)] md:gap-10">
        <ol className="flex flex-col gap-24 md:gap-32 md:py-16">
          {miracles.map((m, idx) => (
            <Chapter
              key={m.id}
              miracle={m}
              index={idx}
              total={miracles.length}
              onActive={() => setActiveIdx(idx)}
            />
          ))}
        </ol>
        <aside className="hidden md:block">
          <div className="sticky top-24 h-[70dvh] overflow-hidden rounded-3xl border border-ink/10 bg-ink shadow-altar">
            {TOKEN ? (
              <Map
                ref={mapRef}
                mapboxAccessToken={TOKEN}
                initialViewState={{
                  longitude: miracles[0].coordinates[0],
                  latitude: miracles[0].coordinates[1],
                  zoom: 3.4,
                }}
                mapStyle={styleUrl || DEFAULT_STYLE}
                projection={{ name: 'globe' }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                interactive={false}
              >
                <AttributionControl compact position="bottom-left" />
                {miracles.map((m, i) => (
                  <Marker
                    key={m.id}
                    longitude={m.coordinates[0]}
                    latitude={m.coordinates[1]}
                    anchor="center"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'block size-2.5 rounded-full ring-2 transition-transform',
                        i === activeIdx
                          ? 'scale-150 ring-vellum'
                          : 'ring-vellum/40',
                      )}
                      style={{ backgroundColor: PIN_HEX[m.type] }}
                    />
                  </Marker>
                ))}
              </Map>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center font-display text-lg italic text-vellum/80">
                Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to render the map.
              </div>
            )}
          </div>
        </aside>
      </div>

      <GildedRule className="mt-24" />
      <div className="flex flex-col items-center gap-3 pb-24 pt-12 text-center">
        <p className="font-display text-2xl italic text-ink">
          The cartography opens.
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric transition-colors hover:text-rubric-deep"
        >
          View all miracles →
        </button>
      </div>
    </div>
  )
}

function Chapter({
  miracle,
  index,
  total,
  onActive,
}: {
  miracle: MiracleSummary
  index: number
  total: number
  onActive: () => void
}) {
  const ref = useRef<HTMLLIElement | null>(null)
  const inView = useInView(ref, { margin: '-40% 0px -40% 0px', amount: 0.4 })

  useEffect(() => {
    if (inView) onActive()
  }, [inView, onActive])

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
      className="md:max-w-[55ch]"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Chapter {romanize(index + 1)} of {romanize(total)}
      </p>
      <h2 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {miracle.title}
      </h2>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {TYPE_LABEL[miracle.type]} · {STATUS_LABEL[miracle.ecclesialStatus]} ·{' '}
        {miracle.locationName} ·{' '}
        {formatYear(miracle.yearOccurred, miracle.dateApproximate)}
      </p>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        {miracle.summary}
      </p>

      {/* Mobile inline map (no sticky) */}
      <div className="mt-6 h-64 overflow-hidden rounded-2xl border border-ink/10 bg-ink md:hidden">
        {TOKEN ? (
          <Map
            mapboxAccessToken={TOKEN}
            initialViewState={{
              longitude: miracle.coordinates[0],
              latitude: miracle.coordinates[1],
              zoom: 4.2,
            }}
            mapStyle={DEFAULT_STYLE}
            projection={{ name: 'globe' }}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            interactive={false}
          >
            <AttributionControl compact position="bottom-left" />
            <Marker
              longitude={miracle.coordinates[0]}
              latitude={miracle.coordinates[1]}
              anchor="center"
            >
              <span
                aria-hidden
                className="block size-3 rounded-full ring-2 ring-vellum"
                style={{ backgroundColor: PIN_HEX[miracle.type] }}
              />
            </Marker>
          </Map>
        ) : null}
      </div>

      {miracle.sources.length > 0 ? (
        <ul className="mt-6 space-y-1 border-l-2 border-rubric/40 pl-4 font-mono text-[11px] text-ink-soft">
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
    </motion.li>
  )
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
function romanize(n: number) {
  return ROMAN[n] ?? String(n)
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/pilgrimage.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/pilgrimage.tsx
git commit -m "feat(atlas): add pilgrimage scrolltelling (sticky map + flyTo per chapter)"
```

---

## Task 14 · Atlas-shell orchestrator

**Files:**
- Create: `src/app/(frontend)/components/atlas/atlas-shell.tsx`

The single client component the server page mounts. Owns mode + filter + selected-slug state. Switches between `<Globe>` and `<Pilgrimage>`. Pre-opens the drawer when `initialFocusSlug` prop is provided (live-preview path).

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/components/atlas/atlas-shell.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/cn'
import { FilterChips } from './filter-chips'
import { Globe } from './globe'
import { MiracleDrawer } from './miracle-drawer'
import { ModeToggle, type AtlasMode } from './mode-toggle'
import { Pilgrimage } from './pilgrimage'
import { TimelineScrub } from './timeline-scrub'
import {
  type EcclesialStatus,
  type MiracleSummary,
  type MiracleType,
} from './types'

export function AtlasShell({
  miracles,
  styleUrl,
  initialFocusSlug,
  initialMode,
}: {
  miracles: MiracleSummary[]
  styleUrl?: string
  initialFocusSlug?: string
  initialMode: AtlasMode
}) {
  const router = useRouter()
  const [mode, setMode] = useState<AtlasMode>(initialMode)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    initialFocusSlug ?? null,
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<MiracleType>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<EcclesialStatus>>(
    new Set(),
  )

  // Year range derived from data. Default the scrub to "max" — show all.
  const { minYear, maxYear } = useMemo(() => {
    if (miracles.length === 0) return { minYear: 0, maxYear: 2100 }
    const years = miracles.map((m) => m.yearOccurred)
    return { minYear: Math.min(...years), maxYear: Math.max(...years) }
  }, [miracles])
  const [yearMax, setYearMax] = useState(maxYear)

  // If miracles list changes (live-preview re-fetch), clamp scrub.
  useEffect(() => {
    setYearMax(maxYear)
  }, [maxYear])

  const pilgrimageMiracles = useMemo(
    () =>
      miracles
        .filter((m) => m.inPilgrimage)
        .sort(
          (a, b) =>
            (a.pilgrimageOrder ?? Infinity) - (b.pilgrimageOrder ?? Infinity),
        ),
    [miracles],
  )

  const visibleMiracles = useMemo(() => {
    return miracles.filter((m) => {
      if (m.yearOccurred > yearMax) return false
      if (selectedTypes.size > 0 && !selectedTypes.has(m.type)) return false
      if (
        selectedStatuses.size > 0 &&
        !selectedStatuses.has(m.ecclesialStatus)
      )
        return false
      return true
    })
  }, [miracles, yearMax, selectedTypes, selectedStatuses])

  const selected = useMemo(
    () => miracles.find((m) => m.slug === selectedSlug) ?? null,
    [miracles, selectedSlug],
  )

  function toggleType(t: MiracleType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }
  function toggleStatus(s: EcclesialStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  return (
    <div className="relative">
      {/* Header strip — eyebrow + mode toggle */}
      <header className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between md:py-16">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Plate I · Cartography
          </p>
          <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
            The Miracle Atlas
          </h1>
          <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-ink-soft md:text-lg">
            A globe of approved miracles, anchored to coordinates and centuries.
            Begin a curated pilgrimage, or wander the whole record.
          </p>
        </div>
        <div className="hidden md:block">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      {mode === 'explore' ? (
        <ExploreView
          miracles={miracles}
          visibleMiracles={visibleMiracles}
          styleUrl={styleUrl}
          minYear={minYear}
          maxYear={maxYear}
          yearMax={yearMax}
          onYearMaxChange={setYearMax}
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          onSelectSlug={setSelectedSlug}
        />
      ) : (
        <Pilgrimage
          miracles={pilgrimageMiracles}
          styleUrl={styleUrl}
          onViewAll={() => router.push('/atlas/list')}
        />
      )}

      <MiracleDrawer
        miracle={selected}
        onClose={() => setSelectedSlug(null)}
      />
    </div>
  )
}

function ExploreView({
  miracles,
  visibleMiracles,
  styleUrl,
  minYear,
  maxYear,
  yearMax,
  onYearMaxChange,
  selectedTypes,
  onToggleType,
  selectedStatuses,
  onToggleStatus,
  onSelectSlug,
}: {
  miracles: MiracleSummary[]
  visibleMiracles: MiracleSummary[]
  styleUrl?: string
  minYear: number
  maxYear: number
  yearMax: number
  onYearMaxChange: (n: number) => void
  selectedTypes: Set<MiracleType>
  onToggleType: (t: MiracleType) => void
  selectedStatuses: Set<EcclesialStatus>
  onToggleStatus: (s: EcclesialStatus) => void
  onSelectSlug: (slug: string) => void
}) {
  return (
    <>
      {/* Desktop: full-bleed globe with overlays. Mobile: this whole branch is
          hidden because mobile is pilgrimage-only — see the wrapping page. */}
      <div className="relative hidden h-[78dvh] w-full overflow-hidden border-y border-ink/10 bg-ink md:block">
        <Globe
          miracles={visibleMiracles}
          styleUrl={styleUrl}
          onSelect={onSelectSlug}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-4">
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <FilterChips
              selectedTypes={selectedTypes}
              onToggleType={onToggleType}
              selectedStatuses={selectedStatuses}
              onToggleStatus={onToggleStatus}
            />
          </div>
          <div className="pointer-events-auto mx-auto w-full max-w-5xl">
            <TimelineScrub
              min={minYear}
              max={maxYear}
              value={yearMax}
              onChange={onYearMaxChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile fallback inside Explore mode: route to the catalogue. */}
      <div className="md:hidden">
        <MobileExploreFallback count={miracles.length} />
      </div>
    </>
  )
}

function MobileExploreFallback({ count }: { count: number }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
      <div
        className={cn(
          'rounded-3xl border border-ink/10 bg-vellum-deep px-6 py-10 text-center',
        )}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rubric">
          The free globe is desktop-only
        </p>
        <p className="mt-3 font-display text-2xl italic leading-tight text-ink">
          Open the Atlas on a larger screen, or browse the catalogue.
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {count} miracles in the corpus
        </p>
        <a
          href="/atlas/list"
          className="mt-6 inline-block rounded-full bg-ink px-5 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum hover:bg-rubric-deep"
        >
          View catalogue →
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/components/atlas/atlas-shell.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/components/atlas/atlas-shell.tsx
git commit -m "feat(atlas): add AtlasShell orchestrator (mode + filter + drawer state)"
```

---

## Task 15 · Rewrite `/atlas/page.tsx`

**Files:**
- Modify: `src/app/(frontend)/atlas/page.tsx`

The server page queries published miracles + Settings, builds the serialisable summary, and mounts `<AtlasShell>`. On mobile we want pilgrimage by default; on desktop we want explore by default. Since the layout is server-rendered we cannot use a media query — pass an `initialMode` of `pilgrimage` and let the shell flip to `explore` on `≥md` via a `useEffect` that reads `matchMedia`. For simplicity, we choose `explore` as the initial mode for everyone: mobile users see the **MobileExploreFallback** card (Task 14) which routes them to `/atlas/list`. The pilgrimage CTA on the homepage hits `/atlas` then the user toggles. (See "Mobile pilgrimage default" note below for why this is acceptable for v1.0.)

- [ ] **Step 1: Replace the file contents**

```tsx
import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { AtlasShell } from '../components/atlas/atlas-shell'
import {
  type EcclesialStatus,
  type MiracleArtwork,
  type MiracleSource,
  type MiracleSummary,
  type MiracleType,
} from '../components/atlas/types'
import { LivePreviewListener } from '../components/live-preview-listener'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Atlas',
  description:
    'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type SearchParams = Promise<{ focus?: string }>

export default async function AtlasPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { isEnabled: isDraft } = await draftMode()
  const { focus } = await searchParams

  const p = await payload()

  const settings = await p.findGlobal({ slug: 'settings' })
  const styleUrl =
    (typeof settings.mapboxStyle === 'string' && settings.mapboxStyle.trim()) ||
    process.env.MAPBOX_STYLE_URL ||
    undefined

  const result = await p.find({
    collection: 'miracles',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit: 500,
    sort: 'yearOccurred',
    depth: 2, // resolve artwork upload relations
  })

  if (result.docs.length === 0 && !isDraft) {
    // No miracles seeded yet — render an honest "opens soon" instead of crashing.
    return <AtlasEmpty />
  }

  const miracles: MiracleSummary[] = result.docs.map((d) => toSummary(d))

  return (
    <main className="min-h-[80dvh] pb-24">
      <AtlasShell
        miracles={miracles}
        styleUrl={styleUrl}
        initialFocusSlug={focus}
        initialMode="explore"
      />
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}

function AtlasEmpty() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate I · Cartography
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The Atlas opens soon.
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        Once the studio holds approved miracles, this page becomes a 3D globe of
        the corpus and a curated pilgrimage of the most extraordinary witnesses.
      </p>
    </main>
  )
}

// Map a raw Payload `miracles` doc to the serialisable MiracleSummary the
// client components consume. Keeps types tight at the boundary.
function toSummary(d: unknown): MiracleSummary {
  const r = d as Record<string, unknown>
  const coords = Array.isArray(r.coordinates) ? (r.coordinates as number[]) : [0, 0]
  const sourcesRaw = Array.isArray(r.sources) ? r.sources : []
  const artworkRaw = Array.isArray(r.artwork) ? r.artwork : []

  const sources: MiracleSource[] = sourcesRaw.map((s) => {
    const o = s as Record<string, unknown>
    return {
      label: typeof o.label === 'string' ? o.label : '',
      url: typeof o.url === 'string' ? o.url : null,
      attribution: typeof o.attribution === 'string' ? o.attribution : null,
    }
  })

  const artwork: MiracleArtwork[] = artworkRaw
    .map((a) => {
      // depth:2 resolves upload to full doc; depth:0/1 returns id string.
      if (typeof a !== 'object' || a === null) return null
      const o = a as Record<string, unknown>
      const url = typeof o.url === 'string' ? o.url : null
      if (!url) return null
      return {
        id: String(o.id ?? url),
        url,
        alt: typeof o.alt === 'string' ? o.alt : '',
        caption: typeof o.caption === 'string' ? o.caption : null,
        attribution: typeof o.attribution === 'string' ? o.attribution : null,
      }
    })
    .filter((a): a is MiracleArtwork => a !== null)

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
    inPilgrimage: Boolean(r.inPilgrimage),
    pilgrimageOrder:
      typeof r.pilgrimageOrder === 'number' ? r.pilgrimageOrder : null,
    isSample: Boolean(r._isSample),
  }
}
```

> **Mobile pilgrimage default — note for v1.1:** the spec says mobile should default to pilgrimage. Right now everyone gets `initialMode="explore"` and mobile users see the fallback card. The fallback links to `/atlas/list`, which is the spec-mandated mobile catalogue. The pilgrimage is one tap away via the toggle. A `useEffect`-driven media-query flip would cause an FOUC (server renders explore, client flips on hydration). If the user pushes back during review, swap to `initialMode={'explore'}` for desktop / `'pilgrimage'` for mobile by reading the `User-Agent` header on the server side — but that's a v1.1 polish, not a v1.0 blocker.

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/atlas/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/atlas/page.tsx
git commit -m "feat(atlas): replace placeholder with live shell + draftMode wiring"
```

---

## Task 16 · `/atlas/list` — keyboard-accessible catalogue

**Files:**
- Create: `src/app/(frontend)/atlas/list/page.tsx`

Server-rendered list of every published miracle. No JS. Mirrors the shape of `/reading`. Filters via real `<a>` links (no client state).

- [ ] **Step 1: Create the file**

```tsx
// src/app/(frontend)/atlas/list/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  type EcclesialStatus,
  type MiracleType,
  STATUS_LABEL,
  TYPE_LABEL,
  formatYear,
} from '../../components/atlas/types'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Atlas · Catalogue',
  description:
    'The full corpus of miracles, listed alphabetically. Keyboard-accessible alternative to the 3D globe.',
}

type SearchParams = Promise<{ type?: string; status?: string }>

const TYPE_VALUES: MiracleType[] = [
  'eucharistic',
  'marian',
  'healing',
  'stigmata',
  'incorruptible',
  'other',
]
const STATUS_VALUES: EcclesialStatus[] = [
  'approved',
  'recognised',
  'worthy-of-belief',
  'under-investigation',
  'not-constatat',
]

export default async function AtlasListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const filterType = TYPE_VALUES.includes(params.type as MiracleType)
    ? (params.type as MiracleType)
    : undefined
  const filterStatus = STATUS_VALUES.includes(params.status as EcclesialStatus)
    ? (params.status as EcclesialStatus)
    : undefined

  const where: Record<string, unknown> = { _status: { equals: 'published' } }
  if (filterType) where.type = { equals: filterType }
  if (filterStatus) where.ecclesialStatus = { equals: filterStatus }

  const result = await (await payload()).find({
    collection: 'miracles',
    where,
    limit: 500,
    sort: 'title',
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Atlas · Catalogue
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The full corpus
      </h1>
      <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-ink-soft">
        Every miracle in the Atlas, listed alphabetically. A keyboard-accessible
        alternative to the globe — and the mobile catalogue.
      </p>

      <FilterRow currentType={filterType} currentStatus={filterStatus} />

      {result.docs.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          No miracles match these filters.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {result.docs.map((m) => (
            <li key={m.id} className="py-7">
              <Link
                href={`/atlas?focus=${encodeURIComponent(String(m.slug))}`}
                className="group block"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {TYPE_LABEL[m.type as MiracleType]} ·{' '}
                  {STATUS_LABEL[m.ecclesialStatus as EcclesialStatus]} ·{' '}
                  {String(m.locationName ?? '')} ·{' '}
                  {formatYear(Number(m.yearOccurred), Boolean(m.dateApproximate))}
                  {m._isSample ? ' · [Sample]' : ''}
                </p>
                <h2 className="mt-2 font-display text-3xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
                  {String(m.title ?? '')}
                </h2>
                {m.summary ? (
                  <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
                    {String(m.summary)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t border-ink/10 pt-8">
        <Link
          href="/atlas"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
        >
          ← Back to the globe
        </Link>
      </div>
    </main>
  )
}

function FilterRow({
  currentType,
  currentStatus,
}: {
  currentType?: MiracleType
  currentStatus?: EcclesialStatus
}) {
  return (
    <div className="mt-8 flex flex-col gap-2 text-[11px]">
      <Group label="Type">
        <FilterLink href="/atlas/list" active={!currentType}>
          All
        </FilterLink>
        {TYPE_VALUES.map((t) => (
          <FilterLink
            key={t}
            href={`/atlas/list?type=${t}${currentStatus ? `&status=${currentStatus}` : ''}`}
            active={currentType === t}
          >
            {TYPE_LABEL[t]}
          </FilterLink>
        ))}
      </Group>
      <Group label="Status">
        <FilterLink
          href={currentType ? `/atlas/list?type=${currentType}` : '/atlas/list'}
          active={!currentStatus}
        >
          All
        </FilterLink>
        {STATUS_VALUES.map((s) => (
          <FilterLink
            key={s}
            href={`/atlas/list?status=${s}${currentType ? `&type=${currentType}` : ''}`}
            active={currentStatus === s}
          >
            {STATUS_LABEL[s]}
          </FilterLink>
        ))}
      </Group>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      {children}
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'rounded-full border border-ink bg-ink px-3 py-1 font-mono uppercase tracking-[0.18em] text-vellum'
          : 'rounded-full border border-ink/15 bg-vellum/85 px-3 py-1 font-mono uppercase tracking-[0.18em] text-ink-soft hover:border-ink/30 hover:text-ink'
      }
    >
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint src/app/\(frontend\)/atlas/list/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/atlas/list/page.tsx
git commit -m "feat(atlas): add /atlas/list keyboard-accessible catalogue"
```

---

## Task 17 · Atlas seed script — header + ensure helper

**Files:**
- Create: `src/scripts/seed-atlas.ts`

Idempotent seeder. Builds 9 sample miracles using the table from the "Sample miracle seed" section above. Same `lexicalLine` helper as `seed-foundation.ts`. We split the file across two tasks (this one creates the scaffold + the helpers; Task 18 adds the actual data) so reviews are bounded.

- [ ] **Step 1: Create the file with header, helpers, and main shell**

```ts
// src/scripts/seed-atlas.ts
//
// Idempotent seed for the Miracles collection. Run with `pnpm seed:atlas`.
// Each entry is `_isSample: true` with a deliberately fictional name; the
// content team will replace these with authentic records.
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

type MiracleSeed = {
  slug: string
  title: string
  type:
    | 'eucharistic'
    | 'marian'
    | 'healing'
    | 'stigmata'
    | 'incorruptible'
    | 'other'
  ecclesialStatus:
    | 'approved'
    | 'recognised'
    | 'worthy-of-belief'
    | 'under-investigation'
    | 'not-constatat'
  locationName: string
  coordinates: [number, number] // [lng, lat]
  yearOccurred: number
  dateApproximate?: boolean
  approvingAuthority?: string
  summary: string
  narrativeText: string
  sources?: Array<{ label: string; url?: string; attribution?: string }>
  inPilgrimage?: boolean
  pilgrimageOrder?: number
}

const SEEDS: MiracleSeed[] = [] // populated in Task 18

async function main() {
  const payload = await getPayload({ config })

  for (const seed of SEEDS) {
    await ensureMiracle(payload, seed)
  }

  payload.logger.info(`Atlas seed complete (${SEEDS.length} miracles).`)
  process.exit(0)
}

function lexicalLine(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: null,
      children: [
        {
          type: 'paragraph',
          version: 1,
          format: '',
          indent: 0,
          direction: null,
          children: [
            { type: 'text', version: 1, format: 0, detail: 0, mode: 'normal', style: '', text },
          ],
        },
      ],
    },
  } as never
}

async function ensureMiracle(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: MiracleSeed,
) {
  const existing = await payload.find({
    collection: 'miracles',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })
  const data = {
    title: seed.title,
    slug: seed.slug,
    type: seed.type,
    ecclesialStatus: seed.ecclesialStatus,
    locationName: seed.locationName,
    coordinates: seed.coordinates,
    yearOccurred: seed.yearOccurred,
    dateApproximate: Boolean(seed.dateApproximate),
    approvingAuthority: seed.approvingAuthority,
    summary: seed.summary,
    narrative: lexicalLine(seed.narrativeText),
    sources: seed.sources ?? [],
    inPilgrimage: Boolean(seed.inPilgrimage),
    pilgrimageOrder: seed.pilgrimageOrder,
    _isSample: true,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({
      collection: 'miracles',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated miracle ${seed.slug}`)
  } else {
    await payload.create({ collection: 'miracles', data })
    payload.logger.info(`Created miracle ${seed.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/seed-atlas.ts
git commit -m "feat(atlas): scaffold idempotent seed script"
```

---

## Task 18 · Atlas seed script — sample data

**Files:**
- Modify: `src/scripts/seed-atlas.ts`

Populate the `SEEDS` array with the 9 sample miracles from the "Sample miracle seed" table above.

- [ ] **Step 1: Replace the empty SEEDS array**

In `src/scripts/seed-atlas.ts`, find:

```ts
const SEEDS: MiracleSeed[] = [] // populated in Task 18
```

Replace with:

```ts
const SEEDS: MiracleSeed[] = [
  {
    slug: 'eucharistic-miracle-of-sample-lanciano',
    title: 'Eucharistic Miracle of Sample-Lanciano [Sample]',
    type: 'eucharistic',
    ecclesialStatus: 'approved',
    locationName: 'Sample-Lanciano, Italy',
    coordinates: [14.388, 42.227],
    yearOccurred: 700,
    dateApproximate: true,
    approvingAuthority: 'Bishop of Sample-See, c. 1574',
    summary:
      'In a small Italian church, the host and wine are said to have transformed into flesh and blood during a moment of doubt — the relics venerated for over a millennium.',
    narrativeText:
      'A monk celebrating Mass entertained doubts about the Real Presence. As he spoke the words of consecration, the host became visible flesh and the wine became visible blood. The relics were preserved and have been examined repeatedly across the centuries.',
    sources: [
      {
        label: 'Sample-Lanciano archive — pamphlet',
        attribution: 'Diocese of Sample-See',
      },
    ],
    inPilgrimage: true,
    pilgrimageOrder: 1,
  },
  {
    slug: 'bleeding-host-of-placeholder-bolsena',
    title: 'The Bleeding Host of Placeholder-Bolsena [Sample]',
    type: 'eucharistic',
    ecclesialStatus: 'recognised',
    locationName: 'Placeholder-Bolsena, Italy',
    coordinates: [11.985, 42.642],
    yearOccurred: 1263,
    approvingAuthority: 'Pope Placeholder IV',
    summary:
      'A travelling priest, doubting the Real Presence, witnessed blood seeping from the host onto the corporal — the linen later venerated as a relic.',
    narrativeText:
      'A Bohemian priest stopped in Placeholder-Bolsena en route to Rome. Plagued by doubts about transubstantiation, he celebrated Mass — and as he spoke the words of consecration, the host bled onto the corporal cloth. The cloth was carried in procession and survives to this day.',
    sources: [
      {
        label: 'Bull of Pope Placeholder IV (sample)',
        attribution: 'Vatican archive (filler)',
      },
    ],
  },
  {
    slug: 'apparition-at-sample-town',
    title: 'Apparition at Sample-Town [Sample]',
    type: 'marian',
    ecclesialStatus: 'worthy-of-belief',
    locationName: 'Sample-Town, France',
    coordinates: [-0.06, 43.094],
    yearOccurred: 1858,
    approvingAuthority: 'Bishop of Sample-Tarbes, 1862',
    summary:
      'A young shepherdess reported eighteen visits from a luminous lady at a grotto in Sample-Town — the spring that emerged is said to have brought countless healings.',
    narrativeText:
      'Over five months in 1858, a fourteen-year-old in Sample-Town reported eighteen apparitions of a lady who identified herself as the Immaculate Conception. The grotto became a pilgrimage site; the spring water is associated with thousands of reported healings.',
    sources: [
      {
        label: 'Bishop of Sample-Tarbes — pastoral letter',
        attribution: 'Diocesan archive (filler)',
      },
    ],
    inPilgrimage: true,
    pilgrimageOrder: 2,
  },
  {
    slug: 'our-lady-of-lorem',
    title: 'Our Lady of Lorem [Sample]',
    type: 'marian',
    ecclesialStatus: 'approved',
    locationName: 'Lorem-Tepeyac, Mexico',
    coordinates: [-99.117, 19.486],
    yearOccurred: 1531,
    approvingAuthority: 'Archbishop of Lorem-City',
    summary:
      'An indigenous farmer reported four visits from the Mother of God on the hill of Lorem-Tepeyac; her image is said to have appeared imprinted on his cloak.',
    narrativeText:
      'A peasant in early-colonial Lorem-Tepeyac reported encountering a young woman who identified herself as the Mother of God. As proof, she instructed him to gather flowers in his cloak. When he opened the cloak before the bishop, an image of the lady was found imprinted on the fabric.',
    sources: [
      {
        label: 'Lorem chronicle (sample)',
        attribution: 'Archdiocese of Lorem-City',
      },
    ],
  },
  {
    slug: 'healing-of-brother-placeholder',
    title: 'Healing of Brother Placeholder [Sample]',
    type: 'healing',
    ecclesialStatus: 'under-investigation',
    locationName: 'Anywhere, Spain',
    coordinates: [-3.703, 40.416],
    yearOccurred: 1923,
    summary:
      'A Franciscan brother reported the sudden remission of a degenerative illness after a novena — the case currently before the diocesan tribunal.',
    narrativeText:
      'Brother Placeholder, a Franciscan, was diagnosed with a degenerative neuromuscular condition. After a nine-day novena to a particular intercessor, he reported sudden and complete remission, confirmed by his attending physicians. The case has been forwarded to the diocesan tribunal.',
    sources: [
      {
        label: 'Diocesan medical report — sealed (sample)',
        attribution: 'Anywhere diocesan curia',
      },
    ],
    inPilgrimage: true,
    pilgrimageOrder: 3,
  },
  {
    slug: 'restoration-at-sample-spring',
    title: 'Restoration at Sample-Spring [Sample]',
    type: 'healing',
    ecclesialStatus: 'approved',
    locationName: 'Sample-Spring, France',
    coordinates: [0.044, 43.099],
    yearOccurred: 1879,
    approvingAuthority: 'Bishop of Sample-Spring, 1884',
    summary:
      'A pilgrim with a long-standing infirmity reported instantaneous restoration after immersion in the spring — one of dozens approved by the local tribunal.',
    narrativeText:
      'A pilgrim travelled to Sample-Spring with documentation of a fifteen-year infirmity. Upon immersion in the spring waters, he reported instantaneous restoration. After medical examination, the local tribunal approved the case as inexplicable by natural means.',
    sources: [
      {
        label: 'Sample-Spring tribunal record',
        attribution: 'Diocesan archive (filler)',
      },
    ],
  },
  {
    slug: 'stigmata-of-saint-ipsum',
    title: 'Stigmata of Saint Ipsum [Sample]',
    type: 'stigmata',
    ecclesialStatus: 'recognised',
    locationName: 'Ipsum Abbey, Italy',
    coordinates: [12.611, 43.062],
    yearOccurred: 1224,
    dateApproximate: true,
    approvingAuthority: 'Pope Lorem IX, 1228',
    summary:
      'A friar at Ipsum Abbey is said to have received the wounds of Christ on a mountain retreat — the first such recorded case in Christian history.',
    narrativeText:
      'Withdrawn for prayer at Ipsum Abbey, the friar reported a vision of a seraph in the form of the crucified Christ. After the vision, the wounds of Christ appeared on his body — hands, feet, and side — and remained until his death.',
    sources: [
      {
        label: 'Hagiographic account (sample)',
        attribution: 'Order of Friars Sample',
      },
    ],
    inPilgrimage: true,
    pilgrimageOrder: 4,
  },
  {
    slug: 'incorrupt-body-of-saint-lorem',
    title: 'The Incorrupt Body of Saint Lorem [Sample]',
    type: 'incorruptible',
    ecclesialStatus: 'approved',
    locationName: 'Lorem-City, Spain',
    coordinates: [-4.728, 40.64],
    yearOccurred: 1582,
    approvingAuthority: 'Archbishop of Lorem-City, 1622',
    summary:
      'Forty years after burial, the body of a Carmelite reformer was exhumed and reported intact, fragrant, and supple — taken as a sign of holiness.',
    narrativeText:
      'Forty years after her burial, the body of the Carmelite reformer was exhumed for translation to a new shrine. Witnesses reported finding the body intact, fragrant, and supple. The body has been examined repeatedly and remains preserved at her shrine.',
    sources: [
      {
        label: 'Exhumation register (sample)',
        attribution: 'Carmelite archive',
      },
    ],
  },
  {
    slug: 'levitation-of-brother-sample',
    title: 'Levitation of Brother Sample [Sample]',
    type: 'other',
    ecclesialStatus: 'under-investigation',
    locationName: 'Sample-Cupertino, Italy',
    coordinates: [16.5, 40.75],
    yearOccurred: 1671,
    summary:
      'A Franciscan known for ecstatic prayer was repeatedly observed rising into the air during the Eucharistic celebration — the cause is presently before a Roman tribunal.',
    narrativeText:
      'Brother Sample of Sample-Cupertino was a Franciscan known for ecstatic prayer. Witnesses on multiple occasions reported him rising into the air during the consecration of the Eucharist. The accounts are documented in his cause for canonisation, currently before a Roman tribunal.',
    sources: [
      {
        label: 'Cause for canonisation — Roman archive (sample)',
        attribution: 'Congregation for the Causes of Saints',
      },
    ],
  },
]
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/scripts/seed-atlas.ts
git commit -m "feat(atlas): seed 9 sample miracles (4 in pilgrimage)"
```

---

## Task 19 · Wire `seed:atlas` script in `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the script**

In `package.json`, find the `"scripts"` block. Find the line:

```json
    "seed:foundation": "tsx src/scripts/seed-foundation.ts",
```

Add immediately after it:

```json
    "seed:atlas": "tsx src/scripts/seed-atlas.ts",
```

(Watch the trailing comma — `seed:foundation` already has one; `seed:atlas` needs one too because `migrate:media` follows it.)

- [ ] **Step 2: Sanity-check the JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat(atlas): add seed:atlas script"
```

---

## Task 20 · Run the seed and verify in the studio

**Files:** none modified

- [ ] **Step 1: Run the seed**

```bash
pnpm seed:atlas
```

Expected log lines:

```
Created miracle eucharistic-miracle-of-sample-lanciano
Created miracle bleeding-host-of-placeholder-bolsena
… (7 more)
Atlas seed complete (9 miracles).
```

If the seed errors with `connection terminated unexpectedly` or `prepared statement already exists`, the Supabase pooler is misbehaving — switch the `DATABASE_URI` from port `6543` to `5432` and re-run (per gotcha #2 in `project_runtime_gotchas.md`).

- [ ] **Step 2: Re-run to confirm idempotence**

```bash
pnpm seed:atlas
```

Expected: every line says `Updated miracle …` instead of `Created miracle …`. No errors.

- [ ] **Step 3: Open studio, confirm presence**

```bash
pnpm dev
```

Open <http://localhost:3000/admin> → Miracles. Expected: 9 entries, each titled `… [Sample]`. Click into one, confirm:
- Content tab shows title, summary, narrative, sources, artwork (empty)
- Provenance tab shows type, ecclesial status, location, coords, year
- Sidebar shows slug, inPilgrimage flag, _isSample = true
- Status pill says **Published**

Stop dev (Ctrl-C).

- [ ] **Step 4: No commit — verification gate.**

If anything is off, return to Tasks 17 / 18 to fix.

---

## Task 21 · Smoke-test routes

**Files:** none modified

- [ ] **Step 1: Boot dev**

```bash
pnpm dev
```

- [ ] **Step 2: Curl every Atlas route**

```bash
for path in /atlas /atlas/list "/atlas/list?type=eucharistic" "/atlas/list?status=approved" "/atlas?focus=stigmata-of-saint-ipsum"; do
  printf "%-60s " "$path"
  curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "http://localhost:3000$path"
done
```

Expected: every route returns `200`.

Also confirm Plan 1 surfaces still respond:

```bash
for path in / /reading /manifesto /credits /doctrine /catechist; do
  printf "%-30s " "$path"
  curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "http://localhost:3000$path"
done
```

Expected: all `200`.

- [ ] **Step 3: Stop dev. No commit — verification gate.**

If any non-Atlas route regressed, the Miracles registration in `payload.config.ts` did something it shouldn't have — investigate before continuing.

---

## Task 22 · Browser smoke — desktop Explore mode

**Files:** none modified

- [ ] **Step 1: Boot dev**

```bash
pnpm dev
```

- [ ] **Step 2: Open Atlas in a browser at desktop width (≥1280×720)**

Open <http://localhost:3000/atlas>. Expect:

1. Hero text renders (eyebrow "Plate I · Cartography", display heading, copy).
2. Mode toggle is visible top-right showing "Explore" active, "Pilgrimage" inactive.
3. Below the hero: a dark globe with 9 coloured pins at the seeded coordinates.
4. Pin colours match: Lanciano pin is rubric-red; Apparition pin is lapis-blue; Stigmata pin is rubric-deep; Incorruptible pin is incense-olive; Levitation pin is ink-black.
5. Bottom of the globe area: filter chips (6 type, 5 status) and the timeline scrub. Year shows max year (1923).
6. Click a pin: drawer slides in from the right, shows the miracle title, type/status chip, location, year, summary, sources, [Sample] tag.
7. Press ESC: drawer closes.
8. Click a Type chip (e.g. "Marian"): only Marian pins remain on the globe; all others fade out.
9. Drag the timeline scrub to year 1500: only pins with `yearOccurred ≤ 1500` remain (4 pins).
10. Reset: click "Marian" again to deactivate, drag scrub back to 1923.
11. Toggle to "Pilgrimage" mode: globe view replaced by chapter list + sticky map.

If any of (1)–(11) fail, fix the relevant component before proceeding.

- [ ] **Step 3: Stop dev. No commit — verification gate.**

---

## Task 23 · Browser smoke — Pilgrimage mode

**Files:** none modified

- [ ] **Step 1: Boot dev**

```bash
pnpm dev
```

- [ ] **Step 2: Pilgrimage on desktop**

Open <http://localhost:3000/atlas>, click "Pilgrimage". Expect:

1. Two-column layout: chapter list on left, sticky map on right.
2. Four chapter cards labelled `Chapter I of IV` through `Chapter IV of IV`.
3. Each chapter shows title, type/status/location/year line, summary, source list.
4. As you scroll, the sticky map's pins update — the active chapter's pin is enlarged + ring-vellum.
5. The map smoothly `flyTo`s the active miracle when its chapter enters viewport.
6. After the last chapter: GildedRule, "The cartography opens." line, "View all miracles →" link to `/atlas/list`.

- [ ] **Step 3: Pilgrimage on mobile**

Open DevTools, set viewport to 390×844 (iPhone 14). Reload `/atlas`, click "Pilgrimage" (or scroll past the desktop fallback card). Expect:

1. Single column. Each chapter renders inline with its own small map below the summary.
2. No sticky right column.
3. The "View all miracles →" CTA at the bottom routes to `/atlas/list`.

Then visit `/atlas/list` directly. Expect:
- Title "The full corpus".
- 9 entries.
- Type and Status filter rows render. Click a Type filter; URL updates and only matching entries show.
- Click a miracle title — should route to `/atlas?focus=<slug>` and pre-open the drawer.

- [ ] **Step 4: Stop dev. No commit — verification gate.**

---

## Task 24 · Live-preview smoke test

**Files:** none modified

- [ ] **Step 1: Boot dev**

```bash
pnpm dev
```

- [ ] **Step 2: Edit a draft in the studio**

1. Open <http://localhost:3000/admin> → Miracles → "Eucharistic Miracle of Sample-Lanciano".
2. The default view should show the **live preview** iframe (top right of the doc form). Confirm the Atlas page loads inside the iframe with the drawer pre-opened on this miracle.
3. Change the `summary` field. Wait ≤1s.
4. Confirm the iframe refreshes and the new summary appears in the drawer.

- [ ] **Step 3: Stop dev. No commit — verification gate.**

If preview doesn't refresh, check that `LivePreviewListener` is mounted on `/atlas/page.tsx` only when `isDraft` is true (it is — Task 15), and that the `/next/preview` route handler is unchanged from Plan 1.

---

## Task 25 · Production build smoke test

**Files:** none modified

- [ ] **Step 1: Build**

```bash
pnpm build
```

Expected: build completes. Warnings about unused vars are fine. Mapbox GL pulls in some large vendor chunks; that's expected.

- [ ] **Step 2: Start prod server, hit Atlas routes**

```bash
pnpm start &
sleep 4
for path in / /atlas /atlas/list /atlas/list?type=eucharistic; do
  printf "%-30s " "$path"
  curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "http://localhost:3000$path"
done
kill %1
```

Expected: all four routes return `200`.

- [ ] **Step 3: No commit — verification gate.**

---

## Task 26 · Update README roadmap

**Files:**
- Modify: `README.md`

Mark Plan 2 done in the Roadmap section.

- [ ] **Step 1: Edit the README Plan 2 entry**

Open `README.md`. Find the section starting `### Plan 2 · Atlas pillar` and replace its body with:

```md
### Plan 2 · Atlas pillar ✅
Mapbox GL globe with type-coloured pins, side drawer for miracle detail, timeline scrub, type + status filters. Pilgrimage scroll-storytelling mode with sticky map and per-chapter flyTo. Mobile collapses to pilgrimage + `/atlas/list` keyboard-accessible catalogue. `Miracles` collection with drafts + autosave + scheduled publish + live preview. Seed: 9 sample miracles, 4 in pilgrimage.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(atlas): mark Plan 2 done in roadmap"
```

---

## Task 27 · Final lint + typecheck + build gate

**Files:** none modified

- [ ] **Step 1: Final gate**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three commands exit 0.

- [ ] **Step 2: Status check**

```bash
git status
git log --oneline -30
```

Expected: clean working tree; ~24 commits since plan started, all `feat(atlas):` or `docs(atlas):` prefixed (one `docs(atlas):` for the env block + one `docs(atlas):` for the README).

- [ ] **Step 3: Atlas plan is complete.**

Hand back to user with the closing message from §7 of the handoff:

> Plan 2 (Atlas) done. Branch is at `<sha>`. Test: open `/atlas` on desktop — globe loads with 9 sample miracle pins, click a pin → drawer opens with detail, scrub the timeline. Open `/atlas` on mobile — pilgrimage scrolltelling. Bottom-of-page CTA → `/atlas/list` for the catalogue. Sample miracles are clearly `[Sample]`-marked; the content team replaces them via studio.
>
> Plan 3 (Doctrine LMS) is next, but you trigger it.

---

## Plan 2 self-review notes

- **Spec coverage:**
  - §3 design language (palette / type / motion) — `PIN_HEX` uses sacred palette; chapter cards use SectionReveal-style spring; mode toggle and chips use mono micro-typography ✓
  - §4.2 Atlas — Explore (Tasks 12 + 14), Pilgrimage (Task 13), pin colour by type (Task 7 PIN_HEX), drawer right/bottom-sheet (Task 11), timeline scrub (Task 10), filter chips (Task 9), mobile pilgrimage default + `/atlas/list` fallback (Tasks 15 fallback + 16 catalogue) ✓
  - §5.2 Miracles schema — title, slug, type, ecclesialStatus, locationName, coordinates, yearOccurred, dateApproximate, approvalDate, approvingAuthority, summary, narrative (richText), sources (array), artwork (upload multi), inPilgrimage, pilgrimageOrder (conditional), `_isSample` ✓ — Tasks 3, 4, 5
  - §5.2 drafts + autosave (375ms) + scheduled publish + live preview at `/atlas?focus={slug}` ✓ — Task 3 admin block
  - §6.2 filler-content convention — `_isSample: true` on every seeded miracle, `[Sample]` chip in title and drawer ✓ — Tasks 17 + 18 + 11
  - §6.3 perf — 9 pins (well below clustering threshold), one map instance per mode, `interactive={false}` on pilgrimage maps to reduce input-handler cost ✓
  - §6.4 a11y — `/atlas/list` is the keyboard-accessible parallel view; chips are `aria-pressed`; mode toggle is a real `role="tablist"`; drawer is `role="dialog"` with ESC close ✓
  - §6.5 tech additions — `mapbox-gl` + `react-map-gl` ✓ — Task 1
- **Out of scope (deferred — intentional):**
  - Per-chapter scroll-scrubbed image sequences (Q4 → B): not in plan.
  - Audio narration on chapters (Q2 → A): not in plan.
  - True dual-handle timeline window (single-handle "up to year" instead): noted in Task 10.
  - Mobile-pilgrimage as the default `initialMode` (server can't read viewport without UA sniffing): noted in Task 15. Mobile users land in Explore, see the fallback card linking to `/atlas/list`, and a single tap of the toggle reaches Pilgrimage.
  - Mapbox style toggle (Q1 → A only, dark): not in plan; Settings global's `mapboxStyle` field already supports content-team override at runtime.
- **Type consistency:**
  - `MiracleSummary.coordinates: [number, number]` is `[lng, lat]` everywhere — Mapbox `Marker.longitude / .latitude`, Pilgrimage `flyTo({ center: coords })`, server `toSummary` cast. Verified by hand: Task 7 type, Task 12 marker props, Task 13 flyTo, Task 15 toSummary all use index 0 = lng, index 1 = lat.
  - `MiracleType` and `EcclesialStatus` literal unions match the `select` field options in Task 4 verbatim.
  - `PIN_HEX` keys match `MiracleType` values exhaustively (TS exhaustiveness ensured by `Record<MiracleType, string>`).
  - `Miracles.slug` is required + unique (Task 5) and feeds `?focus=…` query param (Task 15) and live-preview URL (Task 3).
- **Don't-break warnings honoured:**
  - 5a (tantum schema): no new raw tables introduced ✓
  - 5b (Drizzle push): only additions (a new collection); no field renames or deletions ✓
  - 5c (Studio CSS): not touched ✓
  - 5d (Live preview): same `/next/preview` route + `LivePreviewListener` pattern as Plan 1 ✓
  - 5e (image hostnames): no new hosts; Mapbox tiles aren't `next/image` ✓
  - 5f (mobile-first): single-column collapse documented in Tasks 13 + 14 + 15 ✓
  - 5g (Mapbox costs): one map instance per active mode; `interactive={false}` on the pilgrimage's right column reduces re-renders ✓
  - 5h (don't break Plan 1): only modifications to Plan 1 files are `payload.config.ts` (collection registration), `package.json` (script + dep), `.env.example` (env block), `README.md` (roadmap entry). No changes to home / reading / manifesto / credits / studio / chrome ✓
