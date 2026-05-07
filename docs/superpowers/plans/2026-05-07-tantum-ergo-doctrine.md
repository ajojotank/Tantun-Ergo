# Doctrine LMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the second pillar — a breviary-styled LMS — with three nested collections (Tracks → Modules → Units), four page levels, a unit player carrying Read/Watch/Listen lanes plus a gentle mastery check, end-user member accounts, and server-side progress tracking that powers a "Continue where you left off" resume banner.

**Architecture:** Six phases. Phase A lays the doctrine schema (3 collections, types, serialise). Phase B ships the public-facing catalogue + track + module pages. Phase C adds end-user member auth (Members collection, sign-in/sign-up + forgot-password flows, header menu). Phase D ships the unit player, server-side progress, the auth gates on module + unit routes, and the ResumeBanner. Phase F adds the avatar field, the avatar in the nav, and the `/account` profile + password-change page. Phase E seeds 18 sample units across 3 tracks and runs final QA across the whole pillar (yes, F runs before E — final QA covers Phase F's surfaces too).

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Payload CMS v3.84 (built-in auth), Postgres via Supabase pooler, Framer Motion v12, pnpm.

**Verification model:** No unit-test framework — gate is `pnpm typecheck && pnpm lint && pnpm build` after each task. ONE commit per task unless a task explicitly says otherwise.

**Departure from spec:** §1 ("no member accounts, fully open") and §4.3 ("stored in localStorage") are deliberately overridden in this plan. The Doctrine pillar gets first-party email/password member accounts, and progress is stored server-side in a new `LmsProgress` collection. Atlas, Catechist (Plan 4), Reading, Manifesto, and Credits remain fully public — auth gates apply only to `/doctrine/[track]/[module]/...`. This change was confirmed by the user 2026-05-07 to support cross-device resume ("like Udemy, but for Catholics").

---

## File map

```
NEW FILES — Phase A (Doctrine schema)
  src/collections/DoctrineTracks.ts
  src/collections/DoctrineModules.ts
  src/collections/DoctrineUnits.ts
  src/app/(frontend)/components/doctrine/types.ts
  src/app/(frontend)/components/doctrine/serialise.ts

NEW FILES — Phase B (catalogue + overview pages)
  src/app/(frontend)/components/doctrine/track-plate.tsx
  src/app/(frontend)/components/doctrine/module-folio.tsx
  src/app/(frontend)/components/doctrine/unit-folio.tsx
  src/app/(frontend)/doctrine/[track]/page.tsx
  src/app/(frontend)/doctrine/[track]/[module]/page.tsx

NEW FILES — Phase C (member auth)
  src/collections/Members.ts
  src/lib/auth.ts
  src/app/(frontend)/components/account/auth-shell.tsx
  src/app/(frontend)/components/account/header-account-menu.tsx
  src/app/(frontend)/account/signin/page.tsx
  src/app/(frontend)/account/signin/actions.ts
  src/app/(frontend)/account/signup/page.tsx
  src/app/(frontend)/account/signup/actions.ts
  src/app/(frontend)/account/verify-email/page.tsx
  src/app/(frontend)/account/sign-out/route.ts
  src/app/(frontend)/account/forgot-password/page.tsx
  src/app/(frontend)/account/forgot-password/actions.ts
  src/app/(frontend)/account/reset-password/page.tsx
  src/app/(frontend)/account/reset-password/actions.ts

NEW FILES — Phase D (unit player + progress + gates)
  src/collections/LmsProgress.ts
  src/lib/doctrine-progress.ts
  src/app/(frontend)/components/doctrine/unit-player.tsx
  src/app/(frontend)/components/doctrine/lane-switcher.tsx
  src/app/(frontend)/components/doctrine/mastery-check.tsx
  src/app/(frontend)/components/doctrine/resume-banner.tsx
  src/app/(frontend)/doctrine/[track]/[module]/[unit]/page.tsx
  src/app/(frontend)/doctrine/[track]/[module]/[unit]/actions.ts

NEW FILES — Phase F (account management + avatar)
  src/app/(frontend)/components/account/avatar.tsx
  src/app/(frontend)/account/page.tsx
  src/app/(frontend)/account/actions.ts
  src/app/(frontend)/account/forms.tsx

NEW FILES — Phase E (seed)
  src/scripts/seed-doctrine.ts

MODIFIED FILES
  src/payload.config.ts                                            # A4, C2, D1: register collections
  src/payload-types.ts                                             # regenerated after each schema change
  src/app/(frontend)/doctrine/page.tsx                             # B1: replace ComingSoon with catalogue
  src/app/(frontend)/components/site-header.tsx                    # C5: account menu; F2: avatar
  src/app/(frontend)/components/site-header-client.tsx             # F2: avatar prop
  src/app/(frontend)/components/account/header-account-menu.tsx   # F2: avatar
  src/app/(frontend)/components/mobile-drawer.tsx                  # C5: account; F2: avatar
  src/app/(frontend)/account/signin/page.tsx                       # C6: forgot-password link
  src/collections/Members.ts                                       # F1: avatar field
  src/lib/auth.ts                                                  # F1: depth-1 fetch + avatar helper
  package.json                                                     # E1: seed:doctrine script
```

---

## Phase A — Doctrine schema + types

Three nested Payload collections + a single types/serialise pair on the frontend. No UI yet — Phase B uses these. Mirror the access/versions/livePreview shape from `Miracles.ts` and `Pilgrimages.ts`.

### Task A1: Create DoctrineTracks collection

**Why:** The top-level container in the LMS hierarchy. A track ("Eucharist", "Mariology", "Liturgical Year") groups modules. Schema mirrors the tabs/sidebar pattern used by every other collection in this repo.

**Files:**
- Create: `src/collections/DoctrineTracks.ts`

- [ ] **Step 1: Write the collection**

Create `src/collections/DoctrineTracks.ts` with this exact content:

```ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineTracks: CollectionConfig = {
  slug: 'doctrine-tracks',
  labels: { singular: 'Doctrine Track', plural: 'Doctrine Tracks' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', '_status'],
    description:
      'Top-level LMS container. Each track holds an ordered set of modules. Listed at /doctrine.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/doctrine/${slug}`,
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
              admin: {
                description:
                  '1–2 sentences. Shown on the catalogue plate and the track overview header.',
              },
            },
            {
              name: 'coverPlate',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Hero image for the catalogue plate. 4:5 aspect ratio reads best.',
              },
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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL fragment under /doctrine/.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key for the catalogue. Lower numbers appear first. Ties break alphabetically by title.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this track as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
```

- [ ] **Step 2: Verify**

```bash
pnpm typecheck && pnpm lint
```

(Build will fail until A4 registers the collection — that's expected. Run only typecheck + lint here.)

- [ ] **Step 3: Commit**

```bash
git add 'src/collections/DoctrineTracks.ts'
git commit -m "feat(doctrine): add DoctrineTracks collection"
```

---

### Task A2: Create DoctrineModules collection

**Why:** Middle layer of the hierarchy. A module belongs to exactly one track and groups units. Adds a `track` relationship; otherwise mirrors A1 plus the relationship-scoping admin description.

**Files:**
- Create: `src/collections/DoctrineModules.ts`

- [ ] **Step 1: Write the collection**

Create `src/collections/DoctrineModules.ts`:

```ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineModules: CollectionConfig = {
  slug: 'doctrine-modules',
  labels: { singular: 'Doctrine Module', plural: 'Doctrine Modules' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'track', 'order', '_status'],
    description:
      'A chapter within a doctrine track. Groups units. The {track-slug, slug} pair must be unique — slug uniqueness is scoped to the track.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        // Track is a relationship at this point — use slug only (track resolves
        // server-side when the live-preview page loads).
        const params = new URLSearchParams({
          path: `/doctrine/_/_/${slug}`,
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
            {
              name: 'track',
              type: 'relationship',
              relationTo: 'doctrine-tracks',
              required: true,
              hasMany: false,
              admin: {
                description:
                  'The track this module belongs to. Drag in the studio sidebar to reorder modules within the track.',
              },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'summary',
              type: 'textarea',
              admin: {
                description:
                  '1–2 sentences. Shown on the track overview folio entry and the module overview header.',
              },
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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'URL fragment within the track (/doctrine/{track}/{this slug}). Should be unique within the track; the seed and frontend assume it.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key within the track. Lower numbers appear first. Ties break alphabetically by title.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this module as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
```

Note: Payload's `unique: true` on a single field is global, so we can't enforce {track,slug} uniqueness via the schema alone. The seed script and frontend treat the slug as unique-within-track; an editor entering a duplicate within a track will produce a 404 on the duplicate. That's acceptable for v1 — the studio's UI shows the existing slug list, so duplication is editorially obvious.

- [ ] **Step 2: Verify**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add 'src/collections/DoctrineModules.ts'
git commit -m "feat(doctrine): add DoctrineModules collection"
```

---

### Task A3: Create DoctrineUnits collection

**Why:** Leaf layer. Each unit holds the reading lane (required), optional video/audio uploads, and a `masteryCheck` group with options. Spec §5.2 names every field.

**Files:**
- Create: `src/collections/DoctrineUnits.ts`

- [ ] **Step 1: Write the collection**

Create `src/collections/DoctrineUnits.ts`:

```ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineUnits: CollectionConfig = {
  slug: 'doctrine-units',
  labels: { singular: 'Doctrine Unit', plural: 'Doctrine Units' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'order', '_status'],
    description:
      'A single readable folio. Reading lane is required. Watch (video upload) and Listen (audio upload) lanes are optional — leave empty and the frontend hides those tabs entirely.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/doctrine/_/_/_/${slug}`,
          previewSecret: process.env.PREVIEW_SECRET || '',
          preview: 'true',
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
            {
              name: 'module',
              type: 'relationship',
              relationTo: 'doctrine-modules',
              required: true,
              hasMany: false,
              admin: {
                description:
                  'The module this unit belongs to. Order within the module is set by the `order` sidebar field.',
              },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'introduction',
              type: 'richText',
              admin: {
                description:
                  'Optional short opener. Renders above the lane content on every lane.',
              },
            },
            {
              name: 'lanes',
              type: 'group',
              admin: {
                description:
                  'Three lanes — only Reading is required. Watch and Listen tabs hide automatically when their media is empty.',
              },
              fields: [
                {
                  name: 'reading',
                  type: 'richText',
                  required: true,
                  admin: {
                    description:
                      'Primary lane. Always shown. Default tab when the unit player opens.',
                  },
                },
                {
                  name: 'watchVideo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Optional video upload (MP4/WebM). When present, a "Watch" tab appears in the lane switcher.',
                  },
                },
                {
                  name: 'listenAudio',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Optional audio upload (MP3/WAV). When present, a "Listen" tab appears in the lane switcher.',
                  },
                },
              ],
            },
            {
              name: 'masteryCheck',
              type: 'group',
              admin: {
                description:
                  'Single multiple-choice question shown at the bottom of every lane. Self-graded, gentle — no streaks, no badges. Leave the prompt empty to disable the check entirely.',
              },
              fields: [
                {
                  name: 'prompt',
                  type: 'text',
                  admin: {
                    description:
                      'The question. Spec convention: phrase as "Do you remember…?". Leave empty to skip the check.',
                  },
                },
                {
                  name: 'options',
                  type: 'array',
                  minRows: 0,
                  maxRows: 6,
                  labels: { singular: 'Option', plural: 'Options' },
                  admin: {
                    description:
                      'Up to six options. Mark exactly one as correct. The affirmation is the one-line response shown after the user submits.',
                  },
                  fields: [
                    { name: 'text', type: 'text', required: true },
                    {
                      name: 'isCorrect',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { description: 'Mark exactly one option correct.' },
                    },
                    {
                      name: 'affirmation',
                      type: 'text',
                      admin: {
                        description:
                          'One-line response shown when the user picks this option. For correct options, an affirming line; for incorrect, a gentle correction.',
                      },
                    },
                  ],
                },
              ],
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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'URL fragment within the module (/doctrine/{track}/{module}/{this slug}). Should be unique within the module.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key within the module. Lower numbers appear first. Drives the "Folio iii. of vii." footer numbering and the "Turn page" link target.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this unit as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
```

- [ ] **Step 2: Verify**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add 'src/collections/DoctrineUnits.ts'
git commit -m "feat(doctrine): add DoctrineUnits collection with lanes + masteryCheck groups"
```

---

### Task A4: Register collections + regen types + create wire shapes

**Why:** Three new collections need to be registered with the Payload config so they get tables, REST endpoints, and types. After registration, regenerate `payload-types.ts` and stand up `types.ts` + `serialise.ts` for the doctrine frontend (mirrors `components/atlas/types.ts` + `serialise.ts`).

**Files:**
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts` (auto-regenerated)
- Create: `src/app/(frontend)/components/doctrine/types.ts`
- Create: `src/app/(frontend)/components/doctrine/serialise.ts`

- [ ] **Step 1: Register the three collections in payload.config.ts**

Open `src/payload.config.ts`. The collections list is at line 118:

```ts
collections: [Users, Media, Articles, Miracles, Pilgrimages],
```

Add three imports near the top, alongside the existing collection imports (alphabetical order):

```ts
import { DoctrineModules } from './collections/DoctrineModules'
import { DoctrineTracks } from './collections/DoctrineTracks'
import { DoctrineUnits } from './collections/DoctrineUnits'
```

Then update the collections list:

```ts
collections: [
  Users,
  Media,
  Articles,
  Miracles,
  Pilgrimages,
  DoctrineTracks,
  DoctrineModules,
  DoctrineUnits,
],
```

Order matters for relationships — `DoctrineTracks` must come before `DoctrineModules` (which references it), and `DoctrineModules` before `DoctrineUnits`. Payload tolerates forward references but the conventional order is parent-first.

- [ ] **Step 2: Regenerate types**

```bash
pnpm generate:types
```

This rewrites `src/payload-types.ts`. Expect three new interfaces (`DoctrineTrack`, `DoctrineModule`, `DoctrineUnit`) and matching entries in the `Config` type's `collections` map.

- [ ] **Step 3: Create the frontend types module**

Create `src/app/(frontend)/components/doctrine/types.ts`:

```ts
// src/app/(frontend)/components/doctrine/types.ts
//
// Wire shapes passed from doctrine server pages into the client unit player
// + plate components. Strictly serialisable. Mirrors the atlas/types.ts
// pattern — the server resolves Payload docs and serialises into these.

export type DoctrineTrackSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  coverPlate: { url: string; alt: string } | null
  order: number
  isSample: boolean
}

export type DoctrineModuleSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  trackSlug: string
  trackTitle: string
  order: number
  unitCount: number
  isSample: boolean
}

export type DoctrineUnitSummary = {
  id: string
  slug: string
  title: string
  moduleSlug: string
  moduleTitle: string
  trackSlug: string
  trackTitle: string
  order: number
  hasWatch: boolean
  hasListen: boolean
  isSample: boolean
}

export type DoctrineMasteryOption = {
  text: string
  isCorrect: boolean
  affirmation: string | null
}

export type DoctrineUnitFull = DoctrineUnitSummary & {
  introduction: unknown | null // Lexical JSON
  reading: unknown | null // Lexical JSON
  watchVideoUrl: string | null
  listenAudioUrl: string | null
  masteryPrompt: string | null
  masteryOptions: DoctrineMasteryOption[]
}

const ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
]

export function romanizeLower(n: number): string {
  return (ROMAN[n] ?? String(n)).toLowerCase()
}

export function romanize(n: number): string {
  return ROMAN[n] ?? String(n)
}
```

- [ ] **Step 4: Create the serialise module**

Create `src/app/(frontend)/components/doctrine/serialise.ts`:

```ts
// src/app/(frontend)/components/doctrine/serialise.ts
//
// Payload-doc → wire-shape mappers shared by every server page that hands
// data into doctrine client components. Defensive narrowing at the boundary
// keeps types tight downstream — mirrors components/atlas/serialise.ts.
import {
  type DoctrineMasteryOption,
  type DoctrineModuleSummary,
  type DoctrineTrackSummary,
  type DoctrineUnitFull,
  type DoctrineUnitSummary,
} from './types'

export function toTrackSummary(raw: unknown): DoctrineTrackSummary {
  const r = raw as Record<string, unknown>
  const cover =
    r.coverPlate && typeof r.coverPlate === 'object'
      ? (r.coverPlate as Record<string, unknown>)
      : null
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    summary: typeof r.summary === 'string' ? r.summary : null,
    coverPlate:
      cover && typeof cover.url === 'string'
        ? { url: cover.url as string, alt: typeof cover.alt === 'string' ? cover.alt : '' }
        : null,
    order: Number(r.order ?? 0),
    isSample: Boolean(r._isSample),
  }
}

export function toModuleSummary(raw: unknown, unitCount = 0): DoctrineModuleSummary {
  const r = raw as Record<string, unknown>
  const trackRaw = r.track
  const track =
    trackRaw && typeof trackRaw === 'object'
      ? (trackRaw as Record<string, unknown>)
      : null
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    summary: typeof r.summary === 'string' ? r.summary : null,
    trackSlug: track && typeof track.slug === 'string' ? track.slug : '',
    trackTitle: track && typeof track.title === 'string' ? track.title : '',
    order: Number(r.order ?? 0),
    unitCount,
    isSample: Boolean(r._isSample),
  }
}

export function toUnitSummary(raw: unknown): DoctrineUnitSummary {
  const r = raw as Record<string, unknown>
  const moduleRaw = r.module
  const m =
    moduleRaw && typeof moduleRaw === 'object'
      ? (moduleRaw as Record<string, unknown>)
      : null
  const trackRaw = m?.track
  const t =
    trackRaw && typeof trackRaw === 'object'
      ? (trackRaw as Record<string, unknown>)
      : null
  const lanes =
    r.lanes && typeof r.lanes === 'object'
      ? (r.lanes as Record<string, unknown>)
      : null
  const watchVideo = lanes?.watchVideo
  const listenAudio = lanes?.listenAudio
  const hasWatch =
    typeof watchVideo === 'object' &&
    watchVideo !== null &&
    typeof (watchVideo as Record<string, unknown>).url === 'string'
  const hasListen =
    typeof listenAudio === 'object' &&
    listenAudio !== null &&
    typeof (listenAudio as Record<string, unknown>).url === 'string'
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    moduleSlug: m && typeof m.slug === 'string' ? m.slug : '',
    moduleTitle: m && typeof m.title === 'string' ? m.title : '',
    trackSlug: t && typeof t.slug === 'string' ? t.slug : '',
    trackTitle: t && typeof t.title === 'string' ? t.title : '',
    order: Number(r.order ?? 0),
    hasWatch,
    hasListen,
    isSample: Boolean(r._isSample),
  }
}

export function toUnitFull(raw: unknown): DoctrineUnitFull {
  const summary = toUnitSummary(raw)
  const r = raw as Record<string, unknown>
  const lanes =
    r.lanes && typeof r.lanes === 'object'
      ? (r.lanes as Record<string, unknown>)
      : null
  const watchVideo = lanes?.watchVideo
  const listenAudio = lanes?.listenAudio
  const watchUrl =
    typeof watchVideo === 'object' &&
    watchVideo !== null &&
    typeof (watchVideo as Record<string, unknown>).url === 'string'
      ? ((watchVideo as Record<string, unknown>).url as string)
      : null
  const listenUrl =
    typeof listenAudio === 'object' &&
    listenAudio !== null &&
    typeof (listenAudio as Record<string, unknown>).url === 'string'
      ? ((listenAudio as Record<string, unknown>).url as string)
      : null
  const mastery =
    r.masteryCheck && typeof r.masteryCheck === 'object'
      ? (r.masteryCheck as Record<string, unknown>)
      : null
  const optionsRaw = Array.isArray(mastery?.options) ? mastery!.options : []
  const masteryOptions: DoctrineMasteryOption[] = optionsRaw.map((o) => {
    const oo = o as Record<string, unknown>
    return {
      text: typeof oo.text === 'string' ? oo.text : '',
      isCorrect: Boolean(oo.isCorrect),
      affirmation: typeof oo.affirmation === 'string' ? oo.affirmation : null,
    }
  })
  return {
    ...summary,
    introduction: (r.introduction as unknown) ?? null,
    reading: (lanes?.reading as unknown) ?? null,
    watchVideoUrl: watchUrl,
    listenAudioUrl: listenUrl,
    masteryPrompt:
      mastery && typeof mastery.prompt === 'string' && mastery.prompt.trim()
        ? (mastery.prompt as string)
        : null,
    masteryOptions,
  }
}
```

Note: `introduction` is a top-level field on the unit (not nested under `lanes`), so we read it from `r` directly. `reading`, `watchVideo`, and `listenAudio` are all under `lanes`.

- [ ] **Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/payload.config.ts' 'src/payload-types.ts' 'src/app/(frontend)/components/doctrine/types.ts' 'src/app/(frontend)/components/doctrine/serialise.ts'
git commit -m "feat(doctrine): register collections, regen types, add wire shapes + serialisers"
```

---

## Phase B — Catalogue + track + module pages

Three public pages — the catalogue, the track overview, and the module overview. They follow the editorial reading shape (`max-w-[65ch]` body, vellum background, no full-bleed lock — these are long-form pages, NOT atlas-style work surfaces). Auth gates land in Phase D — at this stage, all three pages render for everyone.

### Task B1: Replace ComingSoon with the doctrine catalogue

**Why:** `/doctrine` currently renders `<ComingSoon>`. Replace with a server page that lists all published `DoctrineTracks` as plates. Mirrors the shape of `/atlas/pilgrimages` gallery — a card grid with a hero band above. Each plate links to `/doctrine/{trackSlug}`.

**Files:**
- Create: `src/app/(frontend)/components/doctrine/track-plate.tsx`
- Modify: `src/app/(frontend)/doctrine/page.tsx`

- [ ] **Step 1: Create the TrackPlate component**

Create `src/app/(frontend)/components/doctrine/track-plate.tsx`:

```tsx
// src/app/(frontend)/components/doctrine/track-plate.tsx
import Image from 'next/image'
import Link from 'next/link'

import { romanize, type DoctrineTrackSummary } from './types'

export function TrackPlate({
  track,
  index,
  moduleCount,
}: {
  track: DoctrineTrackSummary
  index: number
  moduleCount: number
}) {
  const numeral = romanize(index + 1)
  return (
    <Link
      href={`/doctrine/${track.slug}`}
      className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl border border-ink/10 bg-parchment shadow-altar transition-transform hover:-translate-y-1"
    >
      {track.coverPlate ? (
        <Image
          src={track.coverPlate.url}
          alt={track.coverPlate.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          unoptimized={track.coverPlate.url.startsWith('/api/')}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-ink to-rubric-deep opacity-90" />
      )}

      <div
        aria-hidden
        className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-gilt/70 to-transparent"
      />

      <div className="relative space-y-2 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-6 py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gilt">
          Track {numeral}
          {track.isSample ? ' · [Sample]' : ''}
        </p>
        <h2 className="font-display text-3xl italic leading-tight tracking-tight text-vellum md:text-4xl">
          {track.title}
        </h2>
        {track.summary ? (
          <p className="max-w-[40ch] text-sm leading-relaxed text-vellum/85">
            {track.summary}
          </p>
        ) : null}
        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum/70">
          {moduleCount} {moduleCount === 1 ? 'module' : 'modules'} · Begin reading →
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Replace `/doctrine/page.tsx`**

Open `src/app/(frontend)/doctrine/page.tsx`. Currently:

```tsx
import { ComingSoon } from '../components/coming-soon'

export const metadata = { title: 'Doctrine — coming soon' }

export default function DoctrineComing() {
  return (
    <ComingSoon
      pillar="Doctrine"
      numeral="II"
      intent="A breviary-paced LMS over councils, encyclicals, the Catechism — read, watch, listen — with gentle mastery checks."
      comingIn="Opening this week."
    />
  )
}
```

Replace the entire file with:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { TrackPlate } from '../components/doctrine/track-plate'
import { toTrackSummary } from '../components/doctrine/serialise'
import { payload } from '@/lib/payload'

export const metadata: Metadata = {
  title: 'Doctrine',
  description:
    'A breviary-paced LMS over councils, encyclicals, the Catechism — read, watch, listen — with gentle mastery checks.',
}

export default async function DoctrineCataloguePage() {
  const p = await payload()

  const tracksResult = await p.find({
    collection: 'doctrine-tracks',
    where: { _status: { equals: 'published' } },
    limit: 100,
    sort: ['order', 'title'],
    depth: 1,
  })

  if (tracksResult.docs.length === 0) {
    return <DoctrineEmpty />
  }

  // Module counts per track — one query, group in memory.
  const modulesResult = await p.find({
    collection: 'doctrine-modules',
    where: { _status: { equals: 'published' } },
    limit: 500,
    depth: 0,
    sort: 'order',
  })
  const countsByTrack = new Map<string, number>()
  for (const m of modulesResult.docs) {
    const trackId =
      typeof m.track === 'object' && m.track !== null
        ? String((m.track as { id: number }).id)
        : String(m.track)
    countsByTrack.set(trackId, (countsByTrack.get(trackId) ?? 0) + 1)
  }

  const tracks = tracksResult.docs.map(toTrackSummary)

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate II · Doctrine
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The breviary of formation.
      </h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
        Read, watch, or listen — three lanes through the same folio. Each unit closes
        with a single, gentle question. Pick up where you left off across any device.
      </p>

      <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tracks.map((t, i) => (
          <li key={t.id}>
            <TrackPlate
              track={t}
              index={i}
              moduleCount={countsByTrack.get(t.id) ?? 0}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}

function DoctrineEmpty() {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate II · Doctrine
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        The breviary opens soon.
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">
        Once the studio holds doctrine tracks, this page becomes a catalogue of
        formation paths.
      </p>
      <Link
        href="/atlas"
        className="mt-10 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
      >
        Walk the Atlas instead →
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. The route returns `DoctrineEmpty` until the seed runs, but the build must succeed.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(frontend)/components/doctrine/track-plate.tsx' 'src/app/(frontend)/doctrine/page.tsx'
git commit -m "feat(doctrine): replace coming-soon stub with track catalogue"
```

---

### Task B2: Track overview page (/doctrine/[track])

**Why:** Shows the cover plate at the top and the modules listed below as folio entries. Public — no auth gate. Each module entry links to `/doctrine/{trackSlug}/{moduleSlug}`.

**Files:**
- Create: `src/app/(frontend)/components/doctrine/module-folio.tsx`
- Create: `src/app/(frontend)/doctrine/[track]/page.tsx`

- [ ] **Step 1: Create the ModuleFolio component**

Create `src/app/(frontend)/components/doctrine/module-folio.tsx`:

```tsx
// src/app/(frontend)/components/doctrine/module-folio.tsx
import Link from 'next/link'

import { romanize, type DoctrineModuleSummary } from './types'

export function ModuleFolio({
  module,
  index,
}: {
  module: DoctrineModuleSummary
  index: number
}) {
  const numeral = romanize(index + 1)
  return (
    <Link
      href={`/doctrine/${module.trackSlug}/${module.slug}`}
      className="group block py-7"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Module {numeral}
        {module.isSample ? ' · [Sample]' : ''} · {module.unitCount}{' '}
        {module.unitCount === 1 ? 'unit' : 'units'}
      </p>
      <h3 className="mt-2 font-display text-3xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
        {module.title}
      </h3>
      {module.summary ? (
        <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
          {module.summary}
        </p>
      ) : null}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Begin module →
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Create the track overview page**

Create `src/app/(frontend)/doctrine/[track]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ModuleFolio } from '../../components/doctrine/module-folio'
import {
  toModuleSummary,
  toTrackSummary,
} from '../../components/doctrine/serialise'
import { payload } from '@/lib/payload'

type Params = Promise<{ track: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { track: trackSlug } = await params
  const p = await payload()
  const r = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const t = r.docs[0]
  if (!t) return { title: 'Doctrine — not found' }
  const title = typeof t.title === 'string' ? t.title : 'Track'
  const desc = typeof t.summary === 'string' ? t.summary : undefined
  return { title: `${title} · Doctrine`, description: desc }
}

export default async function DoctrineTrackPage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug } = await params
  const p = await payload()

  const trackResult = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  const trackDoc = trackResult.docs[0]
  if (!trackDoc) notFound()
  const track = toTrackSummary(trackDoc)

  const modulesResult = await p.find({
    collection: 'doctrine-modules',
    where: {
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 100,
    sort: ['order', 'title'],
    depth: 1,
  })

  // Unit counts per module.
  const moduleIds = modulesResult.docs.map((m) => m.id)
  const unitsResult =
    moduleIds.length > 0
      ? await p.find({
          collection: 'doctrine-units',
          where: {
            module: { in: moduleIds },
            _status: { equals: 'published' },
          },
          limit: 500,
          depth: 0,
        })
      : { docs: [] as Array<{ module: number | { id: number } }> }
  const countsByModule = new Map<number, number>()
  for (const u of unitsResult.docs) {
    const moduleId =
      typeof u.module === 'object' && u.module !== null
        ? Number((u.module as { id: number }).id)
        : Number(u.module)
    countsByModule.set(moduleId, (countsByModule.get(moduleId) ?? 0) + 1)
  }

  const modules = modulesResult.docs.map((m) =>
    toModuleSummary(m, countsByModule.get(m.id as number) ?? 0),
  )

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <Link
        href="/doctrine"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        All tracks
      </Link>

      {track.coverPlate ? (
        <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment">
          <Image
            src={track.coverPlate.url}
            alt={track.coverPlate.alt || track.title}
            fill
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
            unoptimized={track.coverPlate.url.startsWith('/api/')}
            priority
          />
        </div>
      ) : null}

      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Doctrine track{track.isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {track.title}
      </h1>
      {track.summary ? (
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {track.summary}
        </p>
      ) : null}

      {modules.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          This track has no modules yet.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {modules.map((m, i) => (
            <li key={m.id}>
              <ModuleFolio module={m} index={i} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(frontend)/components/doctrine/module-folio.tsx' 'src/app/(frontend)/doctrine/[track]/page.tsx'
git commit -m "feat(doctrine): track overview page with cover plate + module folios"
```

---

### Task B3: Module overview page (/doctrine/[track]/[module])

**Why:** Lists the module's units as folio entries. Each unit links to `/doctrine/{track}/{module}/{unit}`. Public for now — Phase D4 retrofits the auth gate.

**Files:**
- Create: `src/app/(frontend)/components/doctrine/unit-folio.tsx`
- Create: `src/app/(frontend)/doctrine/[track]/[module]/page.tsx`

- [ ] **Step 1: Create the UnitFolio component**

Create `src/app/(frontend)/components/doctrine/unit-folio.tsx`:

```tsx
// src/app/(frontend)/components/doctrine/unit-folio.tsx
import Link from 'next/link'

import { romanize, type DoctrineUnitSummary } from './types'

export function UnitFolio({
  unit,
  index,
}: {
  unit: DoctrineUnitSummary
  index: number
}) {
  const numeral = romanize(index + 1)
  const lanes: string[] = ['Read']
  if (unit.hasWatch) lanes.push('Watch')
  if (unit.hasListen) lanes.push('Listen')
  return (
    <Link
      href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}/${unit.slug}`}
      className="group block py-6"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Folio {numeral.toLowerCase()}
        {unit.isSample ? ' · [Sample]' : ''} · {lanes.join(' · ')}
      </p>
      <h3 className="mt-2 font-display text-2xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-3xl">
        {unit.title}
      </h3>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Open folio →
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Create the module overview page**

Create `src/app/(frontend)/doctrine/[track]/[module]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { UnitFolio } from '../../../components/doctrine/unit-folio'
import { toUnitSummary } from '../../../components/doctrine/serialise'
import { payload } from '@/lib/payload'

type Params = Promise<{ track: string; module: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { track: trackSlug, module: moduleSlug } = await params
  const p = await payload()
  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug } },
    limit: 1,
    depth: 0,
  })
  const t = trackR.docs[0]
  if (!t) return { title: 'Doctrine — not found' }
  const moduleR = await p.find({
    collection: 'doctrine-modules',
    where: { slug: { equals: moduleSlug }, track: { equals: t.id } },
    limit: 1,
    depth: 0,
  })
  const m = moduleR.docs[0]
  if (!m) return { title: 'Doctrine — not found' }
  const title = typeof m.title === 'string' ? m.title : 'Module'
  const desc = typeof m.summary === 'string' ? m.summary : undefined
  return { title: `${title} · ${t.title} · Doctrine`, description: desc }
}

export default async function DoctrineModulePage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug, module: moduleSlug } = await params
  const p = await payload()

  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const trackDoc = trackR.docs[0]
  if (!trackDoc) notFound()

  const moduleR = await p.find({
    collection: 'doctrine-modules',
    where: {
      slug: { equals: moduleSlug },
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 1,
  })
  const moduleDoc = moduleR.docs[0]
  if (!moduleDoc) notFound()

  const unitsR = await p.find({
    collection: 'doctrine-units',
    where: {
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 200,
    sort: ['order', 'title'],
    depth: 2,
  })

  const units = unitsR.docs.map(toUnitSummary)
  const moduleTitle = String(moduleDoc.title ?? '')
  const trackTitle = String(trackDoc.title ?? '')
  const summary =
    typeof moduleDoc.summary === 'string' ? moduleDoc.summary : null
  const isSample = Boolean(moduleDoc._isSample)

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <Link
        href={`/doctrine/${trackSlug}`}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        {trackTitle}
      </Link>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Doctrine module{isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {moduleTitle}
      </h1>
      {summary ? (
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {summary}
        </p>
      ) : null}

      {units.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          This module has no units yet.
        </p>
      ) : (
        <ul className="mt-12 divide-y divide-ink/10">
          {units.map((u, i) => (
            <li key={u.id}>
              <UnitFolio unit={u} index={i} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/(frontend)/components/doctrine/unit-folio.tsx' 'src/app/(frontend)/doctrine/[track]/[module]/page.tsx'
git commit -m "feat(doctrine): module overview page with unit folios"
```

---

## Phase C — Members + auth foundation

Payload v3 supports multiple auth-enabled collections. We add `Members` (end-users) alongside the existing `Users` (stewards). Studio remains keyed to `Users` via `admin.user: 'users'` — Members can never reach `/admin`. Cookies share the `payload-token` name, but the JWT encodes the collection slug, so `payload.auth({ headers })` returns the right shape per request.

### Task C1: Create the Members collection

**Why:** End-users sign up here. Email/password only — no Google OAuth this round (per user 2026-05-07). Email verification is enabled; if SMTP is unconfigured, Payload logs the verification email to the server console (acceptable for local dev).

**Files:**
- Create: `src/collections/Members.ts`

- [ ] **Step 1: Write the collection**

Create `src/collections/Members.ts`:

```ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['displayName', 'email', '_verified', 'updatedAt'],
    description:
      'End-user accounts for the Doctrine LMS. Read access from the studio is admin-only — members cannot themselves access /admin.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000, // 10 minutes
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${SERVER_URL}/account/verify-email?token=${encodeURIComponent(token ?? '')}`
        return `
          <p>Welcome to Tantum Ergo.</p>
          <p>Click the link below to verify your email and finish signing up:</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not request this account, you can safely ignore this message.</p>
        `
      },
      generateEmailSubject: () => 'Verify your Tantum Ergo account',
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args && typeof args === 'object' && 'token' in args
          ? String((args as { token?: string }).token ?? '')
          : ''
        const url = `${SERVER_URL}/account/reset-password?token=${encodeURIComponent(token)}`
        return `
          <p>You asked to reset your Tantum Ergo password.</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not, you can safely ignore this message.</p>
        `
      },
    },
  },
  access: {
    // Members can read only their own document. Stewards (Users with any
    // role) can read all members for support purposes.
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { id: { equals: req.user.id } }
    },
    // Anyone (including unauthenticated visitors) can create — that's signup.
    create: () => true,
    // Members can update only themselves; admins can update anyone.
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users' && req.user.role === 'admin') return true
      if (req.user.collection === 'members') {
        return { id: { equals: req.user.id } }
      }
      return false
    },
    // Only admin stewards can delete a member.
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
    // Hide from the studio sidebar for non-admins. Admins still see it.
    admin: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description:
          'Optional display name shown in the header dropdown. Falls back to the email local-part when empty.',
      },
    },
  ],
}
```

- [ ] **Step 2: Verify**

```bash
pnpm typecheck && pnpm lint
```

(Build will fail until C2 registers the collection — expected.)

- [ ] **Step 3: Commit**

```bash
git add 'src/collections/Members.ts'
git commit -m "feat(auth): add Members collection (Payload auth, email verify, forgot-password)"
```

---

### Task C2: Register Members + write the auth helper lib

**Why:** Add `Members` to the `payload.config.ts` collections list, regenerate types, and stand up `src/lib/auth.ts` — a thin server-only helper that exposes `getMember()` (for any server component) and `requireMember()` (which redirects to sign-in when called by an unauthenticated visitor).

**Files:**
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts` (auto-regenerated)
- Create: `src/lib/auth.ts`

- [ ] **Step 1: Register Members in payload.config.ts**

Open `src/payload.config.ts`. Add the import alongside the other collection imports (alphabetical):

```ts
import { Members } from './collections/Members'
```

Update the collections list to include `Members` immediately after `Users` (so it sits next to the other auth collection):

```ts
collections: [
  Users,
  Members,
  Media,
  Articles,
  Miracles,
  Pilgrimages,
  DoctrineTracks,
  DoctrineModules,
  DoctrineUnits,
],
```

- [ ] **Step 2: Regenerate types**

```bash
pnpm generate:types
```

Confirm `src/payload-types.ts` now has a `Member` interface and that the `Config` type's `collections.members` slot is populated.

- [ ] **Step 3: Create the auth helper**

Create `src/lib/auth.ts`:

```ts
// src/lib/auth.ts
//
// Server-only auth helpers for end-user (Member) sessions. The studio
// (Users collection) is unaffected — this layer only reads/writes the
// payload-token cookie set by /api/members/login.
import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from './payload'

import type { Member } from '@/payload-types'

/**
 * Returns the current Member if the request carries a valid payload-token
 * cookie issued by /api/members/login. Returns null otherwise. Never throws.
 *
 * Note: payload.auth() returns whichever auth collection's user is in the
 * cookie — could be Members OR Users (stewards). We narrow to Members here;
 * a steward signed in to /admin will read as null from this function (which
 * is what we want — stewards aren't end-users of the LMS).
 */
export async function getMember(): Promise<Member | null> {
  try {
    const p = await payload()
    const result = await p.auth({ headers: await headers() })
    if (!result?.user) return null
    if (result.user.collection !== 'members') return null
    return result.user as Member
  } catch {
    // payload.auth throws on malformed JWTs / expired tokens. Treat any
    // failure as "no session" and let the caller redirect to signin.
    return null
  }
}

/**
 * Server-component helper: read the current Member or redirect to sign-in
 * with `?next=` set to the caller's path. Use at the top of any page that
 * requires authentication.
 */
export async function requireMember(currentPath: string): Promise<Member> {
  const member = await getMember()
  if (member) return member
  const next = encodeURIComponent(currentPath)
  redirect(`/account/signin?next=${next}`)
}

/**
 * Display name fallback — used by the header dropdown. Mirrors the
 * collection's admin.useAsTitle, but explicit so the frontend doesn't
 * have to know the field's defaulting rule.
 */
export function memberDisplayName(member: Member): string {
  if (member.displayName?.trim()) return member.displayName
  return member.email.split('@')[0] ?? member.email
}
```

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/payload.config.ts' 'src/payload-types.ts' 'src/lib/auth.ts'
git commit -m "feat(auth): register Members collection, regen types, add server auth helpers"
```

---

### Task C3: Sign-in page + server action

**Why:** A vellum-toned sign-in page that calls `payload.login()` server-side and sets the `payload-token` cookie. On success, redirects to the `?next=` param if present, else `/doctrine`. Errors render in a small italic line below the form.

**Files:**
- Create: `src/app/(frontend)/components/account/auth-shell.tsx`
- Create: `src/app/(frontend)/account/signin/page.tsx`
- Create: `src/app/(frontend)/account/signin/actions.ts`

- [ ] **Step 1: Create the shared auth shell**

Create `src/app/(frontend)/components/account/auth-shell.tsx`:

```tsx
// src/app/(frontend)/components/account/auth-shell.tsx
import Link from 'next/link'
import type { ReactNode } from 'react'

export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-md flex-col justify-center px-5 py-20 sm:px-8">
      <Link
        href="/"
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
      >
        ← Tantum Ergo
      </Link>
      <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {title}
      </h1>
      {intro ? (
        <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-ink-soft">
          {intro}
        </p>
      ) : null}
      <div className="mt-10">{children}</div>
    </main>
  )
}
```

- [ ] **Step 2: Create the sign-in server action**

Create `src/app/(frontend)/account/signin/actions.ts`:

```ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from '@/lib/payload'

export type SignInState = {
  error: string | null
}

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nextRaw = String(formData.get('next') ?? '')
  const next = isSafeRedirect(nextRaw) ? nextRaw : '/doctrine'

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  let token: string
  let exp: number
  try {
    const p = await payload()
    const result = await p.login({
      collection: 'members',
      data: { email, password },
    })
    if (!result?.token || !result.exp) {
      return { error: 'Sign-in failed. Please try again.' }
    }
    token = result.token
    exp = result.exp
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign-in failed.'
    if (/verified|verify/i.test(msg)) {
      return {
        error:
          'Please verify your email first — check the link we sent when you signed up.',
      }
    }
    if (/locked/i.test(msg)) {
      return {
        error:
          'Too many failed attempts. Try again in a few minutes, or reset your password.',
      }
    }
    return { error: 'Email or password is incorrect.' }
  }

  const store = await cookies()
  store.set('payload-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(exp * 1000),
    path: '/',
  })

  redirect(next)
}

// Only allow same-origin paths starting with "/" — never an absolute URL or
// a "//evil.com" protocol-relative jump.
function isSafeRedirect(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}
```

- [ ] **Step 3: Create the sign-in page**

Create `src/app/(frontend)/account/signin/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { signInAction, type SignInState } from './actions'

const INITIAL: SignInState = { error: null }

export default function SignInPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const verified = searchParams.get('verified') === '1'

  const [state, action, pending] = useActionState(signInAction, INITIAL)

  return (
    <AuthShell
      eyebrow="Account · Sign in"
      title="Welcome back."
      intro="Sign in to resume your reading and keep your progress in step across your devices."
    >
      {verified ? (
        <p className="mb-6 rounded-xl border border-incense/30 bg-incense/10 px-4 py-3 font-display text-base italic leading-relaxed text-ink">
          Your email is verified — go ahead and sign in.
        </p>
      ) : null}
      <form action={action} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <Field name="email" type="email" label="Email" autoComplete="email" required />
        <Field
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          required
        />
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        New here?{' '}
        <Link
          href={next ? `/account/signup?next=${encodeURIComponent(next)}` : '/account/signup'}
          className="text-ink underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
      />
    </label>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/components/account/auth-shell.tsx' 'src/app/(frontend)/account/signin'
git commit -m "feat(auth): sign-in page + server action with safe-redirect handling"
```

---

### Task C4: Sign-up page + verify-email page

**Why:** Sign-up creates a Member via `payload.create()`. Because `auth.verify` is enabled on Members, the doc is created with `_verified: false` and Payload sends a verification email automatically (or logs it to the console when SMTP is unconfigured — Payload's default behavior). The verify-email page calls Payload's `verifyEmail()` REST endpoint with the token from the URL, then redirects to `/account/signin?verified=1`.

**Files:**
- Create: `src/app/(frontend)/account/signup/page.tsx`
- Create: `src/app/(frontend)/account/signup/actions.ts`
- Create: `src/app/(frontend)/account/verify-email/page.tsx`

- [ ] **Step 1: Create the sign-up server action**

Create `src/app/(frontend)/account/signup/actions.ts`:

```ts
'use server'

import { payload } from '@/lib/payload'

export type SignUpState = {
  error: string | null
  success: boolean
}

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const displayName = String(formData.get('displayName') ?? '').trim()

  if (!email || !password) {
    return { error: 'Email and password are required.', success: false }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.', success: false }
  }

  try {
    const p = await payload()
    await p.create({
      collection: 'members',
      data: {
        email,
        password,
        displayName: displayName || undefined,
      },
    })
    return { error: null, success: true }
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign-up failed.'
    if (/duplicate|unique|already/i.test(msg)) {
      return {
        error: 'An account with that email already exists. Try signing in.',
        success: false,
      }
    }
    return { error: msg, success: false }
  }
}
```

- [ ] **Step 2: Create the sign-up page**

Create `src/app/(frontend)/account/signup/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { signUpAction, type SignUpState } from './actions'

const INITIAL: SignUpState = { error: null, success: false }

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const [state, action, pending] = useActionState(signUpAction, INITIAL)

  if (state.success) {
    return (
      <AuthShell
        eyebrow="Account · Verify your email"
        title="Almost in."
        intro="We sent a verification link to your inbox. Click it to finish signing up — once verified, you can sign in and pick up your reading."
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Already verified?{' '}
          <Link
            href={next ? `/account/signin?next=${encodeURIComponent(next)}` : '/account/signin'}
            className="text-ink underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Create"
      title="Begin formation."
      intro="Make an account so your reading position carries across your devices. We'll only ask for your email and a password."
    >
      <form action={action} className="space-y-5">
        <Field name="displayName" type="text" label="Display name (optional)" autoComplete="name" />
        <Field name="email" type="email" label="Email" autoComplete="email" required />
        <Field
          name="password"
          type="password"
          label="Password (8+ chars)"
          autoComplete="new-password"
          required
        />
        <Field
          name="confirm"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          required
        />
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        Already have an account?{' '}
        <Link
          href={next ? `/account/signin?next=${encodeURIComponent(next)}` : '/account/signin'}
          className="text-ink underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
      />
    </label>
  )
}
```

- [ ] **Step 3: Create the verify-email page**

Create `src/app/(frontend)/account/verify-email/page.tsx`:

```tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthShell } from '../../components/account/auth-shell'
import { payload } from '@/lib/payload'

type SearchParams = Promise<{ token?: string }>

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account · Verify"
        title="Missing token."
        intro="The verification link is incomplete. Try opening the link from your inbox again, or sign up to resend."
      >
        <Link
          href="/account/signup"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          Back to sign-up →
        </Link>
      </AuthShell>
    )
  }

  let ok = false
  try {
    const p = await payload()
    ok = await p.verifyEmail({ collection: 'members', token })
  } catch {
    ok = false
  }

  if (ok) {
    redirect('/account/signin?verified=1')
  }

  return (
    <AuthShell
      eyebrow="Account · Verify"
      title="That link expired."
      intro="The verification link is no longer valid. Sign up again with the same email to get a fresh link, or sign in if your email was already verified."
    >
      <div className="flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link href="/account/signup" className="text-ink underline-offset-4 hover:underline">
          Resend verification →
        </Link>
        <Link href="/account/signin" className="text-ink-soft hover:text-ink">
          Or sign in
        </Link>
      </div>
    </AuthShell>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/account/signup' 'src/app/(frontend)/account/verify-email'
git commit -m "feat(auth): sign-up + email verification pages with server actions"
```

---

### Task C5: Sign-out route + header account menu (desktop + mobile drawer)

**Why:** A POST `/account/sign-out` route clears the cookie and redirects home. The site header gains a small account widget — signed-out shows "Sign in" as a nav item; signed-in shows the member's display name in the About-style popover with a sign-out button. The mobile drawer mirrors this in its bottom area.

**Files:**
- Create: `src/app/(frontend)/account/sign-out/route.ts`
- Create: `src/app/(frontend)/components/account/header-account-menu.tsx`
- Modify: `src/app/(frontend)/components/site-header.tsx`
- Modify: `src/app/(frontend)/components/mobile-drawer.tsx`

- [ ] **Step 1: Create the sign-out route**

Create `src/app/(frontend)/account/sign-out/route.ts`:

```ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  const store = await cookies()
  store.delete('payload-token')

  const url = new URL(request.url)
  const next = url.searchParams.get('next')
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return NextResponse.redirect(new URL(target, SERVER_URL), { status: 303 })
}

// GET-as-POST fallback so browsers without JS can sign out via a plain link.
export const GET = POST
```

- [ ] **Step 2: Create the header account menu (client)**

Create `src/app/(frontend)/components/account/header-account-menu.tsx`:

```tsx
'use client'

import Link from 'next/link'

export function HeaderAccountMenu({
  displayName,
  tone,
}: {
  displayName: string | null
  tone: 'light' | 'dark'
}) {
  const linkClass =
    tone === 'light'
      ? 'text-vellum/85 hover:text-gilt [text-shadow:0_1px_8px_rgba(12,10,8,0.7)]'
      : 'text-ink-soft hover:text-ink'
  const panelClass =
    tone === 'light'
      ? 'border-vellum/10 bg-ink/85 backdrop-blur'
      : 'border-ink/10 bg-vellum'
  const itemClass =
    tone === 'light'
      ? 'text-vellum hover:bg-vellum/10'
      : 'text-ink hover:bg-vellum-deep'

  if (!displayName) {
    return (
      <Link
        href="/account/signin"
        className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${linkClass}`}
      >
        Sign in
      </Link>
    )
  }

  return (
    <details className="relative">
      <summary
        className={`cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${linkClass}`}
      >
        {displayName} ⌄
      </summary>
      <div className={`absolute right-0 mt-3 w-56 rounded-xl border p-2 shadow-altar ${panelClass}`}>
        <Link href="/doctrine" className={`block rounded-md px-3 py-2 text-sm ${itemClass}`}>
          My doctrine
        </Link>
        <form action="/account/sign-out" method="post" className="block">
          <button
            type="submit"
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${itemClass}`}
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
```

- [ ] **Step 3: Wire the account menu into SiteHeader**

Open `src/app/(frontend)/components/site-header.tsx`. The current file is a `'use client'` component — we need the displayName from a server source. The cleanest move is to convert the header to a server component that does the auth read, but it currently uses `usePathname()` for the over-dark detection. We'll split:

- Keep the client component, rename to `SiteHeaderClient`, accept `displayName` as a prop.
- Add a server `SiteHeader` wrapper that calls `getMember()` and passes `displayName` down.

Replace the entire contents of `src/app/(frontend)/components/site-header.tsx` with:

```tsx
import { Suspense } from 'react'

import { getMember, memberDisplayName } from '@/lib/auth'

import { SiteHeaderClient } from './site-header-client'

export async function SiteHeader() {
  // The header lives in the root layout, so it runs on every navigation.
  // Auth is a single DB lookup keyed on the token cookie; cheap enough.
  const member = await getMember()
  const displayName = member ? memberDisplayName(member) : null
  return (
    <Suspense fallback={null}>
      <SiteHeaderClient displayName={displayName} />
    </Suspense>
  )
}
```

- [ ] **Step 4: Move the existing client logic to its own file**

Create `src/app/(frontend)/components/site-header-client.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Wordmark } from '@/components/brand/wordmark'

import { HeaderAccountMenu } from './account/header-account-menu'
import { MobileDrawer } from './mobile-drawer'

const NAV = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/doctrine', label: 'Doctrine' },
  { href: '/catechist', label: 'Catechist' },
  { href: '/reading', label: 'Reading' },
] as const

export function SiteHeaderClient({
  displayName,
}: {
  displayName: string | null
}) {
  const [open, setOpen] = useState(false)
  // Only the home page renders a full-bleed dark hero; the header floats over
  // it. Every other page is on vellum, so the header sits in normal flow.
  const overDark = usePathname() === '/'
  const positioning = overDark ? 'absolute inset-x-0 top-0 z-20' : 'relative'
  const navTone = overDark
    ? 'text-vellum/85 hover:text-gilt [text-shadow:0_1px_8px_rgba(12,10,8,0.7)]'
    : 'text-ink-soft hover:text-ink'
  const aboutPanel = overDark
    ? 'border-vellum/10 bg-ink/85 backdrop-blur'
    : 'border-ink/10 bg-vellum'
  const aboutLink = overDark
    ? 'text-vellum hover:bg-vellum/10'
    : 'text-ink hover:bg-vellum-deep'
  const burger = overDark ? 'border-vellum/30 bg-transparent' : 'border-ink/15'
  const burgerBar = overDark ? 'bg-vellum' : 'bg-ink'

  return (
    <>
      <header
        className={`${positioning} mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 md:py-6`}
      >
        <Link href="/" className="block">
          <Wordmark tone={overDark ? 'light' : 'dark'} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${navTone}`}
            >
              {item.label}
            </Link>
          ))}
          <details className="relative">
            <summary
              className={`cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${navTone}`}
            >
              About ⌄
            </summary>
            <div className={`absolute right-0 mt-3 w-48 rounded-xl border p-2 shadow-altar ${aboutPanel}`}>
              <Link href="/manifesto" className={`block rounded-md px-3 py-2 text-sm ${aboutLink}`}>
                Manifesto
              </Link>
              <Link href="/credits" className={`block rounded-md px-3 py-2 text-sm ${aboutLink}`}>
                Credits
              </Link>
            </div>
          </details>
          <HeaderAccountMenu
            displayName={displayName}
            tone={overDark ? 'light' : 'dark'}
          />
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className={`grid h-10 w-10 place-items-center rounded-full border md:hidden ${burger}`}
        >
          <span className="flex flex-col gap-[3px]">
            <span className={`h-px w-5 ${burgerBar}`} />
            <span className={`h-px w-5 ${burgerBar}`} />
            <span className={`h-px w-5 ${burgerBar}`} />
          </span>
        </button>
      </header>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        displayName={displayName}
      />
    </>
  )
}
```

- [ ] **Step 5: Update MobileDrawer to take displayName + render account block**

Open `src/app/(frontend)/components/mobile-drawer.tsx`. Update the props type and add an account block at the bottom of the drawer (replacing or adjacent to the existing closing italic line). Replace the entire file with:

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect } from 'react'

const ITEMS = [
  { href: '/atlas', label: 'Atlas', subtitle: 'Cartography of the miraculous' },
  { href: '/doctrine', label: 'Doctrine', subtitle: 'Long-form formation' },
  { href: '/catechist', label: 'Catechist', subtitle: 'Bound to citation' },
  { href: '/reading', label: 'Reading', subtitle: 'Editorial' },
  { href: '/manifesto', label: 'Manifesto', subtitle: 'Why we built this' },
  { href: '/credits', label: 'Credits', subtitle: 'Sources & review' },
] as const

export function MobileDrawer({
  open,
  onClose,
  displayName,
}: {
  open: boolean
  onClose: () => void
  displayName: string | null
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ clipPath: 'circle(0% at calc(100% - 36px) 36px)' }}
          animate={{ clipPath: 'circle(140% at calc(100% - 36px) 36px)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 36px) 36px)' }}
          transition={{ duration: 0.55, ease: [0.83, 0, 0.17, 1] }}
          className="fixed inset-0 z-50 bg-vellum text-ink"
          aria-hidden={!open}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-[100dvh] flex-col">
            <div className="flex items-center justify-between px-5 pt-6">
              <p className="font-display text-lg italic">Tantum Ergo</p>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-xs"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center px-6">
              <ul className="space-y-6">
                {ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.05, type: 'spring', stiffness: 110, damping: 22 }}
                  >
                    <Link href={item.href} onClick={onClose} className="group block">
                      <p className="font-display text-3xl italic leading-none text-ink">
                        {item.label}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                        {item.subtitle}
                      </p>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-ink/10 px-6 pt-4 pb-2">
              {displayName ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
                    {displayName}
                  </p>
                  <form action="/account/sign-out" method="post">
                    <button
                      type="submit"
                      className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/account/signin"
                  onClick={onClose}
                  className="block font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                >
                  Sign in →
                </Link>
              )}
            </div>

            <p className="px-6 pb-8 text-center font-display text-sm italic text-ink-soft">
              Genitori, Genitoque · laus et jubilatio.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 6: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. The header is now a server component — verify that all routes render (the build does this automatically).

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(frontend)/account/sign-out' 'src/app/(frontend)/components/account/header-account-menu.tsx' 'src/app/(frontend)/components/site-header.tsx' 'src/app/(frontend)/components/site-header-client.tsx' 'src/app/(frontend)/components/mobile-drawer.tsx'
git commit -m "feat(auth): sign-out route, header account menu, mobile drawer account block"
```

---

### Task C6: Forgot-password + reset-password pages

**Why:** The Members collection's `auth.forgotPassword.generateEmailHTML` is configured to send users to `/account/reset-password?token=…`. Build the two-page flow: an email-entry form at `/account/forgot-password` that calls `payload.forgotPassword()`, and a new-password form at `/account/reset-password` that calls `payload.resetPassword()`. Add a "Forgot password?" link to the existing sign-in page.

**Files:**
- Create: `src/app/(frontend)/account/forgot-password/page.tsx`
- Create: `src/app/(frontend)/account/forgot-password/actions.ts`
- Create: `src/app/(frontend)/account/reset-password/page.tsx`
- Create: `src/app/(frontend)/account/reset-password/actions.ts`
- Modify: `src/app/(frontend)/account/signin/page.tsx`

- [ ] **Step 1: Create the forgot-password server action**

Create `src/app/(frontend)/account/forgot-password/actions.ts`:

```ts
'use server'

import { payload } from '@/lib/payload'

export type ForgotPasswordState = {
  status: 'idle' | 'sent' | 'error'
  error: string | null
}

export const INITIAL: ForgotPasswordState = { status: 'idle', error: null }

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) {
    return { status: 'error', error: 'Email is required.' }
  }

  try {
    const p = await payload()
    // Payload's forgotPassword is intentionally silent on whether the email
    // exists — never reveal account existence. The success state is the
    // same regardless.
    await p.forgotPassword({
      collection: 'members',
      data: { email },
      disableEmail: false,
    })
  } catch {
    // Even on failure we show the same "sent" message to avoid leaking
    // account existence. The token, if generated, is in the email; if not,
    // nothing was sent. Either way the user's path forward is the same.
  }

  return { status: 'sent', error: null }
}
```

- [ ] **Step 2: Create the forgot-password page**

Create `src/app/(frontend)/account/forgot-password/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { forgotPasswordAction, INITIAL, type ForgotPasswordState } from './actions'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    INITIAL,
  )

  if (state.status === 'sent') {
    return (
      <AuthShell
        eyebrow="Account · Reset"
        title="Check your inbox."
        intro="If an account exists for the address you entered, we sent a link to reset its password. The link is good for the next hour."
      >
        <Link
          href="/account/signin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          ← Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Reset"
      title="Forgot your password?"
      intro="Enter your email and we'll send a link to set a new one. The link expires after an hour."
    >
      <form action={action} className="space-y-5">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
          />
        </label>
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        Remembered it?{' '}
        <Link href="/account/signin" className="text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
```

- [ ] **Step 3: Create the reset-password server action**

Create `src/app/(frontend)/account/reset-password/actions.ts`:

```ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from '@/lib/payload'

export type ResetPasswordState = {
  error: string | null
}

export const INITIAL: ResetPasswordState = { error: null }

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!token) return { error: 'Reset token is missing.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  let token2: string
  let exp: number
  try {
    const p = await payload()
    const result = await p.resetPassword({
      collection: 'members',
      data: { token, password },
      overrideAccess: true,
    })
    if (!result?.token || !result.user || typeof result.user !== 'object') {
      return { error: 'That reset link is no longer valid.' }
    }
    // Payload's resetPassword returns a fresh JWT — log the user in directly
    // so they don't have to re-type the password they just set.
    token2 = result.token
    // resetPassword doesn't return `exp`; derive it from auth.tokenExpiration
    // (30 days, see Members.ts). Match what login() would set.
    exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  } catch {
    return { error: 'That reset link is no longer valid. Request a new one.' }
  }

  const store = await cookies()
  store.set('payload-token', token2, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(exp * 1000),
    path: '/',
  })

  redirect('/doctrine')
}
```

- [ ] **Step 4: Create the reset-password page**

Create `src/app/(frontend)/account/reset-password/page.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { resetPasswordAction, INITIAL, type ResetPasswordState } from './actions'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    INITIAL,
  )

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account · Reset"
        title="Missing token."
        intro="The reset link is incomplete. Try opening the link from your inbox again, or request a fresh one."
      >
        <Link
          href="/account/forgot-password"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          Request a new link →
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Reset"
      title="Set a new password."
      intro="Type your new password twice. We'll sign you in once it's saved."
    >
      <form action={action} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        <Field
          name="password"
          type="password"
          label="New password (8+ chars)"
          autoComplete="new-password"
          required
        />
        <Field
          name="confirm"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
        />
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </AuthShell>
  )
}

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
      />
    </label>
  )
}
```

- [ ] **Step 5: Add "Forgot password?" link to the sign-in page**

Open `src/app/(frontend)/account/signin/page.tsx`. Find the existing trailing footer block:

```tsx
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        New here?{' '}
        <Link
          href={next ? `/account/signup?next=${encodeURIComponent(next)}` : '/account/signup'}
          className="text-ink underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
```

Replace it with:

```tsx
      <div className="mt-8 flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        <p>
          New here?{' '}
          <Link
            href={next ? `/account/signup?next=${encodeURIComponent(next)}` : '/account/signup'}
            className="text-ink underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p>
          <Link
            href="/account/forgot-password"
            className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
```

- [ ] **Step 6: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(frontend)/account/forgot-password' 'src/app/(frontend)/account/reset-password' 'src/app/(frontend)/account/signin/page.tsx'
git commit -m "feat(auth): forgot-password + reset-password flows with Payload-issued tokens"
```

---

## Phase D — Unit player + progress + auth gates

The unit player is the breviary surface — body in `max-w-[65ch]`, lane switcher tabs in the gutter, mastery check at the bottom, "Folio iii. of vii." footer with a "Turn page →" CTA. Server-side progress lands in a new `LmsProgress` collection. Auth gates are added to module + unit routes only (catalogue + track stay public).

### Task D1: LmsProgress collection + progress lib

**Why:** Stores per-member, per-unit progress. One row per `(member, unit)` pair, upserted on every save. Holds the mastery answer text + correctness boolean and the last-visited timestamp (so the catalogue's resume banner can find the most recent unit). Access is locked down to the owning member; admins can read all.

**Files:**
- Create: `src/collections/LmsProgress.ts`
- Create: `src/lib/doctrine-progress.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/payload-types.ts` (auto-regenerated)

- [ ] **Step 1: Write the LmsProgress collection**

Create `src/collections/LmsProgress.ts`:

```ts
import type { CollectionConfig } from 'payload'

export const LmsProgress: CollectionConfig = {
  slug: 'lms-progress',
  labels: { singular: 'LMS Progress', plural: 'LMS Progress' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['member', 'unit', 'masteryCorrect', 'lastVisitedAt'],
    description:
      'Per-member, per-unit progress for the Doctrine LMS. One row per (member, unit) pair — upserted by the unit player. Read-only from the studio for non-admins.',
    // Hide from non-admins to keep the studio focused on editorial tools.
    hidden: ({ user }) =>
      !(user && user.collection === 'users' && user.role === 'admin'),
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      // Members read only their own rows.
      return { member: { equals: req.user.id } }
    },
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'members'),
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users' && req.user.role === 'admin') return true
      if (req.user.collection === 'members') {
        return { member: { equals: req.user.id } }
      }
      return false
    },
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  fields: [
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'unit',
      type: 'relationship',
      relationTo: 'doctrine-units',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'masteryAnswer',
      type: 'text',
      admin: {
        description: 'The text of the option the member selected. Null if they skipped.',
      },
    },
    {
      name: 'masteryCorrect',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Set when the member submits the mastery check. Computed server-side against the unit\'s correct option.',
      },
    },
    {
      name: 'lastVisitedAt',
      type: 'date',
      required: true,
      admin: {
        description:
          'Updated every time the member loads the unit player or saves the mastery check. Powers the resume banner.',
      },
    },
  ],
}
```

- [ ] **Step 2: Register LmsProgress in payload.config.ts**

Open `src/payload.config.ts`. Add the import alongside the others:

```ts
import { LmsProgress } from './collections/LmsProgress'
```

Add it to the collections list, immediately after `DoctrineUnits`:

```ts
collections: [
  Users,
  Members,
  Media,
  Articles,
  Miracles,
  Pilgrimages,
  DoctrineTracks,
  DoctrineModules,
  DoctrineUnits,
  LmsProgress,
],
```

- [ ] **Step 3: Regenerate types**

```bash
pnpm generate:types
```

Confirm `LmsProgress` interface appears in `src/payload-types.ts`.

- [ ] **Step 4: Write the progress lib**

Create `src/lib/doctrine-progress.ts`:

```ts
// src/lib/doctrine-progress.ts
//
// Server-only helpers for reading and upserting LmsProgress rows. The
// collection has no native (member,unit) composite uniqueness, so we
// emulate it here: find-then-update or create.
import 'server-only'

import { payload } from './payload'

import type { LmsProgress, Member } from '@/payload-types'

export async function findProgressForUnit(
  memberId: number | string,
  unitId: number | string,
): Promise<LmsProgress | null> {
  const p = await payload()
  const r = await p.find({
    collection: 'lms-progress',
    where: {
      and: [
        { member: { equals: memberId } },
        { unit: { equals: unitId } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  return (r.docs[0] as LmsProgress | undefined) ?? null
}

export async function findMostRecentProgress(
  memberId: number | string,
): Promise<LmsProgress | null> {
  const p = await payload()
  const r = await p.find({
    collection: 'lms-progress',
    where: { member: { equals: memberId } },
    sort: '-lastVisitedAt',
    limit: 1,
    depth: 3, // resolve unit → module → track for the resume banner
  })
  return (r.docs[0] as LmsProgress | undefined) ?? null
}

/**
 * Mark a unit as visited. Idempotent — creates a row on first call,
 * updates lastVisitedAt thereafter. Does NOT touch masteryAnswer.
 */
export async function touchProgress(
  member: Member,
  unitId: number | string,
): Promise<void> {
  const p = await payload()
  const existing = await findProgressForUnit(member.id, unitId)
  const now = new Date().toISOString()
  if (existing) {
    await p.update({
      collection: 'lms-progress',
      id: existing.id,
      data: { lastVisitedAt: now },
      overrideAccess: true,
    })
  } else {
    await p.create({
      collection: 'lms-progress',
      data: {
        member: member.id,
        unit: unitId as number,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  }
}

/**
 * Save a mastery answer. The caller has already validated (a) that the
 * member is signed in and (b) that the option text matches one of the
 * unit's options. We compute correctness server-side from the unit doc,
 * never trust the client.
 */
export async function saveMasteryAnswer(
  member: Member,
  unitId: number | string,
  answerText: string,
  isCorrect: boolean,
): Promise<void> {
  const p = await payload()
  const existing = await findProgressForUnit(member.id, unitId)
  const now = new Date().toISOString()
  if (existing) {
    await p.update({
      collection: 'lms-progress',
      id: existing.id,
      data: {
        masteryAnswer: answerText,
        masteryCorrect: isCorrect,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  } else {
    await p.create({
      collection: 'lms-progress',
      data: {
        member: member.id,
        unit: unitId as number,
        masteryAnswer: answerText,
        masteryCorrect: isCorrect,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  }
}
```

- [ ] **Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/collections/LmsProgress.ts' 'src/payload.config.ts' 'src/payload-types.ts' 'src/lib/doctrine-progress.ts'
git commit -m "feat(doctrine): LmsProgress collection + progress lib (find/touch/saveMastery)"
```

---

### Task D2: Unit player page (server) + UnitPlayer client

**Why:** The breviary surface. Server page does auth gating (`requireMember`), fetches the unit + neighbouring units (for "Turn page" target computation), touches progress (mark visited), and renders the `<UnitPlayer>` client component with everything it needs. The lane switcher and mastery check live in their own components — wired up in D3.

**Files:**
- Create: `src/app/(frontend)/doctrine/[track]/[module]/[unit]/page.tsx`
- Create: `src/app/(frontend)/components/doctrine/unit-player.tsx`

- [ ] **Step 1: Create the unit player server page**

Create `src/app/(frontend)/doctrine/[track]/[module]/[unit]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { UnitPlayer } from '../../../../components/doctrine/unit-player'
import { toUnitFull } from '../../../../components/doctrine/serialise'
import { requireMember } from '@/lib/auth'
import {
  findProgressForUnit,
  touchProgress,
} from '@/lib/doctrine-progress'
import { payload } from '@/lib/payload'

type Params = Promise<{ track: string; module: string; unit: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { unit: unitSlug } = await params
  const p = await payload()
  const r = await p.find({
    collection: 'doctrine-units',
    where: { slug: { equals: unitSlug } },
    limit: 1,
    depth: 0,
  })
  const u = r.docs[0]
  if (!u) return { title: 'Doctrine — not found' }
  return { title: `${u.title} · Doctrine` }
}

export default async function DoctrineUnitPage({
  params,
}: {
  params: Params
}) {
  const { track: trackSlug, module: moduleSlug, unit: unitSlug } = await params
  const member = await requireMember(
    `/doctrine/${trackSlug}/${moduleSlug}/${unitSlug}`,
  )
  const p = await payload()

  // Resolve the track + module by slug — these are checked for consistency
  // (the URL must match the unit's actual ancestors) so a malformed link
  // 404s rather than rendering misleading breadcrumbs.
  const trackR = await p.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: trackSlug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 0,
  })
  const trackDoc = trackR.docs[0]
  if (!trackDoc) notFound()

  const moduleR = await p.find({
    collection: 'doctrine-modules',
    where: {
      slug: { equals: moduleSlug },
      track: { equals: trackDoc.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 0,
  })
  const moduleDoc = moduleR.docs[0]
  if (!moduleDoc) notFound()

  const unitR = await p.find({
    collection: 'doctrine-units',
    where: {
      slug: { equals: unitSlug },
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2, // resolve module → track AND lane uploads
  })
  const unitDoc = unitR.docs[0]
  if (!unitDoc) notFound()

  // Sibling units in this module for the "Folio iii. of vii." footer
  // and the next-unit pointer.
  const siblingsR = await p.find({
    collection: 'doctrine-units',
    where: {
      module: { equals: moduleDoc.id },
      _status: { equals: 'published' },
    },
    limit: 200,
    sort: ['order', 'title'],
    depth: 0,
  })
  const siblingSlugs = siblingsR.docs.map((d) => String(d.slug))
  const positionInModule = siblingSlugs.indexOf(unitSlug) // 0-based
  const totalInModule = siblingSlugs.length

  // Compute the next-unit URL: next sibling, or first unit of next module
  // (in `order`), or fall back to /doctrine.
  let nextHref: string | null = null
  if (positionInModule >= 0 && positionInModule < totalInModule - 1) {
    nextHref = `/doctrine/${trackSlug}/${moduleSlug}/${siblingSlugs[positionInModule + 1]}`
  } else {
    const nextModuleR = await p.find({
      collection: 'doctrine-modules',
      where: {
        track: { equals: trackDoc.id },
        order: { greater_than: Number(moduleDoc.order ?? 0) },
        _status: { equals: 'published' },
      },
      limit: 1,
      sort: ['order', 'title'],
      depth: 0,
    })
    const nm = nextModuleR.docs[0]
    if (nm) {
      const firstUnitR = await p.find({
        collection: 'doctrine-units',
        where: {
          module: { equals: nm.id },
          _status: { equals: 'published' },
        },
        limit: 1,
        sort: ['order', 'title'],
        depth: 0,
      })
      const fu = firstUnitR.docs[0]
      if (fu) {
        nextHref = `/doctrine/${trackSlug}/${String(nm.slug)}/${String(fu.slug)}`
      }
    }
  }

  // Touch progress (mark visited) so the resume banner picks this up.
  await touchProgress(member, unitDoc.id as number)

  // Read existing progress for this unit so the mastery check can render
  // the previous answer (if any) instead of a fresh form.
  const progress = await findProgressForUnit(member.id, unitDoc.id as number)
  const previousAnswer =
    progress && typeof progress.masteryAnswer === 'string'
      ? progress.masteryAnswer
      : null

  // Synthesize the breadcrumb/title fields. The serialise mapper expects
  // module + track to be hydrated on the unit; depth: 2 handled the module,
  // but depth doesn't recurse to track. Splice the track in manually.
  const moduleHydrated = unitDoc.module as Record<string, unknown>
  if (moduleHydrated && typeof moduleHydrated === 'object') {
    moduleHydrated.track = trackDoc
  }
  const unit = toUnitFull(unitDoc)

  return (
    <UnitPlayer
      unit={unit}
      positionInModule={positionInModule}
      totalInModule={totalInModule}
      nextHref={nextHref}
      previousAnswer={previousAnswer}
    />
  )
}
```

- [ ] **Step 2: Create the UnitPlayer client component**

Create `src/app/(frontend)/components/doctrine/unit-player.tsx`. This is a client component that owns the lane state. The lane switcher and mastery check are imported as separate pieces (created in D3) — until D3 lands, this file imports placeholders that we'll wire up next.

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

import { NarrativeBlock } from '../atlas/narrative'

import { LaneSwitcher, type LaneId } from './lane-switcher'
import { MasteryCheck } from './mastery-check'
import { romanizeLower, type DoctrineUnitFull } from './types'

export function UnitPlayer({
  unit,
  positionInModule,
  totalInModule,
  nextHref,
  previousAnswer,
}: {
  unit: DoctrineUnitFull
  positionInModule: number
  totalInModule: number
  nextHref: string | null
  previousAnswer: string | null
}) {
  const lanes: LaneId[] = ['read']
  if (unit.watchVideoUrl) lanes.push('watch')
  if (unit.listenAudioUrl) lanes.push('listen')

  const [active, setActive] = useState<LaneId>('read')

  const folioNumber = romanizeLower(positionInModule + 1)
  const folioTotal = romanizeLower(totalInModule)
  const masteryEnabled =
    Boolean(unit.masteryPrompt) && unit.masteryOptions.length > 0

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 md:py-20">
      <Link
        href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}`}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        Module
      </Link>

      <p className="mt-8 font-display text-base italic leading-snug text-ink-soft">
        <Link
          href={`/doctrine/${unit.trackSlug}`}
          className="underline-offset-4 hover:underline"
        >
          {unit.trackTitle}
        </Link>
        {' › '}
        <Link
          href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}`}
          className="underline-offset-4 hover:underline"
        >
          {unit.moduleTitle}
        </Link>
      </p>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Folio {folioNumber}{unit.isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
        {unit.title}
      </h1>

      {lanes.length > 1 ? (
        <div className="mt-8">
          <LaneSwitcher lanes={lanes} active={active} onChange={setActive} />
        </div>
      ) : null}

      {unit.introduction ? (
        <div className="mt-8 max-w-[65ch]">
          <NarrativeBlock node={unit.introduction} />
        </div>
      ) : null}

      <div className="mt-8 max-w-[65ch]">
        {active === 'read' ? (
          unit.reading ? (
            <NarrativeBlock node={unit.reading} />
          ) : (
            <p className="font-display text-lg italic text-ink-soft">
              Reading content forthcoming.
            </p>
          )
        ) : null}

        {active === 'watch' && unit.watchVideoUrl ? (
          <video
            src={unit.watchVideoUrl}
            controls
            className="aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-parchment"
          >
            Your browser does not support embedded video.
          </video>
        ) : null}

        {active === 'listen' && unit.listenAudioUrl ? (
          <audio
            src={unit.listenAudioUrl}
            controls
            className="w-full"
          >
            Your browser does not support embedded audio.
          </audio>
        ) : null}
      </div>

      {masteryEnabled ? (
        <div className="mt-16 max-w-[65ch]">
          <MasteryCheck
            unitId={unit.id}
            prompt={unit.masteryPrompt!}
            options={unit.masteryOptions}
            previousAnswer={previousAnswer}
          />
        </div>
      ) : null}

      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Folio {folioNumber}. of {folioTotal}.
        </p>
        {nextHref ? (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft"
          >
            Turn page
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <Link
            href="/doctrine"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-vellum px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition-colors hover:border-ink/30"
          >
            All tracks
            <span aria-hidden>→</span>
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify**

The file imports `LaneSwitcher` and `MasteryCheck`, which don't exist yet — D3 creates them. Skip the build verification on this task; rely on the next task's verification.

```bash
pnpm typecheck
```

This will fail with "Cannot find module './lane-switcher'" — that's expected. The next task wires them up, and we verify the full build there. Do NOT commit yet.

- [ ] **Step 4: Stub the imports so this task can commit standalone**

To keep one-commit-per-task discipline, create stub files for `lane-switcher.tsx` and `mastery-check.tsx` that satisfy the imports. D3 replaces them.

Create `src/app/(frontend)/components/doctrine/lane-switcher.tsx`:

```tsx
'use client'

export type LaneId = 'read' | 'watch' | 'listen'

export function LaneSwitcher({
  lanes,
  active,
  onChange,
}: {
  lanes: LaneId[]
  active: LaneId
  onChange: (next: LaneId) => void
}) {
  // D3 replaces this stub with the real switcher.
  return (
    <div role="tablist" className="flex gap-2 font-mono text-[11px] uppercase tracking-[0.22em]">
      {lanes.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={active === l}
          onClick={() => onChange(l)}
          className={
            active === l
              ? 'rounded-full border border-ink bg-ink px-3 py-1 text-vellum'
              : 'rounded-full border border-ink/15 bg-vellum px-3 py-1 text-ink-soft hover:border-ink/30 hover:text-ink'
          }
        >
          {l === 'read' ? 'Read' : l === 'watch' ? 'Watch' : 'Listen'}
        </button>
      ))}
    </div>
  )
}
```

Create `src/app/(frontend)/components/doctrine/mastery-check.tsx`:

```tsx
'use client'

import type { DoctrineMasteryOption } from './types'

export function MasteryCheck({
  unitId: _unitId,
  prompt,
  options,
  previousAnswer: _previousAnswer,
}: {
  unitId: string
  prompt: string
  options: DoctrineMasteryOption[]
  previousAnswer: string | null
}) {
  // D3 replaces this stub with the real check + server action wiring.
  return (
    <section aria-labelledby="mastery-prompt" className="space-y-4">
      <h2
        id="mastery-prompt"
        className="font-display text-2xl italic leading-snug text-ink"
      >
        {prompt}
      </h2>
      <ul className="space-y-2">
        {options.map((o, i) => (
          <li
            key={i}
            className="rounded-xl border border-ink/15 bg-vellum-deep/40 px-4 py-3 font-display text-base italic text-ink"
          >
            {o.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass. The unit player renders end-to-end now (mastery check is a non-interactive stub).

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(frontend)/doctrine/[track]/[module]/[unit]/page.tsx' 'src/app/(frontend)/components/doctrine/unit-player.tsx' 'src/app/(frontend)/components/doctrine/lane-switcher.tsx' 'src/app/(frontend)/components/doctrine/mastery-check.tsx'
git commit -m "feat(doctrine): unit player page + client (auth-gated, breadcrumb, lanes, folio footer)"
```

---

### Task D3: LaneSwitcher polish + interactive MasteryCheck + saveProgress server action

**Why:** D2 stubbed both. Now wire the real lane switcher (Framer transitions, ARIA tablist semantics) and the real mastery check (server action that validates the option against the unit doc, computes correctness, persists via `saveMasteryAnswer`, and shows the affirmation line on submit).

**Files:**
- Create: `src/app/(frontend)/doctrine/[track]/[module]/[unit]/actions.ts`
- Modify: `src/app/(frontend)/components/doctrine/lane-switcher.tsx`
- Modify: `src/app/(frontend)/components/doctrine/mastery-check.tsx`

- [ ] **Step 1: Create the saveMastery server action**

Create `src/app/(frontend)/doctrine/[track]/[module]/[unit]/actions.ts`:

```ts
'use server'

import { getMember } from '@/lib/auth'
import { saveMasteryAnswer } from '@/lib/doctrine-progress'
import { payload } from '@/lib/payload'

export type MasteryState = {
  status: 'idle' | 'saved' | 'error'
  affirmation: string | null
  isCorrect: boolean
  error: string | null
  /** Echo of the option text the user submitted, so the form can keep it selected after re-render. */
  selected: string | null
}

export const INITIAL_MASTERY: MasteryState = {
  status: 'idle',
  affirmation: null,
  isCorrect: false,
  error: null,
  selected: null,
}

export async function saveMasteryAction(
  _prev: MasteryState,
  formData: FormData,
): Promise<MasteryState> {
  const unitId = String(formData.get('unitId') ?? '')
  const optionText = String(formData.get('option') ?? '')

  if (!unitId || !optionText) {
    return { ...INITIAL_MASTERY, status: 'error', error: 'Missing data.' }
  }

  const member = await getMember()
  if (!member) {
    return {
      ...INITIAL_MASTERY,
      status: 'error',
      error: 'Sign in to save your answer.',
    }
  }

  // Refetch the unit doc and find the option by text. We trust the doc,
  // never the client — `isCorrect` is only set from the doc.
  const p = await payload()
  let unit
  try {
    unit = await p.findByID({
      collection: 'doctrine-units',
      id: unitId,
      depth: 0,
    })
  } catch {
    return { ...INITIAL_MASTERY, status: 'error', error: 'Unit not found.' }
  }

  const masteryRaw =
    unit && typeof unit.masteryCheck === 'object' && unit.masteryCheck !== null
      ? (unit.masteryCheck as Record<string, unknown>)
      : null
  const optionsRaw = Array.isArray(masteryRaw?.options) ? masteryRaw!.options : []
  const matched = optionsRaw.find((o) => {
    const oo = o as Record<string, unknown>
    return typeof oo.text === 'string' && oo.text === optionText
  }) as Record<string, unknown> | undefined

  if (!matched) {
    return {
      ...INITIAL_MASTERY,
      status: 'error',
      error: 'That option is no longer available.',
      selected: optionText,
    }
  }

  const isCorrect = Boolean(matched.isCorrect)
  const affirmation =
    typeof matched.affirmation === 'string' && matched.affirmation.trim()
      ? matched.affirmation
      : isCorrect
        ? 'Yes — kept faithfully.'
        : 'Worth turning back to the reading.'

  await saveMasteryAnswer(member, unitId, optionText, isCorrect)

  return {
    status: 'saved',
    affirmation,
    isCorrect,
    error: null,
    selected: optionText,
  }
}
```

- [ ] **Step 2: Replace the LaneSwitcher stub with the real one**

Open `src/app/(frontend)/components/doctrine/lane-switcher.tsx` and replace the entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { useId } from 'react'

export type LaneId = 'read' | 'watch' | 'listen'

const LABEL: Record<LaneId, string> = {
  read: 'Read',
  watch: 'Watch',
  listen: 'Listen',
}

export function LaneSwitcher({
  lanes,
  active,
  onChange,
}: {
  lanes: LaneId[]
  active: LaneId
  onChange: (next: LaneId) => void
}) {
  // Stable ID for the indicator's layoutId so the spring travels between
  // tabs as the user switches. layoutId must be stable across re-renders.
  const layoutId = useId()
  return (
    <div
      role="tablist"
      aria-label="Lane"
      className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-vellum-deep/40 p-1"
    >
      {lanes.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={active === l}
          aria-controls={`lane-panel-${l}`}
          tabIndex={active === l ? 0 : -1}
          onClick={() => onChange(l)}
          className="relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-rubric/60"
        >
          {active === l ? (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 rounded-full bg-ink"
              transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
            />
          ) : null}
          <span
            className={`relative z-10 ${
              active === l ? 'text-vellum' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {LABEL[l]}
          </span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Replace the MasteryCheck stub with the real one**

Open `src/app/(frontend)/components/doctrine/mastery-check.tsx` and replace the entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { useActionState, useState } from 'react'

import {
  INITIAL_MASTERY,
  saveMasteryAction,
  type MasteryState,
} from '../../doctrine/[track]/[module]/[unit]/actions'
import type { DoctrineMasteryOption } from './types'

export function MasteryCheck({
  unitId,
  prompt,
  options,
  previousAnswer,
}: {
  unitId: string
  prompt: string
  options: DoctrineMasteryOption[]
  previousAnswer: string | null
}) {
  // Seed the local state with the previous answer so the user sees their
  // prior response on revisit. The server action confirms this and may
  // overwrite the affirmation/correctness on submit.
  const [selected, setSelected] = useState<string | null>(previousAnswer)
  const [state, action, pending] = useActionState<MasteryState, FormData>(
    saveMasteryAction,
    INITIAL_MASTERY,
  )

  // The currently shown affirmation: prefer the freshest server response,
  // fall back to the prior answer's affirmation looked up from `options`.
  const priorAffirmation =
    previousAnswer != null
      ? options.find((o) => o.text === previousAnswer)?.affirmation ?? null
      : null
  const affirmation = state.affirmation ?? priorAffirmation
  const isCorrect =
    state.status === 'saved'
      ? state.isCorrect
      : previousAnswer != null
        ? Boolean(options.find((o) => o.text === previousAnswer)?.isCorrect)
        : false
  const showAffirmation = Boolean(affirmation) && (selected != null)

  return (
    <section aria-labelledby="mastery-prompt" className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rubric">
        Mastery · Do you remember?
      </p>
      <h2
        id="mastery-prompt"
        className="font-display text-2xl italic leading-snug text-ink md:text-3xl"
      >
        {prompt}
      </h2>
      <form action={action} className="space-y-3">
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="option" value={selected ?? ''} />
        <ul className="space-y-2">
          {options.map((o, i) => {
            const checked = selected === o.text
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSelected(o.text)}
                  aria-pressed={checked}
                  className={`block w-full rounded-xl border px-4 py-3 text-left font-display text-base italic transition-colors ${
                    checked
                      ? 'border-ink bg-vellum-deep text-ink'
                      : 'border-ink/15 bg-vellum-deep/40 text-ink-soft hover:border-ink/30 hover:text-ink'
                  }`}
                >
                  {o.text}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="submit"
          disabled={!selected || pending}
          className="rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Saving…' : selected === previousAnswer ? 'Saved' : 'Submit'}
        </button>
      </form>
      {showAffirmation ? (
        <motion.p
          key={affirmation /* re-animate on change */}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
          className={`font-display text-lg italic leading-relaxed ${
            isCorrect ? 'text-incense' : 'text-rubric-deep'
          }`}
          aria-live="polite"
        >
          {affirmation}
        </motion.p>
      ) : null}
      {state.error ? (
        <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/doctrine/[track]/[module]/[unit]/actions.ts' 'src/app/(frontend)/components/doctrine/lane-switcher.tsx' 'src/app/(frontend)/components/doctrine/mastery-check.tsx'
git commit -m "feat(doctrine): interactive lane switcher + mastery check with server-action persistence"
```

---

### Task D4: Module-page auth gate + ResumeBanner on catalogue + active-unit highlight

**Why:** With auth and progress in place, retrofit the auth gate onto `/doctrine/[track]/[module]` (anyone reaching a module-level page is intent on engaging — make them sign in). Add a "Continue where you left off" resume banner at the top of `/doctrine` when the visitor is signed in and has at least one progress row. Also highlight the most-recently-visited unit on the module overview.

**Files:**
- Create: `src/app/(frontend)/components/doctrine/resume-banner.tsx`
- Modify: `src/app/(frontend)/doctrine/[track]/[module]/page.tsx`
- Modify: `src/app/(frontend)/doctrine/page.tsx`
- Modify: `src/app/(frontend)/components/doctrine/unit-folio.tsx`

- [ ] **Step 1: Create the ResumeBanner**

Create `src/app/(frontend)/components/doctrine/resume-banner.tsx`:

```tsx
// src/app/(frontend)/components/doctrine/resume-banner.tsx
import Link from 'next/link'

export function ResumeBanner({
  unitTitle,
  trackTitle,
  moduleTitle,
  href,
}: {
  unitTitle: string
  trackTitle: string
  moduleTitle: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group mt-12 flex flex-col gap-2 rounded-2xl border border-gilt/40 bg-vellum-deep/60 px-6 py-5 transition-colors hover:border-gilt md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gilt">
          Continue where you left off
        </p>
        <p className="mt-1 font-display text-2xl italic leading-tight text-ink md:text-3xl">
          {unitTitle}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          {trackTitle} · {moduleTitle}
        </p>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        Resume →
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Add the auth gate to the module page**

Open `src/app/(frontend)/doctrine/[track]/[module]/page.tsx`. At the top of the imports, add (this single import is also used by Step 3 below — don't add it twice):

```tsx
import { getMember, requireMember } from '@/lib/auth'
```

Inside `DoctrineModulePage`, immediately after the `const { track: trackSlug, module: moduleSlug } = await params` line, add:

```tsx
  await requireMember(`/doctrine/${trackSlug}/${moduleSlug}`)
```

This redirects any unauthenticated visitor to `/account/signin?next=/doctrine/{track}/{module}` and bounces them back here on success.

- [ ] **Step 3: Pull recent progress for the module page so the most-recent unit can be highlighted**

Still in the module page, AFTER the `units = unitsR.docs.map(toUnitSummary)` line (where `units` is built from the units result), add:

```tsx
  // Read the member's progress on these units so we can highlight the
  // most recently visited one. Cheap: this page is auth-gated, member is
  // known. The `getMember` import was already added in Step 2.
  const member = await getMember()
  let lastVisitedUnitSlug: string | null = null
  if (member) {
    const unitIds = unitsR.docs.map((u) => u.id as number)
    if (unitIds.length > 0) {
      const recent = await p.find({
        collection: 'lms-progress',
        where: {
          and: [
            { member: { equals: member.id } },
            { unit: { in: unitIds } },
          ],
        },
        sort: '-lastVisitedAt',
        limit: 1,
        depth: 1,
      })
      const r = recent.docs[0]
      const u = r?.unit
      if (u && typeof u === 'object' && 'slug' in u) {
        lastVisitedUnitSlug = String((u as { slug: string }).slug)
      }
    }
  }
```

Then update the units list rendering to pass `isLastVisited`. Find the `<UnitFolio unit={u} index={i} />` line and replace with:

```tsx
              <UnitFolio
                unit={u}
                index={i}
                isLastVisited={u.slug === lastVisitedUnitSlug}
              />
```

- [ ] **Step 4: Update UnitFolio to accept + render the highlight prop**

Open `src/app/(frontend)/components/doctrine/unit-folio.tsx`. Replace the entire file:

```tsx
// src/app/(frontend)/components/doctrine/unit-folio.tsx
import Link from 'next/link'

import { romanize, type DoctrineUnitSummary } from './types'

export function UnitFolio({
  unit,
  index,
  isLastVisited = false,
}: {
  unit: DoctrineUnitSummary
  index: number
  isLastVisited?: boolean
}) {
  const numeral = romanize(index + 1)
  const lanes: string[] = ['Read']
  if (unit.hasWatch) lanes.push('Watch')
  if (unit.hasListen) lanes.push('Listen')
  return (
    <Link
      href={`/doctrine/${unit.trackSlug}/${unit.moduleSlug}/${unit.slug}`}
      className={`group block py-6 ${
        isLastVisited ? 'border-l-2 border-gilt pl-4 -ml-4' : ''
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        Folio {numeral.toLowerCase()}
        {unit.isSample ? ' · [Sample]' : ''} · {lanes.join(' · ')}
        {isLastVisited ? ' · Last read' : ''}
      </p>
      <h3 className="mt-2 font-display text-2xl italic leading-tight text-ink transition-colors group-hover:text-rubric-deep md:text-3xl">
        {unit.title}
      </h3>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft transition-colors group-hover:text-ink">
        {isLastVisited ? 'Resume folio →' : 'Open folio →'}
      </p>
    </Link>
  )
}
```

- [ ] **Step 5: Add the ResumeBanner to the catalogue page**

Open `src/app/(frontend)/doctrine/page.tsx`. Add imports at the top:

```tsx
import { getMember } from '@/lib/auth'
import { findMostRecentProgress } from '@/lib/doctrine-progress'

import { ResumeBanner } from '../components/doctrine/resume-banner'
```

Inside `DoctrineCataloguePage`, AFTER the `const tracks = tracksResult.docs.map(toTrackSummary)` line and BEFORE the `return` statement, add:

```tsx
  // Resume banner — visible only to signed-in members with at least one
  // progress row. Read once; the catalogue page renders fast enough.
  const member = await getMember()
  let resumeProps: {
    unitTitle: string
    trackTitle: string
    moduleTitle: string
    href: string
  } | null = null
  if (member) {
    const recent = await findMostRecentProgress(member.id)
    const unit = recent?.unit
    if (unit && typeof unit === 'object' && 'slug' in unit) {
      const u = unit as { slug?: string; title?: string; module?: unknown }
      const moduleObj =
        u.module && typeof u.module === 'object'
          ? (u.module as { slug?: string; title?: string; track?: unknown })
          : null
      const trackObj =
        moduleObj?.track && typeof moduleObj.track === 'object'
          ? (moduleObj.track as { slug?: string; title?: string })
          : null
      if (u.slug && moduleObj?.slug && trackObj?.slug) {
        resumeProps = {
          unitTitle: String(u.title ?? ''),
          moduleTitle: String(moduleObj.title ?? ''),
          trackTitle: String(trackObj.title ?? ''),
          href: `/doctrine/${trackObj.slug}/${moduleObj.slug}/${u.slug}`,
        }
      }
    }
  }
```

Then in the JSX, AFTER the `<p className="mt-6 max-w-[58ch]…">…</p>` block (the intro paragraph) and BEFORE the `<ul …>…</ul>` track-plate grid, add:

```tsx
      {resumeProps ? <ResumeBanner {...resumeProps} /> : null}
```

- [ ] **Step 6: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(frontend)/components/doctrine/resume-banner.tsx' 'src/app/(frontend)/components/doctrine/unit-folio.tsx' 'src/app/(frontend)/doctrine/page.tsx' 'src/app/(frontend)/doctrine/[track]/[module]/page.tsx'
git commit -m "feat(doctrine): auth-gate module page, resume banner on catalogue, last-read highlight"
```

---

## Phase F — Account management + avatar

Three tasks. Add the avatar field to Members, render the avatar in the header (with initials fallback), and ship a `/account` page where the member can update their display name, upload an avatar, and change their password. Email is read-only.

### Task F1: Avatar field on Members + Avatar component + depth-1 auth lookup

**Why:** The `Members` collection needs an `avatar` upload field, the auth helper needs to return a depth-1 hydrated member (so the avatar Media URL is resolved), and the frontend needs an `<Avatar>` primitive that renders an image when present and initials-on-vellum when not.

**Files:**
- Modify: `src/collections/Members.ts`
- Modify: `src/payload-types.ts` (auto-regenerated)
- Modify: `src/lib/auth.ts`
- Create: `src/app/(frontend)/components/account/avatar.tsx`

- [ ] **Step 1: Add the `avatar` field to Members**

Open `src/collections/Members.ts`. The `fields` array currently contains a single `displayName` text field:

```ts
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description:
          'Optional display name shown in the header dropdown. Falls back to the email local-part when empty.',
      },
    },
  ],
```

Replace it with:

```ts
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description:
          'Optional display name shown in the header dropdown. Falls back to the email local-part when empty.',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional profile image. Renders as a 32px circle in the header and 64px on /account. Members upload via the /account page; admins can override via the studio.',
      },
    },
  ],
```

- [ ] **Step 2: Regenerate types**

```bash
pnpm generate:types
```

The `Member` interface in `src/payload-types.ts` should now have an `avatar?: (number | null) | Media` field.

- [ ] **Step 3: Update lib/auth.ts to depth-1 the member fetch + add avatar helper**

Open `src/lib/auth.ts`. Find the current `getMember()` body:

```ts
export async function getMember(): Promise<Member | null> {
  try {
    const p = await payload()
    const result = await p.auth({ headers: await headers() })
    if (!result?.user) return null
    if (result.user.collection !== 'members') return null
    return result.user as Member
  } catch {
    return null
  }
}
```

Replace it with:

```ts
export async function getMember(): Promise<Member | null> {
  try {
    const p = await payload()
    const result = await p.auth({ headers: await headers() })
    if (!result?.user) return null
    if (result.user.collection !== 'members') return null
    // payload.auth() doesn't honor a depth parameter, so the avatar
    // relationship comes back as a numeric ID. Re-read at depth 1 so the
    // header/account UI gets a hydrated avatar Media doc.
    const hydrated = await p.findByID({
      collection: 'members',
      id: result.user.id,
      depth: 1,
      overrideAccess: true,
    })
    return hydrated as Member
  } catch {
    return null
  }
}
```

Then, at the bottom of the file (after `memberDisplayName`), add:

```ts
/**
 * Resolve a member's avatar URL. Returns null when no avatar is set or the
 * relationship hasn't been hydrated (depth too shallow). Treats unhydrated
 * IDs as null rather than guessing — the caller can fall back to initials.
 */
export function memberAvatarUrl(member: Member): string | null {
  const a = member.avatar
  if (!a) return null
  if (typeof a !== 'object') return null
  const url = (a as { url?: string }).url
  return typeof url === 'string' && url ? url : null
}
```

- [ ] **Step 4: Create the Avatar component**

Create `src/app/(frontend)/components/account/avatar.tsx`:

```tsx
// src/app/(frontend)/components/account/avatar.tsx
import Image from 'next/image'

export function Avatar({
  imageUrl,
  name,
  size = 32,
  className = '',
}: {
  imageUrl: string | null
  name: string
  size?: number
  className?: string
}) {
  // Two-letter initials. Splits on whitespace; uses the first letter of the
  // first word and (if present) the first letter of the last word. Falls
  // back to the first letter of the email-local part for single-token names.
  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const initials =
    parts.length === 0
      ? '·'
      : parts.length === 1
        ? parts[0]!.slice(0, 2).toUpperCase()
        : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()

  const dim = `${size}px`
  return (
    <span
      aria-hidden
      style={{ width: dim, height: dim }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-vellum-deep ${className}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={dim}
          className="object-cover"
          unoptimized={imageUrl.startsWith('/api/')}
        />
      ) : (
        <span
          className="font-mono uppercase text-ink-soft"
          style={{ fontSize: Math.round(size * 0.36), letterSpacing: '0.04em' }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}
```

- [ ] **Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/collections/Members.ts' 'src/payload-types.ts' 'src/lib/auth.ts' 'src/app/(frontend)/components/account/avatar.tsx'
git commit -m "feat(account): avatar field on Members, depth-1 auth fetch, Avatar component"
```

---

### Task F2: Header + drawer avatar integration

**Why:** Replace the text-only `{displayName} ⌄` header trigger with an avatar circle (still with the dropdown) and surface the avatar + name pair in the mobile drawer's account block. Adds an "Account" link to the dropdown.

**Files:**
- Modify: `src/app/(frontend)/components/account/header-account-menu.tsx`
- Modify: `src/app/(frontend)/components/site-header.tsx`
- Modify: `src/app/(frontend)/components/site-header-client.tsx`
- Modify: `src/app/(frontend)/components/mobile-drawer.tsx`

- [ ] **Step 1: Update SiteHeader (server) to compute the avatar URL**

Open `src/app/(frontend)/components/site-header.tsx`. Replace the body of `SiteHeader` with:

```tsx
import { Suspense } from 'react'

import { getMember, memberAvatarUrl, memberDisplayName } from '@/lib/auth'

import { SiteHeaderClient } from './site-header-client'

export async function SiteHeader() {
  const member = await getMember()
  const displayName = member ? memberDisplayName(member) : null
  const avatarUrl = member ? memberAvatarUrl(member) : null
  return (
    <Suspense fallback={null}>
      <SiteHeaderClient displayName={displayName} avatarUrl={avatarUrl} />
    </Suspense>
  )
}
```

- [ ] **Step 2: Update SiteHeaderClient to pass the avatar URL through**

Open `src/app/(frontend)/components/site-header-client.tsx`. Update the props type and the two child renders. Find the function signature:

```tsx
export function SiteHeaderClient({
  displayName,
}: {
  displayName: string | null
}) {
```

Change to:

```tsx
export function SiteHeaderClient({
  displayName,
  avatarUrl,
}: {
  displayName: string | null
  avatarUrl: string | null
}) {
```

Find the existing `<HeaderAccountMenu displayName={displayName} tone={overDark ? 'light' : 'dark'} />` line. Replace with:

```tsx
          <HeaderAccountMenu
            displayName={displayName}
            avatarUrl={avatarUrl}
            tone={overDark ? 'light' : 'dark'}
          />
```

Find the `<MobileDrawer open={open} onClose={() => setOpen(false)} displayName={displayName} />` line. Replace with:

```tsx
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
```

- [ ] **Step 3: Update HeaderAccountMenu to render the Avatar**

Open `src/app/(frontend)/components/account/header-account-menu.tsx`. Replace the entire file with:

```tsx
'use client'

import Link from 'next/link'

import { Avatar } from './avatar'

export function HeaderAccountMenu({
  displayName,
  avatarUrl,
  tone,
}: {
  displayName: string | null
  avatarUrl: string | null
  tone: 'light' | 'dark'
}) {
  const linkClass =
    tone === 'light'
      ? 'text-vellum/85 hover:text-gilt [text-shadow:0_1px_8px_rgba(12,10,8,0.7)]'
      : 'text-ink-soft hover:text-ink'
  const panelClass =
    tone === 'light'
      ? 'border-vellum/10 bg-ink/85 backdrop-blur'
      : 'border-ink/10 bg-vellum'
  const itemClass =
    tone === 'light'
      ? 'text-vellum hover:bg-vellum/10'
      : 'text-ink hover:bg-vellum-deep'

  if (!displayName) {
    return (
      <Link
        href="/account/signin"
        className={`font-mono text-[11px] uppercase tracking-[0.24em] transition-colors ${linkClass}`}
      >
        Sign in
      </Link>
    )
  }

  return (
    <details className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 transition-colors ${linkClass}`}
        aria-label={`Account menu — signed in as ${displayName}`}
      >
        <Avatar imageUrl={avatarUrl} name={displayName} size={32} />
        <span aria-hidden className="font-mono text-[11px] uppercase tracking-[0.24em]">
          ⌄
        </span>
      </summary>
      <div className={`absolute right-0 mt-3 w-56 rounded-xl border p-2 shadow-altar ${panelClass}`}>
        <div className={`flex items-center gap-3 rounded-md px-3 py-2 ${itemClass}`}>
          <Avatar imageUrl={avatarUrl} name={displayName} size={36} />
          <p className="truncate font-display text-base italic">{displayName}</p>
        </div>
        <div className="my-1 h-px bg-current opacity-10" />
        <Link href="/doctrine" className={`block rounded-md px-3 py-2 text-sm ${itemClass}`}>
          My doctrine
        </Link>
        <Link href="/account" className={`block rounded-md px-3 py-2 text-sm ${itemClass}`}>
          Account
        </Link>
        <form action="/account/sign-out" method="post" className="block">
          <button
            type="submit"
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${itemClass}`}
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
```

- [ ] **Step 4: Update MobileDrawer to render the avatar in its account block**

Open `src/app/(frontend)/components/mobile-drawer.tsx`. Update the props type:

```tsx
export function MobileDrawer({
  open,
  onClose,
  displayName,
  avatarUrl,
}: {
  open: boolean
  onClose: () => void
  displayName: string | null
  avatarUrl: string | null
}) {
```

Add the import at the top of the file (alongside the existing imports):

```tsx
import { Avatar } from './account/avatar'
```

Find the existing account block:

```tsx
            <div className="border-t border-ink/10 px-6 pt-4 pb-2">
              {displayName ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
                    {displayName}
                  </p>
                  <form action="/account/sign-out" method="post">
                    <button
                      type="submit"
                      className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/account/signin"
                  onClick={onClose}
                  className="block font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                >
                  Sign in →
                </Link>
              )}
            </div>
```

Replace with:

```tsx
            <div className="border-t border-ink/10 px-6 pt-4 pb-2">
              {displayName ? (
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <Avatar imageUrl={avatarUrl} name={displayName} size={36} />
                    <span className="min-w-0 truncate font-display text-lg italic text-ink">
                      {displayName}
                    </span>
                  </Link>
                  <form action="/account/sign-out" method="post">
                    <button
                      type="submit"
                      className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/account/signin"
                  onClick={onClose}
                  className="block font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
                >
                  Sign in →
                </Link>
              )}
            </div>
```

- [ ] **Step 5: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(frontend)/components/site-header.tsx' 'src/app/(frontend)/components/site-header-client.tsx' 'src/app/(frontend)/components/account/header-account-menu.tsx' 'src/app/(frontend)/components/mobile-drawer.tsx'
git commit -m "feat(account): avatar in header dropdown + mobile drawer; new Account link"
```

---

### Task F3: `/account` page — profile, avatar upload, password change

**Why:** A single auth-gated page where the member can update their display name, upload/replace their avatar, and change their password. Email is read-only. Two server actions: `updateProfileAction` (display name + avatar) and `changePasswordAction` (current password verification + new password set).

**Files:**
- Create: `src/app/(frontend)/account/page.tsx`
- Create: `src/app/(frontend)/account/actions.ts`

- [ ] **Step 1: Create the account server actions**

Create `src/app/(frontend)/account/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'

import { getMember } from '@/lib/auth'
import { payload } from '@/lib/payload'

export type ProfileState = {
  status: 'idle' | 'saved' | 'error'
  error: string | null
}
export type PasswordState = {
  status: 'idle' | 'saved' | 'error'
  error: string | null
}

export const INITIAL_PROFILE: ProfileState = { status: 'idle', error: null }
export const INITIAL_PASSWORD: PasswordState = { status: 'idle', error: null }

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const member = await getMember()
  if (!member) {
    return { status: 'error', error: 'You must be signed in to update your profile.' }
  }

  const displayNameRaw = formData.get('displayName')
  const displayName =
    typeof displayNameRaw === 'string' ? displayNameRaw.trim() : ''

  // Avatar upload: optional. The form only includes a non-empty file when
  // the user picked one. An empty File still arrives with size 0 — skip it.
  const file = formData.get('avatar')
  let avatarMediaId: number | null = null
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    const f = file as File
    if (f.size > 0) {
      if (f.size > MAX_AVATAR_BYTES) {
        return {
          status: 'error',
          error: 'Avatar must be 5 MB or smaller.',
        }
      }
      if (!ALLOWED_AVATAR_TYPES.has(f.type)) {
        return {
          status: 'error',
          error: 'Avatar must be a JPEG, PNG, WebP, or AVIF image.',
        }
      }
      try {
        const p = await payload()
        const buffer = Buffer.from(await f.arrayBuffer())
        const created = await p.create({
          collection: 'media',
          data: { alt: `${displayName || member.email} avatar` },
          file: {
            data: buffer,
            mimetype: f.type,
            name: f.name || `avatar-${member.id}.bin`,
            size: f.size,
          },
          overrideAccess: true,
        })
        avatarMediaId = (created.id as number) ?? null
      } catch {
        return {
          status: 'error',
          error: 'We couldn\'t process that image. Try a different file.',
        }
      }
    }
  }

  try {
    const p = await payload()
    await p.update({
      collection: 'members',
      id: member.id,
      data: {
        displayName: displayName || null,
        ...(avatarMediaId !== null ? { avatar: avatarMediaId } : {}),
      },
      overrideAccess: true,
    })
  } catch {
    return { status: 'error', error: 'Could not save your profile. Try again.' }
  }

  // Header reads from the same member document — re-render every page so
  // the avatar updates everywhere.
  revalidatePath('/', 'layout')
  return { status: 'saved', error: null }
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const member = await getMember()
  if (!member) {
    return { status: 'error', error: 'You must be signed in to change your password.' }
  }

  const current = String(formData.get('currentPassword') ?? '')
  const next = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!current || !next) {
    return { status: 'error', error: 'Both fields are required.' }
  }
  if (next.length < 8) {
    return { status: 'error', error: 'New password must be at least 8 characters.' }
  }
  if (next !== confirm) {
    return { status: 'error', error: 'New passwords do not match.' }
  }
  if (next === current) {
    return { status: 'error', error: 'New password must differ from the current one.' }
  }

  // Verify current password by attempting to log in with it. login() throws
  // on bad credentials. We discard the returned token — the existing cookie
  // is still valid. Email is read from the live member doc (never trusted
  // from the form).
  try {
    const p = await payload()
    await p.login({
      collection: 'members',
      data: { email: member.email, password: current },
    })
  } catch {
    return { status: 'error', error: 'Current password is incorrect.' }
  }

  try {
    const p = await payload()
    await p.update({
      collection: 'members',
      id: member.id,
      data: { password: next },
      overrideAccess: true,
    })
  } catch {
    return { status: 'error', error: 'Could not change your password. Try again.' }
  }

  return { status: 'saved', error: null }
}
```

- [ ] **Step 2: Create the account page**

Create `src/app/(frontend)/account/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'

import { Avatar } from '../components/account/avatar'
import {
  memberAvatarUrl,
  memberDisplayName,
  requireMember,
} from '@/lib/auth'

import { AccountForms } from './forms'

export const metadata: Metadata = { title: 'Account · Tantum Ergo' }

export default async function AccountPage() {
  const member = await requireMember('/account')
  const displayName = memberDisplayName(member)
  const avatarUrl = memberAvatarUrl(member)

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8 md:py-24">
      <Link
        href="/doctrine"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        Doctrine
      </Link>

      <div className="mt-10 flex items-center gap-5">
        <Avatar imageUrl={avatarUrl} name={displayName} size={64} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Account
          </p>
          <h1 className="mt-2 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
            {displayName}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            {member.email}
          </p>
        </div>
      </div>

      <AccountForms
        memberId={String(member.id)}
        displayName={member.displayName ?? ''}
        avatarUrl={avatarUrl}
        email={member.email}
      />

      <div className="mt-16 border-t border-ink/10 pt-6">
        <form action="/account/sign-out" method="post">
          <button
            type="submit"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-rubric-deep underline-offset-4 hover:underline"
          >
            Sign out of this device
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create the AccountForms client component**

Create `src/app/(frontend)/account/forms.tsx`:

```tsx
'use client'

import { useActionState, useRef, useState } from 'react'

import { Avatar } from '../components/account/avatar'

import {
  changePasswordAction,
  INITIAL_PASSWORD,
  INITIAL_PROFILE,
  updateProfileAction,
  type PasswordState,
  type ProfileState,
} from './actions'

export function AccountForms({
  displayName: initialDisplayName,
  avatarUrl,
  email,
}: {
  /** Always passed by parent; reserved for future use (e.g. delete account). */
  memberId: string
  displayName: string
  avatarUrl: string | null
  email: string
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState,
    FormData
  >(updateProfileAction, INITIAL_PROFILE)
  const [passwordState, passwordAction, passwordPending] = useActionState<
    PasswordState,
    FormData
  >(changePasswordAction, INITIAL_PASSWORD)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  const previewName = initialDisplayName || email.split('@')[0] || ''

  return (
    <div className="mt-12 space-y-16">
      {/* Profile */}
      <section aria-labelledby="profile-h" className="space-y-6">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Profile
          </p>
          <h2
            id="profile-h"
            className="mt-2 font-display text-2xl italic leading-snug text-ink md:text-3xl"
          >
            How you appear to yourself.
          </h2>
        </header>

        <form action={profileAction} className="space-y-5">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Display name
            </span>
            <input
              name="displayName"
              type="text"
              defaultValue={initialDisplayName}
              autoComplete="name"
              className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
            />
          </label>

          <div className="flex items-center gap-5">
            <Avatar imageUrl={previewUrl ?? avatarUrl} name={previewName} size={64} />
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Avatar
              </span>
              <input
                ref={fileRef}
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={onFileChange}
                className="font-mono text-[11px] text-ink-soft file:mr-4 file:rounded-full file:border file:border-ink/15 file:bg-vellum file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.22em] file:text-ink hover:file:border-ink/30"
              />
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Email (read-only)
            </span>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="cursor-not-allowed rounded-xl border border-ink/10 bg-vellum-deep/20 px-4 py-3 font-display text-lg text-ink-soft"
            />
          </label>

          {profileState.error ? (
            <p className="font-display text-sm italic text-rubric-deep">
              {profileState.error}
            </p>
          ) : null}
          {profileState.status === 'saved' ? (
            <p className="font-display text-sm italic text-incense">Profile saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {profilePending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* Security */}
      <section aria-labelledby="security-h" className="space-y-6 border-t border-ink/10 pt-12">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Security
          </p>
          <h2
            id="security-h"
            className="mt-2 font-display text-2xl italic leading-snug text-ink md:text-3xl"
          >
            Change your password.
          </h2>
        </header>

        <form action={passwordAction} className="space-y-5">
          <Field
            name="currentPassword"
            type="password"
            label="Current password"
            autoComplete="current-password"
            required
          />
          <Field
            name="newPassword"
            type="password"
            label="New password (8+ chars)"
            autoComplete="new-password"
            required
          />
          <Field
            name="confirm"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            required
          />

          {passwordState.error ? (
            <p className="font-display text-sm italic text-rubric-deep">
              {passwordState.error}
            </p>
          ) : null}
          {passwordState.status === 'saved' ? (
            <p className="font-display text-sm italic text-incense">
              Password changed. You\'re still signed in on this device.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {passwordPending ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  )
}

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
      />
    </label>
  )
}
```

(Note: the file map lists `account/page.tsx` and `account/actions.ts`. The plan above also creates `account/forms.tsx` — a small follow-on the page imports. Add it to the commit.)

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(frontend)/account/page.tsx' 'src/app/(frontend)/account/actions.ts' 'src/app/(frontend)/account/forms.tsx'
git commit -m "feat(account): /account page with profile, avatar upload, password change"
```

---

## Phase E — Seed + studio QA + final verification

### Task E1: Seed script for 18 sample units across 3 tracks

**Why:** A credible amount of filler so the catalogue, track overview, module overview, and unit player all look populated. 3 tracks × 2 modules × 3 units = 18 units. Tracks: **The Eucharist**, **Mariology**, **Liturgical Year**. Each unit has a short reading paragraph + a single MCQ. Watch/Listen lanes left empty (auto-hidden). Idempotent — re-run is safe.

**Files:**
- Create: `src/scripts/seed-doctrine.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the script entry**

Open `package.json`. Find the `scripts` block:

```json
  "scripts": {
    "dev": "next dev",
    "devsafe": "rm -rf .next && next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "payload": "payload",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap",
    "seed:foundation": "tsx src/scripts/seed-foundation.ts",
    "seed:atlas": "tsx src/scripts/seed-atlas.ts",
    "seed:pilgrimages": "tsx src/scripts/seed-pilgrimages.ts",
    "migrate:media": "tsx src/scripts/migrate-media-to-supabase.ts"
  },
```

Add a `"seed:doctrine"` entry alongside the other seed scripts:

```json
    "seed:doctrine": "tsx src/scripts/seed-doctrine.ts",
```

- [ ] **Step 2: Write the seed script**

Create `src/scripts/seed-doctrine.ts`:

```ts
// src/scripts/seed-doctrine.ts
//
// Idempotent seed for the Doctrine LMS. Creates 3 tracks, 6 modules, 18
// units. Every doc is `_isSample: true`. Run with `pnpm seed:doctrine`.
//
// Re-running upserts on slug. Tracks are upserted by slug; modules are
// upserted by (track-id, slug); units by (module-id, slug).
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

type UnitSeed = {
  slug: string
  title: string
  order: number
  reading: string
  masteryPrompt: string
  options: Array<{ text: string; isCorrect: boolean; affirmation: string }>
}

type ModuleSeed = {
  slug: string
  title: string
  summary: string
  order: number
  units: UnitSeed[]
}

type TrackSeed = {
  slug: string
  title: string
  summary: string
  order: number
  modules: ModuleSeed[]
}

const SEEDS: TrackSeed[] = [
  {
    slug: 'the-eucharist',
    title: 'The Eucharist [Sample]',
    summary:
      'A pilgrimage through what the Church believes about the Bread of Life — the source and summit of the Christian life.',
    order: 0,
    modules: [
      {
        slug: 'the-real-presence',
        title: 'The Real Presence [Sample]',
        summary:
          'How the Church reads "This is my body" — the inheritance of the early councils through Trent and Vatican II.',
        order: 0,
        units: [
          {
            slug: 'this-is-my-body',
            title: '"This is my body"',
            order: 0,
            reading:
              'When Jesus speaks the words of institution at the Last Supper, the Church receives them as more than metaphor. The earliest Christian writings — including the Didache and Justin Martyr — describe the bread and wine of the Eucharist in language that assumes substantive transformation. The doctrine of the Real Presence is the patient unfolding of that first reception.',
            masteryPrompt: 'Do you remember where the words of institution first appear in Scripture?',
            options: [
              {
                text: 'In the Synoptic Gospels and 1 Corinthians 11.',
                isCorrect: true,
                affirmation: 'Yes — three Gospel accounts and Paul\'s, all converging.',
              },
              {
                text: 'Only in the Gospel of John.',
                isCorrect: false,
                affirmation: 'John records the bread of life discourse, but the institution words sit in the Synoptics and Paul.',
              },
              {
                text: 'Only in the Acts of the Apostles.',
                isCorrect: false,
                affirmation: 'Acts records the breaking of bread; the institution words come earlier in the Gospels and Paul.',
              },
            ],
          },
          {
            slug: 'transubstantiation',
            title: 'Transubstantiation, briefly',
            order: 1,
            reading:
              'The word transubstantiation took its precise form at the Fourth Lateran Council in 1215 and was restated at Trent. It does not claim to explain the mystery — it names what the Church has always confessed: that the substance of the bread and wine becomes the substance of the body and blood of Christ, while the appearances remain.',
            masteryPrompt: 'Do you remember which council formally adopted the term?',
            options: [
              {
                text: 'The Fourth Lateran Council, 1215.',
                isCorrect: true,
                affirmation: 'Yes — Lateran IV under Innocent III.',
              },
              {
                text: 'The First Council of Nicaea, 325.',
                isCorrect: false,
                affirmation: 'Nicaea defined the divinity of Christ; the Eucharistic term came later.',
              },
              {
                text: 'The Council of Constance, 1414.',
                isCorrect: false,
                affirmation: 'Constance addressed other matters; Lateran IV was the council that adopted this term.',
              },
            ],
          },
          {
            slug: 'eucharistic-miracles-as-witness',
            title: 'Eucharistic miracles as witness',
            order: 2,
            reading:
              'Eucharistic miracles — Lanciano, Bolsena, Buenos Aires — do not constitute the doctrine. The Church\'s teaching does not depend on them. But the Church receives them as a kind of pastoral confirmation, a lived "you are not believing alone" given to those who already accept the words of institution.',
            masteryPrompt: 'Do you remember the relationship between Eucharistic miracles and the doctrine of the Real Presence?',
            options: [
              {
                text: 'The miracles confirm a doctrine the Church already holds on apostolic and scriptural grounds.',
                isCorrect: true,
                affirmation: 'Yes — pastoral confirmation, not foundation.',
              },
              {
                text: 'The doctrine depends on the historical authenticity of these miracles.',
                isCorrect: false,
                affirmation: 'Apostolic teaching and Scripture are the foundation; the miracles confirm but do not constitute.',
              },
              {
                text: 'The Church requires every Catholic to accept the historical record of every reported miracle.',
                isCorrect: false,
                affirmation: 'The Church judges miracles individually; only some are formally approved.',
              },
            ],
          },
        ],
      },
      {
        slug: 'sacrifice-and-meal',
        title: 'Sacrifice and meal [Sample]',
        summary:
          'The two faces of the Mass — re-presentation of Calvary, table of communion — and how they hold together.',
        order: 1,
        units: [
          {
            slug: 'one-sacrifice-many-altars',
            title: 'One sacrifice, many altars',
            order: 0,
            reading:
              'The Council of Trent insisted that the Mass is the same sacrifice as Calvary, made present sacramentally. Not a repetition — a re-presentation. Hebrews emphasises that Christ offered himself once for all; the Mass does not add to that offering. It draws every altar into it.',
            masteryPrompt: 'Do you remember what Trent denied when teaching about the Mass and Calvary?',
            options: [
              {
                text: 'That the Mass is a separate sacrifice that adds to Calvary.',
                isCorrect: true,
                affirmation: 'Yes — Trent guarded the once-for-all of Hebrews.',
              },
              {
                text: 'That the Mass commemorates the Last Supper.',
                isCorrect: false,
                affirmation: 'The commemoration is real; what Trent denied was that the Mass is a separate sacrifice.',
              },
              {
                text: 'That the priest presides at the Eucharistic celebration.',
                isCorrect: false,
                affirmation: 'Trent affirmed the priest\'s role; that wasn\'t the disputed point.',
              },
            ],
          },
          {
            slug: 'communion-as-meal',
            title: 'Communion as meal',
            order: 1,
            reading:
              'The Eucharist is sacrifice and meal at once. The meal language is not decorative — it carries the whole grammar of fellowship and incorporation. To receive communion is to be drawn into the body that is offered, not just to remember it from a distance.',
            masteryPrompt: 'Do you remember what "communion" most directly names?',
            options: [
              {
                text: 'A shared participation in the body of Christ.',
                isCorrect: true,
                affirmation: 'Yes — koinonia, fellowship, incorporation.',
              },
              {
                text: 'A private devotion between an individual and Christ.',
                isCorrect: false,
                affirmation: 'Communion is by its nature shared; the word itself names participation.',
              },
              {
                text: 'A symbolic gesture without substantive meaning.',
                isCorrect: false,
                affirmation: 'The Church teaches that communion is real participation, not symbolic only.',
              },
            ],
          },
          {
            slug: 'who-may-receive',
            title: 'Who may receive',
            order: 2,
            reading:
              'The Church\'s discipline of communion — the requirement of being in a state of grace, the practice of confession, the integrity of full communion with the Catholic Church — flows from the seriousness of what is received. It is not a barrier to grace but a recognition of it.',
            masteryPrompt: 'Do you remember why the Church requires preparation before receiving communion?',
            options: [
              {
                text: 'Because of what is actually received — the body and blood of Christ.',
                isCorrect: true,
                affirmation: 'Yes — the discipline flows from the sacrament\'s reality.',
              },
              {
                text: 'To exclude those who haven\'t earned it.',
                isCorrect: false,
                affirmation: 'No one earns communion; the discipline is about reverence, not merit.',
              },
              {
                text: 'For purely cultural reasons.',
                isCorrect: false,
                affirmation: 'The discipline is doctrinal — it flows from what the sacrament is.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'mariology',
    title: 'Mariology [Sample]',
    summary:
      'The Church\'s teaching about Mary — what is held de fide, what is devotion, and how the two relate.',
    order: 1,
    modules: [
      {
        slug: 'four-marian-dogmas',
        title: 'The four Marian dogmas [Sample]',
        summary:
          'Mother of God, Perpetual Virginity, Immaculate Conception, Assumption — what each means and when it was defined.',
        order: 0,
        units: [
          {
            slug: 'theotokos',
            title: 'Theotokos — God-bearer',
            order: 0,
            reading:
              'The Council of Ephesus in 431 affirmed that Mary is rightly called Theotokos — God-bearer. The point of the title is Christological: it guards the unity of Christ\'s person. To call Mary the Mother of God is to refuse to split the one Christ into two persons. Mariology, in its earliest dogma, exists for the sake of the Son.',
            masteryPrompt: 'Do you remember why the Church teaches Mary as Theotokos?',
            options: [
              {
                text: 'To affirm that Christ is one person, fully divine and fully human.',
                isCorrect: true,
                affirmation: 'Yes — the title guards Christ\'s unity.',
              },
              {
                text: 'To elevate Mary above her Son.',
                isCorrect: false,
                affirmation: 'The title is Christological; it never separates Mary from her dependence on Christ.',
              },
              {
                text: 'As a popular devotion without doctrinal weight.',
                isCorrect: false,
                affirmation: 'It is dogma — Ephesus 431 — and it is doctrinal in its core meaning.',
              },
            ],
          },
          {
            slug: 'immaculate-conception',
            title: 'The Immaculate Conception',
            order: 1,
            reading:
              'Defined by Pius IX in 1854 in Ineffabilis Deus, the Immaculate Conception teaches that Mary, from the first instant of her conception, was preserved free from original sin by the merits of Christ. The dogma is about her being prepared for her vocation, not about a separate path to grace.',
            masteryPrompt: 'Do you remember what the Immaculate Conception teaches?',
            options: [
              {
                text: 'That Mary was preserved from original sin from the moment of her conception, by the merits of Christ.',
                isCorrect: true,
                affirmation: 'Yes — preservation in view of Christ\'s saving work.',
              },
              {
                text: 'That Jesus was conceived without sin.',
                isCorrect: false,
                affirmation: 'That is a separate truth (Christ\'s sinlessness); the Immaculate Conception is about Mary.',
              },
              {
                text: 'That Mary did not need redemption.',
                isCorrect: false,
                affirmation: 'The dogma explicitly includes "by the merits of Christ" — she was redeemed in a unique way.',
              },
            ],
          },
          {
            slug: 'the-assumption',
            title: 'The Assumption',
            order: 2,
            reading:
              'Defined by Pius XII in 1950 in Munificentissimus Deus, the Assumption teaches that Mary, at the end of her earthly life, was taken up body and soul into heavenly glory. The Church does not bind a position on whether she died before being assumed; the dogma is about the destination, not the mechanism.',
            masteryPrompt: 'Do you remember what the Church requires Catholics to hold about whether Mary died before her Assumption?',
            options: [
              {
                text: 'Nothing is binding either way — the dogma defines the Assumption itself, not the manner.',
                isCorrect: true,
                affirmation: 'Yes — Munificentissimus Deus left this open.',
              },
              {
                text: 'Catholics must hold that she did not die.',
                isCorrect: false,
                affirmation: 'The dogma is silent on this; the Eastern tradition speaks of the Dormition.',
              },
              {
                text: 'Catholics must hold that she died.',
                isCorrect: false,
                affirmation: 'The dogma is silent here; some saints have held either position.',
              },
            ],
          },
        ],
      },
      {
        slug: 'devotion-and-discernment',
        title: 'Devotion and discernment [Sample]',
        summary:
          'How the Church distinguishes private revelation from public revelation, and how Marian apparitions are weighed.',
        order: 1,
        units: [
          {
            slug: 'private-revelation',
            title: 'Private revelation',
            order: 0,
            reading:
              'Public revelation closed with the death of the last apostle. Private revelation — including Marian apparitions — is never required for belief. When the Church approves an apparition, she does so cautiously, with the language of "worthy of belief," meaning the faithful may give it credence without obligation.',
            masteryPrompt: 'Do you remember the difference between public and private revelation?',
            options: [
              {
                text: 'Public revelation closed with the apostles; private revelation is never required for belief.',
                isCorrect: true,
                affirmation: 'Yes — that\'s the Church\'s clear distinction.',
              },
              {
                text: 'They are interchangeable categories.',
                isCorrect: false,
                affirmation: 'They are distinct: public is binding for faith, private is not.',
              },
              {
                text: 'Private revelations supersede the apostolic deposit.',
                isCorrect: false,
                affirmation: 'The Church teaches the opposite — they may not contradict the deposit of faith.',
              },
            ],
          },
          {
            slug: 'fatima-and-lourdes',
            title: 'Fatima and Lourdes',
            order: 1,
            reading:
              'Two of the most widely received Marian apparitions — Lourdes in 1858 and Fatima in 1917 — have shaped popular devotion in profound ways. Both have been formally approved by the Church. Both leave individual reception, however, voluntary. The Church\'s role is to discern, not to compel.',
            masteryPrompt: 'Do you remember what "approved" means for an apparition?',
            options: [
              {
                text: 'The Church judges the apparition free of error and worthy of belief.',
                isCorrect: true,
                affirmation: 'Yes — and individual reception remains voluntary.',
              },
              {
                text: 'The Church requires every Catholic to accept its content as binding.',
                isCorrect: false,
                affirmation: 'No private revelation is binding for faith.',
              },
              {
                text: 'The Church guarantees its historical accuracy in every detail.',
                isCorrect: false,
                affirmation: 'Approval is about doctrinal content and discernment, not detail-level history.',
              },
            ],
          },
          {
            slug: 'marian-prayer',
            title: 'Marian prayer',
            order: 2,
            reading:
              'The rosary, the Memorare, the Hail Mary — these are the Church\'s shared Marian patrimony. The grammar is always intercessory: we ask Mary to pray with us and for us, never to take the place of her Son. Devotion that obscures Christ is not Catholic devotion.',
            masteryPrompt: 'Do you remember the basic grammar of Marian prayer?',
            options: [
              {
                text: 'Intercession — we ask Mary to pray with us and for us.',
                isCorrect: true,
                affirmation: 'Yes — that is the constant Catholic grammar.',
              },
              {
                text: 'Direct worship of Mary as we worship Christ.',
                isCorrect: false,
                affirmation: 'The Church distinguishes worship (latria) from veneration (hyperdulia).',
              },
              {
                text: 'A replacement for prayer to Christ.',
                isCorrect: false,
                affirmation: 'Marian prayer is always ordered toward Christ, never a replacement.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'liturgical-year',
    title: 'Liturgical Year [Sample]',
    summary:
      'The seasons and feasts that shape Catholic time — Advent, Christmas, Lent, Easter, Ordinary Time — and what each is for.',
    order: 2,
    modules: [
      {
        slug: 'advent-and-christmas',
        title: 'Advent and Christmas [Sample]',
        summary:
          'The first season of the year — preparation, expectation, and the feast of the Incarnation.',
        order: 0,
        units: [
          {
            slug: 'advent-as-preparation',
            title: 'Advent as preparation',
            order: 0,
            reading:
              'Advent has two horizons. It looks back to the centuries of Israel\'s expectation, and forward to Christ\'s return. The season is not a countdown to Christmas — it is a re-formation of attention. Purple vestments, the Advent wreath, the O Antiphons in the final week: each is a way of waking up to the meaning of waiting.',
            masteryPrompt: 'Do you remember the two horizons Advent holds together?',
            options: [
              {
                text: 'Israel\'s expectation of the Messiah, and the Church\'s expectation of Christ\'s return.',
                isCorrect: true,
                affirmation: 'Yes — the past and the future bound by the present feast.',
              },
              {
                text: 'Just the four weeks before Christmas, no further meaning.',
                isCorrect: false,
                affirmation: 'The season carries both horizons — that\'s what makes it more than a countdown.',
              },
              {
                text: 'Lent and Easter.',
                isCorrect: false,
                affirmation: 'Those are different seasons with different shapes.',
              },
            ],
          },
          {
            slug: 'incarnation',
            title: 'The Incarnation',
            order: 1,
            reading:
              'Christmas celebrates not just Christ\'s birth, but the doctrine that the Word became flesh. John 1 is the Christmas reading the early Church chose for itself. The Incarnation is not a one-time event — it is the fact that gives every other Christian doctrine its shape.',
            masteryPrompt: 'Do you remember the prologue most associated with the Christmas liturgy?',
            options: [
              {
                text: 'John 1 — "the Word became flesh."',
                isCorrect: true,
                affirmation: 'Yes — the prologue of John, read at Mass on Christmas Day.',
              },
              {
                text: 'Genesis 1.',
                isCorrect: false,
                affirmation: 'Genesis 1 is read at the Easter Vigil; Christmas Day takes John 1.',
              },
              {
                text: 'Romans 8.',
                isCorrect: false,
                affirmation: 'Romans 8 belongs to other liturgical contexts.',
              },
            ],
          },
          {
            slug: 'epiphany',
            title: 'Epiphany',
            order: 2,
            reading:
              'Epiphany — January 6, or the nearest Sunday — celebrates the manifestation of Christ to the nations. The visit of the Magi is the iconic image, but the feast is also bound to the baptism of the Lord and the wedding at Cana. Three "epiphanies" of the same mystery: God revealed, God acknowledged, God provident.',
            masteryPrompt: 'Do you remember the three traditional events celebrated under "Epiphany"?',
            options: [
              {
                text: 'The visit of the Magi, the baptism of Christ, and the wedding at Cana.',
                isCorrect: true,
                affirmation: 'Yes — three manifestations of the one Christ.',
              },
              {
                text: 'Only the visit of the Magi.',
                isCorrect: false,
                affirmation: 'The Magi are the iconic image, but the feast traditionally holds all three.',
              },
              {
                text: 'The Crucifixion and Resurrection.',
                isCorrect: false,
                affirmation: 'Those belong to the Paschal Triduum.',
              },
            ],
          },
        ],
      },
      {
        slug: 'lent-and-easter',
        title: 'Lent and Easter [Sample]',
        summary:
          'The forty days of conversion, the Triduum, and the great fifty days of Eastertide.',
        order: 1,
        units: [
          {
            slug: 'lenten-disciplines',
            title: 'Lenten disciplines',
            order: 0,
            reading:
              'Prayer, fasting, almsgiving — the three classical Lenten disciplines, drawn directly from the Sermon on the Mount. The point is not deprivation as virtue. It is conversion: a re-ordering of the affections so that what is given up, what is given away, and what is given attention to are all rightly tuned by Easter.',
            masteryPrompt: 'Do you remember the three classical Lenten disciplines?',
            options: [
              {
                text: 'Prayer, fasting, and almsgiving.',
                isCorrect: true,
                affirmation: 'Yes — the three from Matthew 6.',
              },
              {
                text: 'Prayer alone.',
                isCorrect: false,
                affirmation: 'The Sermon on the Mount names three; the Church holds them together.',
              },
              {
                text: 'Reading, study, and reflection.',
                isCorrect: false,
                affirmation: 'Those are good disciplines, but the classical three are prayer, fasting, almsgiving.',
              },
            ],
          },
          {
            slug: 'the-triduum',
            title: 'The Paschal Triduum',
            order: 1,
            reading:
              'Holy Thursday, Good Friday, and the Easter Vigil are not three separate liturgies but one liturgy in three movements. The bell at the Gloria of Holy Thursday silences until the Vigil; the altar is stripped; the Vigil opens with the new fire. The shape is ancient, and intentional.',
            masteryPrompt: 'Do you remember whether the three days of the Triduum are one liturgy or three?',
            options: [
              {
                text: 'One liturgy in three movements.',
                isCorrect: true,
                affirmation: 'Yes — that\'s the Church\'s own description.',
              },
              {
                text: 'Three independent liturgies.',
                isCorrect: false,
                affirmation: 'They are intentionally bound — there is no dismissal at the end of Holy Thursday.',
              },
              {
                text: 'A series of devotions, not liturgies.',
                isCorrect: false,
                affirmation: 'The Triduum is the highest liturgical celebration of the year.',
              },
            ],
          },
          {
            slug: 'eastertide',
            title: 'The fifty days',
            order: 2,
            reading:
              'Easter is a season, not a day. The Church celebrates fifty days from Easter Sunday to Pentecost — longer than Lent, longer than Advent. The point is structural: joy is meant to be sustained, not glanced at. The Paschal candle stays lit through the whole season.',
            masteryPrompt: 'Do you remember how long the Easter season lasts?',
            options: [
              {
                text: 'Fifty days, from Easter Sunday to Pentecost.',
                isCorrect: true,
                affirmation: 'Yes — and longer than Lent.',
              },
              {
                text: 'Just one Sunday.',
                isCorrect: false,
                affirmation: 'Easter Day is the highest feast, but the season carries the joy further.',
              },
              {
                text: 'Forty days, like Lent.',
                isCorrect: false,
                affirmation: 'Eastertide is fifty days; the Church chose a longer span deliberately.',
              },
            ],
          },
        ],
      },
    ],
  },
]

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

async function main() {
  const payload = await getPayload({ config })

  for (const trackSeed of SEEDS) {
    const trackId = await ensureTrack(payload, trackSeed)
    for (const moduleSeed of trackSeed.modules) {
      const moduleId = await ensureModule(payload, trackId, moduleSeed)
      for (const unitSeed of moduleSeed.units) {
        await ensureUnit(payload, moduleId, unitSeed)
      }
    }
  }

  payload.logger.info(
    `Doctrine seed complete (${SEEDS.length} tracks, ${SEEDS.reduce(
      (s, t) => s + t.modules.length,
      0,
    )} modules, ${SEEDS.reduce(
      (s, t) =>
        s +
        t.modules.reduce((ss, m) => ss + m.units.length, 0),
      0,
    )} units).`,
  )
  process.exit(0)
}

async function ensureTrack(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: TrackSeed,
): Promise<number> {
  const data = {
    title: seed.title,
    slug: seed.slug,
    summary: seed.summary,
    order: seed.order,
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-tracks',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine track ${seed.slug}`)
    return existing.docs[0].id as number
  }
  const created = await payload.create({
    collection: 'doctrine-tracks',
    data,
  })
  payload.logger.info(`Created doctrine track ${seed.slug}`)
  return created.id as number
}

async function ensureModule(
  payload: Awaited<ReturnType<typeof getPayload>>,
  trackId: number,
  seed: ModuleSeed,
): Promise<number> {
  const data = {
    track: trackId,
    title: seed.title,
    slug: seed.slug,
    summary: seed.summary,
    order: seed.order,
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-modules',
    where: {
      and: [
        { slug: { equals: seed.slug } },
        { track: { equals: trackId } },
      ],
    },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-modules',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine module ${seed.slug} (track ${trackId})`)
    return existing.docs[0].id as number
  }
  const created = await payload.create({
    collection: 'doctrine-modules',
    data,
  })
  payload.logger.info(`Created doctrine module ${seed.slug} (track ${trackId})`)
  return created.id as number
}

async function ensureUnit(
  payload: Awaited<ReturnType<typeof getPayload>>,
  moduleId: number,
  seed: UnitSeed,
): Promise<void> {
  const data = {
    module: moduleId,
    title: seed.title,
    slug: seed.slug,
    order: seed.order,
    lanes: {
      reading: lexicalLine(seed.reading),
    },
    masteryCheck: {
      prompt: seed.masteryPrompt,
      options: seed.options,
    },
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-units',
    where: {
      and: [
        { slug: { equals: seed.slug } },
        { module: { equals: moduleId } },
      ],
    },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-units',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine unit ${seed.slug} (module ${moduleId})`)
    return
  }
  await payload.create({ collection: 'doctrine-units', data })
  payload.logger.info(`Created doctrine unit ${seed.slug} (module ${moduleId})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Run the seed**

```bash
pnpm seed:doctrine
```

Expected output: 3 "Created doctrine track" lines, 6 "Created doctrine module" lines, 18 "Created doctrine unit" lines, then "Doctrine seed complete (3 tracks, 6 modules, 18 units)." Re-run to confirm idempotency — second run should print "Updated…" instead of "Created…".

- [ ] **Step 4: Verify**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

- [ ] **Step 5: Commit**

```bash
git add 'package.json' 'src/scripts/seed-doctrine.ts'
git commit -m "feat(doctrine): seed 3 tracks × 2 modules × 3 units (Eucharist, Mariology, Liturgical Year)"
```

---

### Task E2: Final verification + studio QA + member sign-up smoke + handoff

**Why:** Verify everything end-to-end, including the live signup → verify-email → sign-in → resume loop. No new commits unless QA surfaces a fixable gap.

**Step 1: Full gate run**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 2: Boot dev**

```bash
pnpm dev
```

In a separate terminal:

**Step 3: Public route smoke**

```bash
for path in / /atlas /atlas/list /reading /manifesto /credits /doctrine /catechist /account/signin /account/signup /account/forgot-password /account/reset-password /account/verify-email; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$path")
  echo "$status $path"
done
```

Expected: every path returns `200`. (`/account/reset-password` and `/account/verify-email` render the "missing token" empty state without query params — still a 200.)

**Step 4: Public doctrine routes (catalogue + track) return 200; gated routes redirect to signin**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/doctrine/the-eucharist"
curl -s -o /dev/null -w "%{http_code}\n" -L "http://localhost:3000/doctrine/the-eucharist/the-real-presence"
curl -s -o /dev/null -w "%{http_code}\n" -L "http://localhost:3000/doctrine/the-eucharist/the-real-presence/this-is-my-body"
```

Expected: first returns `200`. Second + third follow the redirect to `/account/signin?next=…` and end at `200` (the sign-in page). Without `-L`, second + third would return `307`.

**Step 5: Member sign-up smoke (browser)**

In the browser:

1. `/` → header shows "Sign in" on the right.
2. `/doctrine` → catalogue renders with 3 track plates. No resume banner yet.
3. Click "The Eucharist" → track overview renders with 2 module folios. No login required.
4. Click "The Real Presence" → redirected to `/account/signin?next=/doctrine/the-eucharist/the-real-presence`.
5. Click "Create an account" → sign-up form. Fill displayName=`Test`, email=`test+plan3@example.com` (or your real email if SMTP is configured), password=`testtest123`. Submit.
6. Confirmation page appears: "We sent a verification link…".
7. **If SMTP is configured**: open the inbox, click the link → land on `/account/signin?verified=1`.
   **If SMTP is NOT configured**: tail the dev server output. Payload logs the email body to console. Copy the verification URL from the log and paste into the browser → land on `/account/signin?verified=1`.
8. Sign in with the credentials → redirected to `/doctrine/the-eucharist/the-real-presence`. Header now shows "Test ⌄" on the right.
9. Click a unit → unit player renders. Breadcrumb shows "The Eucharist › The Real Presence". Folio number shown as "Folio i.". "Turn page →" advances to the next unit.
10. Read through 2 units, answer the mastery checks. Affirmation lines appear in incense (correct) or rubric-deep (incorrect) italic.
11. Navigate back to `/doctrine`. Resume banner appears at the top with the most-recent unit.
12. Click the resume banner → lands directly on the unit player.
13. Mobile: open dev tools at 390×844, navigate `/doctrine` → resume banner stacks above plates. Tap a track → tap a module → tap a unit → unit player renders with `max-w-[65ch]` body.
14. Sign out from the header dropdown. Confirm: redirect home, header reverts to "Sign in" text, `/doctrine/the-eucharist/the-real-presence` redirects to `/account/signin` again.

**Step 5b: Forgot-password loop**

15. From the sign-in page, click "Forgot your password?" → `/account/forgot-password`.
16. Submit the test member's email. Page replaces with "Check your inbox." regardless of whether the email exists (intentional — Payload doesn't reveal account existence).
17. **If SMTP is configured**: open the inbox and click the reset link.
    **If SMTP is not configured**: copy the URL from the dev server console and paste it into the browser.
18. Land on `/account/reset-password?token=…`. Set a new password (e.g. `testtest456`). Submit → automatically signed in (Payload's resetPassword returns a fresh JWT) → redirected to `/doctrine`.
19. Sign out, sign back in with the new password to confirm it took.

**Step 5c: Avatar + account management**

20. Sign in, header shows the **vellum-deep initials circle** (no image yet) on the right with a `⌄`.
21. Click the avatar → dropdown shows the avatar at 36px next to the display name, plus "My doctrine", "Account", "Sign out".
22. Click "Account" → `/account` renders. Big 64px initials circle, display name, email shown read-only.
23. Update the display name to "Updated Test", save → "Profile saved." appears in incense italic. The header avatar dropdown's name updates on next nav (revalidatePath fires).
24. Pick a small JPEG/PNG to upload (under 5 MB). The avatar circle next to the file input previews the picked image instantly via `URL.createObjectURL`. Click "Save profile" → confirmation. Header avatar now shows the uploaded image.
25. Try a >5 MB file → red italic error "Avatar must be 5 MB or smaller." No upload happens.
26. Try a `.txt` file (or change the file input to inspect; the page rejects via accept attribute, but the server action also rejects on mimetype).
27. Scroll to **Security**. Submit blank → "Both fields are required." Submit with wrong current password → "Current password is incorrect." Submit with `next === current` → "New password must differ from the current one." Submit with valid current + new + matching confirm → "Password changed. You're still signed in on this device."
28. Sign out, sign back in with the new password to confirm.
29. Mobile: 390×844, sign in, open the drawer (hamburger). Bottom block now shows the avatar circle + display name (tappable → /account) and a Sign out button.

**Step 6: Studio QA — create a unit from scratch**

Open `/admin`. Sign in as a steward.

1. Navigate to **Doctrine Units → Create New**.
2. **Content tab:**
   - Module: pick "The Real Presence [Sample]" from the dropdown.
   - Title: `Test Unit — Please Delete`.
   - Introduction: write one paragraph of richtext.
   - Lanes → Reading: write 2 paragraphs of richtext, including a bold word.
   - Lanes → Watch / Listen: leave empty.
   - Mastery check → prompt: `Do you remember this is a test?`.
   - Options: add 2 — first `Yes — this is a test.` (mark correct, affirmation `Yes — that\'s right.`); second `No — this is real.` (incorrect, affirmation `Worth re-reading.`).
3. Sidebar:
   - slug: `test-unit-please-delete`
   - order: `99`
   - _isSample: leave unchecked (so it doesn't show the [Sample] badge — the steward is testing a real unit)
4. Save Draft → Publish.

**Step 7: Verify the new unit on the frontend**

In the browser as the signed-in member:

- `/doctrine/the-eucharist/the-real-presence` → "Test Unit — Please Delete" appears at the bottom of the units list (order=99).
- Click it → unit player renders with the new content. Breadcrumb correct. Mastery check renders. Submit each option in turn — affirmations show correctly. The "Turn page →" link is absent (no next unit at this position) and is replaced by an "All tracks →" fallback.

**Step 8: Verify the studio live preview works**

Edit the test unit's title in studio (add " (edited)"). Click the live-preview tab. The preview pane should show the updated title within a few seconds.

**Step 9: Delete the test unit + the test member**

- Studio → Doctrine Units → click "Test Unit" → Delete.
- Studio → Members (admin role required, hidden for theologian/editor) → find `test+plan3@example.com` → Delete.

**Step 10: Final verification — re-run the gate**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

All three must pass.

**Step 11: Handoff message to user**

Format the response:

> Plan 3 (Doctrine LMS) done. Branch is at `<sha>`. Three nested doctrine collections (Tracks → Modules → Units) plus Members + LmsProgress. Five page levels: catalogue, track, module, unit player. Auth gate on module + unit routes; catalogue + track stay public. Email/password sign-up with email verification, forgot-password + reset flows. Server-side progress; ResumeBanner on the catalogue; last-read highlight on module pages. Avatar field on Members with initials fallback; avatar in header dropdown + mobile drawer; `/account` page with profile + password change + avatar upload. 18 sample units seeded across The Eucharist, Mariology, Liturgical Year. Studio QA verified by user (create/edit/publish round-trip + live preview).
>
> Plan 4 (AI Catechist + RAG) is next, but you trigger it.

---

## Don't-break warnings

Specific files / surfaces that are SHIPPED and STABLE — leave them alone unless explicitly extending:

- **Atlas explore page + walker + studio coordinate-picker** — all of `src/app/(frontend)/atlas/**` and `src/app/(frontend)/components/atlas/**` and `src/app/(payload)/components/coordinate-picker.{tsx,scss}` are off-limits to this plan.
- **Atlas collections + Articles + Media + Pilgrimages** — schemas are stable. Don't add fields.
- **Catechist route stub** (`src/app/(frontend)/catechist/page.tsx`) — leave as the placeholder for Plan 4.
- **Pillar pages** (`/`, `/reading`, `/manifesto`, `/credits`) — Plan 1 surfaces, untouched.
- **Site chrome** — only `SiteHeader` (split into server + client) and `MobileDrawer` are modified; `SiteFooter`, `SiteChromeHide`, `Wordmark`, `ChiRho`, `ScrollRubric` are untouched.
- **Globals + helpers** (`globals.css`'s atlas-scroll + atlas-lock rules, `lib/cn.ts`, `lib/payload.ts`, `db/init-raw-tables.ts`) — untouched. The atlas-lock body CSS rule is for `/atlas + walker only`. `/doctrine/*` routes do NOT carry `data-atlas-lock="true"` and must scroll naturally.
- **Existing seed scripts** (`seed-foundation.ts`, `seed-atlas.ts`, `seed-pilgrimages.ts`) — read for the upsert-by-slug pattern, but don't modify.
- **Payload Users (Stewards)** — auth config untouched. Studio remains keyed to `Users` via `admin.user: 'users'`. Members can never reach `/admin`.

### Don't introduce regressions on these:

- The `Members` and `Users` collections share the cookie name `payload-token`. A user signed into both in the same browser will carry only the most recent token; signing into the studio while signed into the LMS (or vice-versa) signs the other out. Document this in the handoff if a steward is confused — it's a Payload-level constraint, not a bug.
- localStorage is no longer the source of truth for LMS progress. If you're tempted to add a `tantum:doctrine:*` localStorage key during execution, stop — server-side `LmsProgress` is the contract.
- All `/doctrine/*` server pages must call `requireMember(currentPath)` from `@/lib/auth` (NOT a custom redirect) so the `?next=` round-trip stays consistent across surfaces.
- The Members `auth.verify` config emits a verification URL pointing at `/account/verify-email?token=...` — keep that route name stable. If you rename it, update `Members.ts`'s `generateEmailHTML` in lockstep.
- The `payload.auth({ headers })` call in `getMember()` returns the user from whichever collection's token is in the cookie — narrow to `members` before treating it as a Member, otherwise a steward signed into `/admin` will be misread as a learner.
- Server actions for sign-in / sign-up / mastery write to cookies and DB. Never call them from client components without a `<form action={...}>` boundary — Next 16 + React 19 enforces this anyway, but be explicit.

---

## 6 · Repo + remote

- Repo: https://github.com/ajojotank/Tantun-Ergo (typo in repo name — leave as-is).
- Working branch: `feat/foundation`. Commits land on this branch.
- After Plan 3 ships, fast-forward `main` to `feat/foundation` and push both branches.

