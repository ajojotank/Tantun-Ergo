# Tantum Ergo · Plan 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a complete public marketing surface — home (with scroll-scrubbed manifesto sequence), reading list + detail, manifesto, credits, "coming soon" placeholders for the three pillars — all driven by Payload CMS. Lays the foundation that Atlas / LMS / Catechist plans build on top of.

**Architecture:** Server-component-first Next.js 16 app router, three Payload globals (Settings, ManifestoSequence) and three extended collections (Media, Pages with `pageType` + `_isSample`), shared chrome (header / mobile drawer / footer), one client-only `manifesto-sequence` leaf for scroll-scrubbed cinematics. Raw `rate_limits` / `source_chunks` / `media_chunks` pgvector tables created via Payload `onInit` hook (idempotent — runs once on first boot, no-op thereafter).

**Tech Stack:** Next.js 16.2 (Turbopack default), React 19, Payload 3.84 (`payload`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/email-nodemailer`), Tailwind v4, Framer Motion 12, sass for Payload studio overrides. New for this plan: nothing — all packages are already installed from boilerplate.

**Reference spec:** [`../specs/2026-05-04-tantum-ergo-v1-design.md`](../specs/2026-05-04-tantum-ergo-v1-design.md) §3 (design language), §4.1, §4.5, §4.6, §4.7 (page-by-page), §5.1, §5.3, §5.4 (data model + raw tables + globals).

---

## File structure for this plan

| File | Responsibility | Status |
|---|---|---|
| `src/lib/cn.ts` | Tailwind class-name util (clsx-style) | NEW |
| `src/lib/payload.ts` | Server-side helper to fetch Payload client without re-init churn | NEW |
| `src/db/init-raw-tables.ts` | Runs on Payload boot, idempotent CREATE TABLE IF NOT EXISTS for `rate_limits` / `source_chunks` / `media_chunks` + `vector` extension | NEW |
| `src/collections/Media.ts` | Extend with `_isSample` field | MODIFY |
| `src/collections/Pages.ts` | Extend with `pageType`, `_isSample`, `excerpt`, `publishedAt` | MODIFY |
| `src/globals/Settings.ts` | Site title, tagline, footer copy, socials, mapbox style, catechist rate-limit settings | NEW |
| `src/globals/ManifestoSequence.ts` | Image frames + captions for the home scroll-scrubbed manifesto sequence | NEW |
| `src/payload.config.ts` | Register globals, wire `onInit` hook to run raw-tables initialiser | MODIFY |
| `src/app/(frontend)/_components/section-reveal.tsx` | Stagger-fade wrapper for first-paint reveals | NEW (client) |
| `src/app/(frontend)/_components/site-header.tsx` | Top nav (desktop) | NEW (client — for mobile drawer toggle) |
| `src/app/(frontend)/_components/mobile-drawer.tsx` | Full-screen drawer overlay (curtain reveal) | NEW (client) |
| `src/app/(frontend)/_components/site-footer.tsx` | Footer rendered from Settings global | NEW (server) |
| `src/app/(frontend)/_components/manifesto-sequence.tsx` | Scroll-scrubbed image-sequence (Framer's `useScroll`) | NEW (client) |
| `src/app/(frontend)/_components/pillar-plate.tsx` | Magnetic pillar entry tile | NEW (client) |
| `src/app/(frontend)/_components/scroll-rubric.tsx` | Already exists — unchanged | EXISTS |
| `src/app/(frontend)/_components/magnetic-cta.tsx` | Already exists — unchanged | EXISTS |
| `src/app/(frontend)/layout.tsx` | Refresh to load Settings, render `<SiteHeader>` + `<SiteFooter>` | MODIFY |
| `src/app/(frontend)/page.tsx` | Rewrite home (hero → manifesto sequence → 3 plates → editorial band → footer) | MODIFY |
| `src/app/(frontend)/reading/page.tsx` | Reading list (folio entries from Pages where `pageType=reading-article`) | NEW |
| `src/app/(frontend)/reading/[slug]/page.tsx` | Reading article detail | NEW |
| `src/app/(frontend)/manifesto/page.tsx` | Manifesto (single Pages doc, `pageType=manifesto`) | NEW |
| `src/app/(frontend)/credits/page.tsx` | Credits (single Pages doc, `pageType=credits`) | NEW |
| `src/app/(frontend)/atlas/page.tsx` | "Coming soon" placeholder, Plan 2 replaces this | NEW |
| `src/app/(frontend)/doctrine/page.tsx` | "Coming soon" placeholder, Plan 3 replaces this | NEW |
| `src/app/(frontend)/catechist/page.tsx` | "Coming soon" placeholder, Plan 4 replaces this | NEW |
| `src/scripts/seed-foundation.ts` | Programmatic seed: Settings, ManifestoSequence, Manifesto + Credits Pages, 2 reading articles, all `_isSample: true` | NEW |
| `package.json` | Add `seed:foundation` script | MODIFY |

After this plan, the repo has 17 new files, 4 modified files, and a complete walkable public site with placeholders for the three pillar pages.

---

## Conventions used throughout this plan

- **No tests for pure JSX components** — they're verified by `pnpm typecheck`, `pnpm lint`, and visual smoke test at the end. The skill's TDD principle applies to logic (rate-limit math, citation validators, chunkers — those come in later plans).
- **Path-relative-to-repo-root** (`/home/ajojotank/Documents/Tantum-Ergo/webapp/`) for all file paths. The `src/` prefix is already accounted for.
- **Exact commit messages** in `git commit -m` lines — copy verbatim, no edits.
- **Stop and verify** at each step that says "Run X and confirm Y."

---

## Task 1 · Tailwind class-name util

**Files:**
- Create: `src/lib/cn.ts`

- [ ] **Step 1: Create cn util**

```ts
// src/lib/cn.ts
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Install runtime deps `clsx` and `tailwind-merge`**

```bash
pnpm add clsx tailwind-merge
```

Expected: both packages listed in `package.json` dependencies, no peer-dep warnings.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/cn.ts package.json pnpm-lock.yaml
git commit -m "feat(foundation): add cn() class-name helper"
```

---

## Task 2 · Payload server client helper

**Files:**
- Create: `src/lib/payload.ts`

- [ ] **Step 1: Create the helper**

```ts
// src/lib/payload.ts
import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'

let cached: Awaited<ReturnType<typeof getPayload>> | null = null

export async function payload() {
  if (cached) return cached
  cached = await getPayload({ config })
  return cached
}
```

- [ ] **Step 2: Install `server-only`**

```bash
pnpm add server-only
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/payload.ts package.json pnpm-lock.yaml
git commit -m "feat(foundation): add payload() server-side client helper"
```

---

## Task 3 · Raw-tables initialiser (idempotent)

**Files:**
- Create: `src/db/init-raw-tables.ts`

This creates `rate_limits`, `source_chunks`, `media_chunks`, and ensures `vector` extension exists. Runs once on Payload's `onInit` lifecycle hook; idempotent (uses `IF NOT EXISTS`).

- [ ] **Step 1: Create the initialiser**

```ts
// src/db/init-raw-tables.ts
import type { Payload } from 'payload'

const SQL = /* sql */ `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS payload.rate_limits (
  id           bigserial PRIMARY KEY,
  bucket       text NOT NULL,
  ip_hash      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON payload.rate_limits (bucket, ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS payload.source_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     integer NOT NULL,
  chunk_index   integer NOT NULL,
  text          text NOT NULL,
  locator       text NOT NULL,
  page_number   integer,
  embedding     vector(1536) NOT NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx
  ON payload.source_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS source_chunks_source_idx
  ON payload.source_chunks (source_id);

CREATE TABLE IF NOT EXISTS payload.media_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id      integer NOT NULL,
  embedding     vector(1536) NOT NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_chunks_embedding_idx
  ON payload.media_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS media_chunks_media_idx
  ON payload.media_chunks (media_id);
`

export async function initRawTables(payload: Payload) {
  // postgres adapter exposes drizzle on payload.db.drizzle
  const db = (payload.db as unknown as { drizzle: { execute: (sql: string) => Promise<unknown> } }).drizzle
  await db.execute(SQL)
  payload.logger.info('Raw tables ensured: rate_limits, source_chunks, media_chunks (pgvector)')
}
```

> **Why a typecast:** Payload's public `db` type doesn't expose `drizzle` directly. The cast is intentional and limited to this single file. If `@payloadcms/db-postgres` later exports the type, swap it in.

- [ ] **Step 2: Wire into payload.config.ts**

Edit `src/payload.config.ts`. Find the `export default buildConfig({` line and the closing `})`. Just before the closing `})`, add an `onInit` callback. The full new shape (replace the existing `export default buildConfig({...})` block):

```ts
import { initRawTables } from './db/init-raw-tables'

// ...existing imports unchanged...

export default buildConfig({
  serverURL,
  admin: { /* unchanged */ },
  collections: [Users, Media, Pages],
  cors: [serverURL].filter(Boolean),
  csrf: [serverURL].filter(Boolean),
  editor: lexicalEditor(),
  email,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    schemaName: 'payload',
  }),
  sharp,
  graphQL: { schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql') },
  upload: { limits: { fileSize: 25_000_000 } },
  onInit: async (payload) => {
    await initRawTables(payload)
  },
})
```

(All fields except `onInit` already exist; only the new `onInit` block needs to be added, plus the new `import` at the top.)

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Boot dev and verify tables exist**

```bash
pnpm dev
```

Wait for "Ready in" line, then in another terminal:

```bash
curl -s http://localhost:3000/admin > /dev/null
```

(Triggers Payload's full init.) Then via the Supabase MCP (or `psql`):

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'payload'
  AND table_name IN ('rate_limits','source_chunks','media_chunks');
```

Expected: 3 rows returned.

- [ ] **Step 5: Commit**

Stop the dev server (Ctrl-C). Commit:

```bash
git add src/db/init-raw-tables.ts src/payload.config.ts
git commit -m "feat(foundation): create rate_limits + pgvector chunks tables on boot"
```

---

## Task 4 · Extend Media collection with `_isSample`

**Files:**
- Modify: `src/collections/Media.ts`

- [ ] **Step 1: Add the field**

In `src/collections/Media.ts`, in the `fields:` array, append a new field after the existing `attribution` field:

```ts
{
  name: '_isSample',
  type: 'checkbox',
  label: 'Sample / placeholder content',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: 'Marks this asset as filler. Frontend renders a [Sample] badge when shown.',
  },
},
```

- [ ] **Step 2: Regenerate Payload types**

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` updates; the `Media` interface gains `_isSample?: boolean | null`.

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/collections/Media.ts src/payload-types.ts
git commit -m "feat(foundation): add _isSample flag to Media (Reliquary)"
```

---

## Task 5 · Extend Pages collection with `pageType` + `_isSample` + `excerpt` + `publishedAt`

**Files:**
- Modify: `src/collections/Pages.ts`

- [ ] **Step 1: Add `pageType` to the Content tab fields**

Open `src/collections/Pages.ts`. Inside the first `tabs[]` entry (label: 'Content'), insert these two fields at the top of `fields[]` (above `title`):

```ts
{
  name: 'pageType',
  type: 'select',
  required: true,
  defaultValue: 'generic',
  options: [
    { label: 'Home block', value: 'home-block' },
    { label: 'Manifesto', value: 'manifesto' },
    { label: 'Credits', value: 'credits' },
    { label: 'Reading article', value: 'reading-article' },
    { label: 'Generic', value: 'generic' },
  ],
  admin: {
    description: 'Drives where this Page surfaces. Manifesto and Credits should only have one published doc each.',
  },
},
```

- [ ] **Step 2: Add `excerpt` and `publishedAt` to the Content tab**

Inside the same Content tab `fields[]` array, after `body` (the richText field), append:

```ts
{
  name: 'excerpt',
  type: 'textarea',
  admin: {
    description: 'Short summary shown on listing pages (Reading index, home preview band).',
    condition: (data) => data?.pageType === 'reading-article',
  },
},
{
  name: 'publishedAt',
  type: 'date',
  admin: {
    position: 'sidebar',
    description: 'Sort key for Reading index. Defaults to creation time.',
    condition: (data) => data?.pageType === 'reading-article',
  },
},
```

- [ ] **Step 3: Add `_isSample` to the sidebar (after the existing `slug` field at the bottom of the collection)**

After the closing `]` of `tabs[]`, the collection has a `slug` field outside the tabs. After `slug`, append:

```ts
{
  name: '_isSample',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
    description: 'Marks this Page as filler / placeholder for the content team.',
  },
},
```

- [ ] **Step 4: Regenerate types**

```bash
pnpm generate:types
```

- [ ] **Step 5: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. The `Page` interface in `payload-types.ts` now has `pageType`, `excerpt`, `publishedAt`, `_isSample`.

- [ ] **Step 6: Boot dev, hit /admin, verify schema applied**

```bash
pnpm dev
```

Open <http://localhost:3000/admin> → Pages → New. Confirm the new fields render in the studio. Stop dev.

- [ ] **Step 7: Commit**

```bash
git add src/collections/Pages.ts src/payload-types.ts
git commit -m "feat(foundation): extend Pages with pageType, excerpt, publishedAt, _isSample"
```

---

## Task 6 · Settings global

**Files:**
- Create: `src/globals/Settings.ts`

- [ ] **Step 1: Create the global**

```ts
// src/globals/Settings.ts
import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site Settings',
  admin: {
    description: 'Site-wide chrome — title, tagline, footer copy, socials.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      defaultValue: 'Tantum Ergo',
      required: true,
    },
    {
      name: 'siteTagline',
      type: 'text',
      defaultValue: 'A digital Sistine Chapel for Catholic formation.',
    },
    {
      name: 'footerCopy',
      type: 'richText',
      admin: { description: 'Long-form footer copy. Plain prose works fine here.' },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'X', value: 'x' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Email', value: 'email' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'mapboxStyle',
      type: 'text',
      label: 'Mapbox style URL',
      admin: {
        description: 'mapbox:// URL. Leave blank for default style. Used by /atlas (Plan 2).',
      },
    },
    {
      name: 'catechistRateLimit',
      type: 'group',
      fields: [
        { name: 'requestsPerHour', type: 'number', defaultValue: 20, required: true },
        {
          name: 'refusalMessage',
          type: 'text',
          defaultValue:
            'You’ve asked many questions in a short time. Please rest and return shortly.',
        },
      ],
    },
    {
      name: 'showSampleBadges',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hide [Sample] badges sitewide once content team is ready for launch.',
      },
    },
  ],
}
```

- [ ] **Step 2: Commit (will register in Task 8)**

```bash
git add src/globals/Settings.ts
git commit -m "feat(foundation): add Settings global"
```

---

## Task 7 · ManifestoSequence global

**Files:**
- Create: `src/globals/ManifestoSequence.ts`

- [ ] **Step 1: Create the global**

```ts
// src/globals/ManifestoSequence.ts
import type { GlobalConfig } from 'payload'

export const ManifestoSequence: GlobalConfig = {
  slug: 'manifesto-sequence',
  label: 'Home · Manifesto Sequence',
  admin: {
    description:
      'The scroll-scrubbed image sequence on the homepage. 3–6 frames recommended. Order = scroll order.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'When off, the section is omitted from the homepage entirely.' },
    },
    {
      name: 'frames',
      type: 'array',
      minRows: 0,
      maxRows: 8,
      labels: { singular: 'Frame', plural: 'Frames' },
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'caption', type: 'richText' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/globals/ManifestoSequence.ts
git commit -m "feat(foundation): add ManifestoSequence global"
```

---

## Task 8 · Register globals in payload.config.ts

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Import the new globals**

At the top of `src/payload.config.ts`, alongside existing imports, add:

```ts
import { Settings } from './globals/Settings'
import { ManifestoSequence } from './globals/ManifestoSequence'
```

- [ ] **Step 2: Register them**

In the `buildConfig({...})` block, add the `globals` key (this key is currently absent). Place it directly after the `collections` key:

```ts
collections: [Users, Media, Pages],
globals: [Settings, ManifestoSequence],
```

- [ ] **Step 3: Regenerate types and importmap**

```bash
pnpm generate:types && pnpm generate:importmap
```

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. `payload-types.ts` now exports `Settings` and `ManifestoSequence` interfaces.

- [ ] **Step 5: Boot dev, verify globals appear in /admin sidebar**

```bash
pnpm dev
```

Open <http://localhost:3000/admin>. Confirm "Site Settings" and "Home · Manifesto Sequence" appear in the studio nav under Globals.

Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/payload.config.ts src/payload-types.ts src/app/\(payload\)/admin/importMap.js
git commit -m "feat(foundation): register Settings + ManifestoSequence globals"
```

---

## Task 9 · `section-reveal` client component

**Files:**
- Create: `src/app/(frontend)/_components/section-reveal.tsx`

This wraps content with a stagger fade-in on first paint via Framer's `motion` + `viewport: { once: true }`. Used across home, reading, manifesto.

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/section-reveal.tsx
'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const SPRING = { type: 'spring', stiffness: 110, damping: 22, mass: 0.5 } as const

const parent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const child: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: SPRING },
}

export function SectionReveal({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: 'div' | 'section' | 'header' | 'footer' | 'article'
  className?: string
}) {
  const MotionTag = motion[Tag] as typeof motion.div
  return (
    <MotionTag
      className={className}
      variants={parent}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </MotionTag>
  )
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div className={className} variants={child}>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/section-reveal.tsx
git commit -m "feat(foundation): add SectionReveal + RevealItem stagger primitives"
```

---

## Task 10 · `mobile-drawer` client component (curtain reveal nav)

**Files:**
- Create: `src/app/(frontend)/_components/mobile-drawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/mobile-drawer.tsx
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

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Lock body scroll when open
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
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="group block"
                    >
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

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/mobile-drawer.tsx
git commit -m "feat(foundation): add MobileDrawer with curtain-reveal motion"
```

---

## Task 11 · `site-header` client component

**Files:**
- Create: `src/app/(frontend)/_components/site-header.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/site-header.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

import { MobileDrawer } from './mobile-drawer'

const NAV = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/doctrine', label: 'Doctrine' },
  { href: '/catechist', label: 'Catechist' },
  { href: '/reading', label: 'Reading' },
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8 md:pt-10">
        <Link href="/" className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full bg-ink text-vellum text-[10px] font-mono tracking-[0.2em]"
            style={{ boxShadow: 'var(--shadow-relief)' }}
          >
            TE
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg italic text-ink">Tantum Ergo</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Studio · ZA
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink">
              About ⌄
            </summary>
            <div className="absolute right-0 mt-3 w-48 rounded-xl border border-ink/10 bg-vellum p-2 shadow-altar">
              <Link
                href="/manifesto"
                className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-vellum-deep"
              >
                Manifesto
              </Link>
              <Link
                href="/credits"
                className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-vellum-deep"
              >
                Credits
              </Link>
            </div>
          </details>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 md:hidden"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="h-px w-4 bg-ink" />
            <span className="h-px w-4 bg-ink" />
            <span className="h-px w-4 bg-ink" />
          </span>
        </button>
      </header>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/site-header.tsx
git commit -m "feat(foundation): add SiteHeader with desktop nav + mobile hamburger"
```

---

## Task 12 · `site-footer` server component

**Files:**
- Create: `src/app/(frontend)/_components/site-footer.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/site-footer.tsx
import Link from 'next/link'

import { payload } from '@/lib/payload'

const PLATFORM_LABEL: Record<string, string> = {
  x: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  email: 'Email',
}

export async function SiteFooter() {
  const settings = await (await payload()).findGlobal({ slug: 'settings' })

  return (
    <footer className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-6 border-t border-ink/10 pt-8 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-2xl italic text-ink">{settings.siteTitle}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {settings.siteTagline}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {(settings.socials ?? []).map((s, i) => (
              <li key={i}>
                <Link
                  href={s.url}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
                >
                  {PLATFORM_LABEL[s.platform] ?? s.platform}
                </Link>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            © {new Date().getFullYear()} · Tantum Ergo · ZA
          </p>
        </div>
      </div>
      <p className="mt-6 font-display text-sm italic text-ink-soft">
        Genitori, Genitoque · laus et jubilatio.
      </p>
    </footer>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. (`SiteFooter` consumes the regenerated `Settings` type from Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/site-footer.tsx
git commit -m "feat(foundation): add SiteFooter rendered from Settings global"
```

---

## Task 13 · `manifesto-sequence` client component (scroll-scrubbed)

**Files:**
- Create: `src/app/(frontend)/_components/manifesto-sequence.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/manifesto-sequence.tsx
'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

type Frame = {
  eyebrow?: string | null
  caption?: unknown // Lexical rich text — we render as plain extract
  image?: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null } | null
}

function richTextToString(value: unknown): string {
  // Minimal, safe extractor for Lexical root.children blocks.
  try {
    const root = (value as { root?: { children?: unknown[] } } | null)?.root
    if (!root?.children) return ''
    const out: string[] = []
    const walk = (node: unknown) => {
      const n = node as { type?: string; text?: string; children?: unknown[] }
      if (typeof n.text === 'string') out.push(n.text)
      n.children?.forEach(walk)
    }
    root.children.forEach(walk)
    return out.join(' ').trim()
  } catch {
    return ''
  }
}

export function ManifestoSequence({ frames }: { frames: Frame[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const count = Math.max(frames.length, 1)
  const activeIndex = useTransform(scrollYProgress, (v) =>
    Math.min(count - 1, Math.floor(v * count)),
  )

  if (frames.length === 0) return null

  return (
    <section
      ref={ref}
      aria-label="Manifesto sequence"
      className="relative"
      style={{ height: `${count * 100}vh` }}
    >
      <div className="sticky top-0 flex h-[100dvh] items-stretch overflow-hidden">
        {frames.map((frame, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: useTransform(activeIndex, (idx) => (idx === i ? 1 : 0)),
            }}
          >
            <div className="relative h-full w-full">
              {frame.image?.url ? (
                <Image
                  src={frame.image.url}
                  alt={frame.image.alt ?? ''}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      'radial-gradient(80% 60% at 50% 35%, rgba(176,138,62,0.3), transparent 70%), linear-gradient(180deg, rgba(31,51,88,0.4), rgba(12,10,8,0.85))',
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-start gap-3 px-6 pb-16 text-vellum">
                {frame.eyebrow ? (
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
                    {frame.eyebrow}
                  </p>
                ) : null}
                <p className="font-display text-3xl italic leading-tight md:text-5xl">
                  {richTextToString(frame.caption)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Frame indicator dots */}
        <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-8">
          {frames.map((_, i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-vellum/30"
              style={{
                opacity: useTransform(activeIndex, (idx) => (idx === i ? 1 : 0.4)),
                scale: useTransform(activeIndex, (idx) => (idx === i ? 1.4 : 1)),
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/manifesto-sequence.tsx
git commit -m "feat(foundation): add ManifestoSequence scroll-scrubbed component"
```

---

## Task 14 · `pillar-plate` client component

**Files:**
- Create: `src/app/(frontend)/_components/pillar-plate.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/app/(frontend)/_components/pillar-plate.tsx
'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

const SPRING = { stiffness: 200, damping: 20, mass: 0.6 } as const

export function PillarPlate({
  index,
  name,
  intent,
  href,
  tone,
}: {
  index: 'I' | 'II' | 'III'
  name: string
  intent: string
  href: string
  tone: 'rubric' | 'lapis' | 'gilt'
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, SPRING)
  const y = useSpring(py, SPRING)
  const rotateX = useTransform(py, (v) => (v / 6).toFixed(2))
  const rotateY = useTransform(px, (v) => (-v / 6).toFixed(2))

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(hover: none)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    px.set(Math.max(-12, Math.min(12, dx * 0.1)))
    py.set(Math.max(-12, Math.min(12, dy * 0.1)))
  }
  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  const palette =
    tone === 'rubric'
      ? 'from-rubric/15 to-vellum-deep/40'
      : tone === 'lapis'
      ? 'from-lapis/15 to-vellum-deep/40'
      : 'from-gilt/20 to-vellum-deep/40'

  return (
    <motion.span
      style={{ x, y, rotateX, rotateY, transformPerspective: 700 }}
      className="block will-change-transform"
    >
      <Link
        ref={ref}
        href={href}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-altar)] bg-gradient-to-br ${palette} p-6 ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-altar`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Plate {index}
        </p>
        <h3 className="mt-3 font-display text-3xl italic text-ink md:text-4xl">{name}</h3>
        <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-ink-soft">{intent}</p>
        <span
          aria-hidden
          className="absolute bottom-6 left-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink"
        >
          Enter
          <span className="inline-block h-px w-6 bg-current opacity-50 transition-all duration-300 group-hover:w-12 group-hover:opacity-100" />
        </span>
      </Link>
    </motion.span>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/_components/pillar-plate.tsx
git commit -m "feat(foundation): add PillarPlate magnetic entry tile"
```

---

## Task 15 · Refresh `(frontend)/layout.tsx`

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`

- [ ] **Step 1: Replace the file**

Open `src/app/(frontend)/layout.tsx` and replace its content with:

```tsx
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google'

import { ScrollRubric } from './_components/scroll-rubric'
import { SiteFooter } from './_components/site-footer'
import { SiteHeader } from './_components/site-header'
import { payload } from '@/lib/payload'

import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})
const geist = Geist({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await (await payload()).findGlobal({ slug: 'settings' })
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    ),
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description: settings.siteTagline,
    applicationName: settings.siteTitle,
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteTagline ?? undefined,
      type: 'website',
      locale: 'en_ZA',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf6ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a08' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

export default function FrontendRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-vellum text-ink selection:bg-rubric/20 selection:text-rubric">
        <ScrollRubric />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/layout.tsx
git commit -m "feat(foundation): wire SiteHeader/SiteFooter and Settings-driven metadata"
```

---

## Task 16 · Rewrite home page

**Files:**
- Modify: `src/app/(frontend)/page.tsx`

- [ ] **Step 1: Replace the file**

```tsx
// src/app/(frontend)/page.tsx
import Link from 'next/link'

import { MagneticCTA } from './_components/magnetic-cta'
import { ManifestoSequence } from './_components/manifesto-sequence'
import { PillarPlate } from './_components/pillar-plate'
import { RevealItem, SectionReveal } from './_components/section-reveal'
import { payload } from '@/lib/payload'

export default async function Home() {
  const p = await payload()
  const [sequence, articles] = await Promise.all([
    p.findGlobal({ slug: 'manifesto-sequence' }),
    p.find({
      collection: 'pages',
      where: {
        and: [
          { pageType: { equals: 'reading-article' } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 6,
      sort: '-publishedAt',
    }),
  ])

  return (
    <main className="relative isolate">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 pt-16 pb-24 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-28 md:pb-40">
        <SectionReveal className="md:col-span-7 md:pr-8">
          <RevealItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              In Hoc Signo · MMXXVI
            </p>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,7.5vw,5.6rem)] leading-[0.92] tracking-tight text-ink">
              A digital
              <br />
              <em className="font-light italic text-rubric-deep">Sistine Chapel</em> for
              <br />
              Catholic formation.
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink-soft sm:text-lg">
              Tantum Ergo holds three instruments inside one reverent surface — a cartographic{' '}
              <span className="font-display italic text-ink">Miracle Atlas</span>, a long-form{' '}
              <span className="font-display italic text-ink">Doctrine LMS</span>, and an AI{' '}
              <span className="font-display italic text-ink">Catechist</span> bound to citation.
              Mobile-first. Scroll-scrubbed. Built to last centuries.
            </p>
          </RevealItem>
          <RevealItem>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticCTA href="/atlas">Begin pilgrimage</MagneticCTA>
              <MagneticCTA href="/manifesto" intent="secondary">
                Read the manifesto
              </MagneticCTA>
            </div>
          </RevealItem>
        </SectionReveal>

        <aside aria-hidden className="relative md:col-span-5">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-altar)] bg-vellum-deep"
            style={{ boxShadow: 'var(--shadow-altar)' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(80% 60% at 50% 18%, rgba(176,138,62,0.28) 0%, transparent 60%), linear-gradient(180deg, rgba(31,51,88,0.10), rgba(140,42,42,0.10))',
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${20 + i * 12}%`,
                    aspectRatio: '1',
                    border: '1px solid rgba(26,20,16,0.06)',
                  }}
                />
              ))}
              <div
                className="h-3 w-3 rounded-full bg-rubric"
                style={{ boxShadow: '0 0 0 6px rgba(140,42,42,0.18)' }}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Plate 01 · Oculus
              </p>
              <p className="font-display text-sm italic text-ink-soft">
                Lumen ad revelationem
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* Manifesto sequence (scroll-scrubbed) */}
      {sequence.enabled && (sequence.frames?.length ?? 0) > 0 ? (
        <ManifestoSequence frames={sequence.frames as never} />
      ) : null}

      {/* Three pillar plates */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 md:py-32">
        <SectionReveal className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <RevealItem className="md:col-span-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              Three pillars
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight text-ink md:text-6xl">
              Cartography. Formation. <em className="italic text-rubric-deep">Dialogue.</em>
            </h2>
          </RevealItem>
          <RevealItem className="md:col-span-12">
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[2fr_1fr_1fr]">
              <PillarPlate
                index="I"
                name="Atlas"
                intent="A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record."
                href="/atlas"
                tone="rubric"
              />
              <PillarPlate
                index="II"
                name="Doctrine"
                intent="A breviary-paced LMS over councils, encyclicals, the Catechism."
                href="/doctrine"
                tone="lapis"
              />
              <PillarPlate
                index="III"
                name="Catechist"
                intent="An interlocutor bound to citation. Cites; never invents."
                href="/catechist"
                tone="gilt"
              />
            </div>
          </RevealItem>
        </SectionReveal>
      </section>

      {/* Editorial primer band */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 md:pb-40">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            From the reading room
          </p>
          <Link
            href="/reading"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
          >
            All articles →
          </Link>
        </div>
        {articles.docs.length === 0 ? (
          <p className="mt-12 font-display text-2xl italic text-ink-soft">
            Reading room opens soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {articles.docs.map((a) => (
              <Link
                key={a.id}
                href={`/reading/${a.slug}`}
                className="group block border-t border-ink/10 pt-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Reading'}
                </p>
                <h3 className="mt-2 font-display text-xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-2xl">
                  {a.title}
                </h3>
                {a.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {a.excerpt}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/page.tsx
git commit -m "feat(foundation): rewrite home with manifesto sequence + pillar plates"
```

---

## Task 17 · Reading list page

**Files:**
- Create: `src/app/(frontend)/reading/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(frontend)/reading/page.tsx
import Link from 'next/link'

import { payload } from '@/lib/payload'

export const metadata = {
  title: 'Reading',
  description: 'Editorial articles and meditations from the Tantum Ergo studio.',
}

export default async function ReadingIndex() {
  const articles = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { pageType: { equals: 'reading-article' } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 50,
    sort: '-publishedAt',
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Reading room
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        Articles &amp; meditations
      </h1>

      {articles.docs.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          Reading room opens soon.
        </p>
      ) : (
        <ul className="mt-16 divide-y divide-ink/10">
          {articles.docs.map((a) => (
            <li key={a.id} className="py-8">
              <Link href={`/reading/${a.slug}`} className="group block">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''}
                  {a._isSample ? ' · [Sample]' : ''}
                </p>
                <h2 className="mt-2 font-display text-3xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
                  {a.title}
                </h2>
                {a.excerpt ? (
                  <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
                    {a.excerpt}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/reading/page.tsx
git commit -m "feat(foundation): add Reading index"
```

---

## Task 18 · Reading detail page

**Files:**
- Create: `src/app/(frontend)/reading/[slug]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(frontend)/reading/[slug]/page.tsx
import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'

import { payload } from '@/lib/payload'

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const res = await (await payload()).find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { pageType: { equals: 'reading-article' } }] },
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) return { title: 'Not found' }
  return {
    title: doc.title,
    description: doc.excerpt ?? undefined,
  }
}

export default async function ReadingArticle({ params }: Args) {
  const { slug } = await params
  const res = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slug } },
        { pageType: { equals: 'reading-article' } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) notFound()

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Reading
        {doc._isSample ? ' · [Sample]' : ''}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {doc.title}
      </h1>
      {doc.publishedAt ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {new Date(doc.publishedAt).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      ) : null}
      {doc.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : null}
    </article>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/reading/\[slug\]/page.tsx
git commit -m "feat(foundation): add Reading article detail with Lexical render"
```

---

## Task 19 · Manifesto page

**Files:**
- Create: `src/app/(frontend)/manifesto/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(frontend)/manifesto/page.tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payload } from '@/lib/payload'

export const metadata = { title: 'Manifesto' }

export default async function Manifesto() {
  const res = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { pageType: { equals: 'manifesto' } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
  })
  const doc = res.docs[0]

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Manifesto
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
        {doc?.title ?? 'A digital Sistine Chapel.'}
      </h1>
      {doc?.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          The manifesto is being written.
        </p>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck && git add src/app/\(frontend\)/manifesto/page.tsx && git commit -m "feat(foundation): add Manifesto page"
```

---

## Task 20 · Credits page

**Files:**
- Create: `src/app/(frontend)/credits/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(frontend)/credits/page.tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payload } from '@/lib/payload'

export const metadata = { title: 'Credits' }

export default async function Credits() {
  const res = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { pageType: { equals: 'credits' } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
  })
  const doc = res.docs[0]

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Credits
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {doc?.title ?? 'Sources &amp; ecclesial review'}
      </h1>
      {doc?.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          Acknowledgements pending.
        </p>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm typecheck && git add src/app/\(frontend\)/credits/page.tsx && git commit -m "feat(foundation): add Credits page"
```

---

## Task 21 · Coming-soon placeholders for Atlas, Doctrine, Catechist

**Files:**
- Create: `src/app/(frontend)/atlas/page.tsx`
- Create: `src/app/(frontend)/doctrine/page.tsx`
- Create: `src/app/(frontend)/catechist/page.tsx`

- [ ] **Step 1: Create a shared placeholder component**

`src/app/(frontend)/_components/coming-soon.tsx`:

```tsx
// src/app/(frontend)/_components/coming-soon.tsx
import Link from 'next/link'

export function ComingSoon({
  pillar,
  numeral,
  intent,
  comingIn,
}: {
  pillar: string
  numeral: 'I' | 'II' | 'III'
  intent: string
  comingIn: string
}) {
  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-3xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Plate {numeral} · Coming soon
      </p>
      <h1 className="mt-4 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
        {pillar}
      </h1>
      <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-ink-soft">{intent}</p>
      <p className="mt-12 font-display text-base italic text-ink-soft">{comingIn}</p>
      <div className="mt-16 flex flex-wrap gap-4">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
        >
          ← Return to threshold
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create three pages using it**

`src/app/(frontend)/atlas/page.tsx`:

```tsx
import { ComingSoon } from '../_components/coming-soon'

export const metadata = { title: 'Atlas — coming soon' }

export default function AtlasComing() {
  return (
    <ComingSoon
      pillar="Miracle Atlas"
      numeral="I"
      intent="A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and ecclesial status. Free-explore globe and curated pilgrimage."
      comingIn="Opening this week."
    />
  )
}
```

`src/app/(frontend)/doctrine/page.tsx`:

```tsx
import { ComingSoon } from '../_components/coming-soon'

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

`src/app/(frontend)/catechist/page.tsx`:

```tsx
import { ComingSoon } from '../_components/coming-soon'

export const metadata = { title: 'Catechist — coming soon' }

export default function CatechistComing() {
  return (
    <ComingSoon
      pillar="Catechist"
      numeral="III"
      intent="An interlocutor bound to citation. It quotes the Magisterium; it never invents."
      comingIn="Opening this week."
    />
  )
}
```

- [ ] **Step 3: Typecheck + lint + commit**

```bash
pnpm typecheck && pnpm lint
git add src/app/\(frontend\)/_components/coming-soon.tsx \
        src/app/\(frontend\)/atlas/page.tsx \
        src/app/\(frontend\)/doctrine/page.tsx \
        src/app/\(frontend\)/catechist/page.tsx
git commit -m "feat(foundation): add ComingSoon placeholders for the three pillars"
```

---

## Task 22 · Foundation seed script

**Files:**
- Create: `src/scripts/seed-foundation.ts`
- Modify: `package.json`

This script populates Settings, ManifestoSequence, the Manifesto Page, the Credits Page, and 2 sample reading articles. It's idempotent — uses `update` semantics (creates if not exists, updates if exists).

- [ ] **Step 1: Create the script**

```ts
// src/scripts/seed-foundation.ts
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  payload.logger.info('Seeding Settings global…')
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      siteTitle: 'Tantum Ergo',
      siteTagline: 'A digital Sistine Chapel for Catholic formation.',
      footerCopy: {
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
                {
                  type: 'text',
                  version: 1,
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                  text:
                    'Tantum Ergo is a citation-bound formation surface. Mobile-first. Built to last centuries.',
                },
              ],
            },
          ],
        },
      } as never,
      catechistRateLimit: { requestsPerHour: 20, refusalMessage: undefined },
      showSampleBadges: true,
    },
  })

  payload.logger.info('Seeding ManifestoSequence (with placeholder frames)…')
  await payload.updateGlobal({
    slug: 'manifesto-sequence',
    data: {
      enabled: true,
      frames: [
        {
          eyebrow: 'I. Threshold',
          caption: lexicalLine('We begin not with information, but with reverence.'),
        },
        {
          eyebrow: 'II. Witness',
          caption: lexicalLine('Two thousand years of testimony, mapped to the centuries.'),
        },
        {
          eyebrow: 'III. Page',
          caption: lexicalLine('Doctrine, paced like a breviary — read, watched, listened to.'),
        },
        {
          eyebrow: 'IV. Voice',
          caption: lexicalLine('A catechist that cites; that never invents.'),
        },
      ],
    },
  })

  await ensurePage(payload, 'home', 'home-block', 'Home block (filler)', '[Sample]')
  await ensurePage(
    payload,
    'manifesto',
    'manifesto',
    'A digital Sistine Chapel.',
    'Tantum Ergo is a vow disguised as a website. Three instruments — Atlas, Doctrine, Catechist — held under one threshold. Mobile-first. Scroll-scrubbed. Cited; never invented.',
  )
  await ensurePage(
    payload,
    'credits',
    'credits',
    'Sources &amp; ecclesial review',
    'Sources, attributions, and ecclesial review notes will appear here as the content team curates them. The Catechism (Vatican English) is © Libreria Editrice Vaticana; explicit educational-use permission must be confirmed before public launch. Bible filler in the Catechist corpus uses the Douay-Rheims translation (public domain).',
  )

  await ensurePage(
    payload,
    'lumen-de-lumine',
    'reading-article',
    'Lumen de Lumine [Sample]',
    'Light from light, true God from true God — a brief reading on the Nicene confession of the Son’s consubstantiality with the Father.',
    {
      excerpt:
        'The Nicene fathers chose homoousios — “of one substance” — over the gentler homoiousios. One iota; an empire of meaning.',
      publishedAt: new Date('2026-04-21').toISOString(),
    },
  )
  await ensurePage(
    payload,
    'on-the-eucharistic-real-presence',
    'reading-article',
    'On the Eucharistic Real Presence [Sample]',
    'A primer on the Catholic teaching of the substantial presence of Christ — Body, Blood, soul, and divinity — under the species of bread and wine.',
    {
      excerpt:
        'The substance changes; the accidents remain. This is not a metaphor; it is what the Church confesses.',
      publishedAt: new Date('2026-04-28').toISOString(),
    },
  )

  payload.logger.info('Seed complete.')
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

type EnsureExtras = { excerpt?: string; publishedAt?: string }

async function ensurePage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  pageType: 'home-block' | 'manifesto' | 'credits' | 'reading-article',
  title: string,
  bodyText: string,
  extras: EnsureExtras = {},
) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const data = {
    title,
    slug,
    pageType,
    _isSample: true,
    body: lexicalLine(bodyText),
    ...extras,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated page ${slug}`)
  } else {
    await payload.create({ collection: 'pages', data })
    payload.logger.info(`Created page ${slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the script to package.json**

In `package.json`, add to `scripts`:

```json
"seed:foundation": "tsx src/scripts/seed-foundation.ts"
```

- [ ] **Step 3: Install `tsx` (dev dep — needed to run TypeScript scripts directly)**

```bash
pnpm add -D tsx dotenv
```

- [ ] **Step 4: Run the seed (against the live Supabase via env)**

```bash
pnpm seed:foundation
```

Expected output: log lines for "Seeding Settings global…", "Seeding ManifestoSequence…", "Created page home", "Created page manifesto", "Created page credits", "Created page lumen-de-lumine", "Created page on-the-eucharistic-real-presence", "Seed complete."

- [ ] **Step 5: Commit**

```bash
git add src/scripts/seed-foundation.ts package.json pnpm-lock.yaml
git commit -m "feat(foundation): add idempotent foundation seed (Settings, sequence, pages)"
```

---

## Task 23 · Smoke test all routes

**Files:** none modified

- [ ] **Step 1: Boot dev**

```bash
pnpm dev
```

- [ ] **Step 2: Curl every route and confirm 200**

```bash
for path in / /reading /reading/lumen-de-lumine /reading/on-the-eucharistic-real-presence /manifesto /credits /atlas /doctrine /catechist; do
  printf "%-40s " "$path"
  curl -s -o /dev/null -w "%{http_code}\n" --max-time 60 "http://localhost:3000$path"
done
```

Expected: every route returns `200`. Pause and investigate any non-200.

- [ ] **Step 3: Open the homepage in a browser, verify visually**

Open <http://localhost:3000/> and confirm:
- Hero loads, magnetic CTAs respond on hover (desktop)
- Manifesto sequence section: scroll down — frames swap as you scroll
- Three pillar plates render with magnetic tilt on hover
- Editorial primer band shows the two sample articles
- Footer renders with title, tagline, copyright

Then visit:
- `/reading` — both sample articles listed
- `/reading/lumen-de-lumine` — full body renders
- `/manifesto` — manifesto body
- `/credits` — credits body
- `/atlas`, `/doctrine`, `/catechist` — three coming-soon placeholders

Test mobile: open DevTools, set viewport to 390×844, hit `/`. Confirm:
- Hero collapses to single column
- Hamburger button appears top-right
- Tapping it opens the curtain-reveal drawer with the six links
- Drawer items are tappable, close on click

- [ ] **Step 4: Stop dev. Commit nothing — this is a verification gate.**

If any check fails, return to the relevant earlier task to fix.

---

## Task 24 · Production build smoke test

**Files:** none modified

- [ ] **Step 1: Build**

```bash
pnpm build
```

Expected: build completes without errors. Warnings about unused vars are fine; errors are not.

- [ ] **Step 2: Start production server briefly**

```bash
pnpm start &
sleep 4
curl -s -o /dev/null -w "prod / → %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "prod /admin → %{http_code}\n" http://localhost:3000/admin
kill %1
```

Expected: `prod / → 200` and `prod /admin → 200`.

- [ ] **Step 3: No commit needed — verification gate.**

If build fails, fix and re-run.

---

## Task 25 · Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the Roadmap section to reflect actual pace**

Open `README.md`. Find the "Roadmap" section and replace its content with:

```md
## Roadmap

We're shipping v1.0 (the polished shell, ready for content team) inside one focused week, then handing off content authoring.

### Plan 1 · Foundation (this branch)
Public marketing surface, mobile drawer, scroll-scrubbed manifesto sequence, /reading + /manifesto + /credits, three pillar coming-soon placeholders. Done when foundation seed populates a walkable site.

### Plan 2 · Atlas pillar
Mapbox globe, pilgrimage scrolltelling, miracles collection.

### Plan 3 · Doctrine LMS pillar
Tracks/Modules/Units, breviary unit player with lane switcher, mastery checks, localStorage progress.

### Plan 4 · Catechist pillar
Sources collection + ingestion (PDF/DOCX → chunks → embeddings via gemini-embedding-2), `/api/catechist/ask` with structured-output citation guarantee, epistolary UI.

### Plan 5 · Storage + polish
@payloadcms/storage-s3 pointed at Supabase Storage, lint/typecheck/build clean, accessibility self-test, perf budget verification.

After v1.0, the content team takes over: they author miracles in the Atlas, modules in Doctrine, and upload Magisterial sources for the Catechist to ingest.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(foundation): refresh roadmap to per-plan cadence"
```

---

## Task 26 · Final lint + typecheck + plan complete

**Files:** none

- [ ] **Step 1: Final gate**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three commands exit 0.

- [ ] **Step 2: Status check**

```bash
git status
git log --oneline -25
```

Expected: clean working tree; ~25 commits since plan started, all `feat(foundation):` or `docs(foundation):` prefixed.

- [ ] **Step 3: Foundation plan is complete.**

Hand back to user. Plan 2 (Atlas) is next.

---

## Plan 1 self-review notes

- **Spec coverage:** §3 design language (palette/typography/motion) — applied via existing tokens + Cormorant + the motion grammar in components ✓ · §4.1 home — Task 16 ✓ · §4.5 reading — Tasks 17, 18 ✓ · §4.6 manifesto — Task 19 ✓ · §4.7 credits — Task 20 ✓ · §5.1 collection extensions — Tasks 4, 5 ✓ · §5.3 raw tables — Task 3 ✓ · §5.4 globals — Tasks 6, 7, 8 ✓ · §6.2 filler convention — Task 22 (`_isSample: true` and `[Sample]` in titles) ✓ · §4 mobile drawer — Task 10 ✓.
- **Out of scope for this plan (deferred to later plans, intentional):** Atlas (Plan 2), Doctrine LMS (Plan 3), Catechist + ingestion (Plan 4), Supabase Storage (Plan 5), accessibility audit (Plan 5).
- **Type consistency:** the `Frame` interface in Task 13's `manifesto-sequence.tsx` matches the `frames[]` shape from Task 7's `ManifestoSequence` global. Lexical content typed loosely as `unknown` then extracted; no false guarantees about shape.
- **Placeholder scan:** every step has runnable code or exact commands. No "TBD" / "implement later" present.
