# Tantum Ergo · Home Sistine polish — Phase A handoff

> **For the next Claude session:** This document is self-contained. You don't need to read prior conversation history. Memory at `MEMORY.md` is auto-loaded and gives you the project shape; this doc gives you the immediate task. Read this end-to-end, then begin.

---

## 0 · Where we are when you start

**Branch:** `feat/foundation` (already checked out)
**Latest commit:** `54c99f0` — `feat(foundation): enable autosave drafts on HomePage/ManifestoPage/CreditsPage globals`
**Plan 1 (Foundation) shipped.** The boilerplate, layout, header, mobile drawer, footer, four globals (`settings`, `home-page`, `manifesto-page`, `credits-page`), one new collection (`articles`), three pillar coming-soon placeholders, the Catechist preview pipeline, and the Gmail SMTP email adapter are all in place. Live preview updates as-you-type.

Run `pnpm dev` and you'll see the current home at `<http://localhost:3000/>`. It works but reads as "editorial broadsheet," not "Sistine Chapel." Phase A fixes that.

The user is in parallel **generating 8 images via Gemini** using the prompts in §6 below. They will upload them via the Payload Reliquary (Media collection) and assign them in the relevant studio fields. **Don't wait on them** — your job is to build the structure that consumes those images. Placeholders fill in until they arrive.

---

## 1 · What's already decided

The user has explicitly agreed to:

| Decision | Choice |
|---|---|
| Polish home now (vs deferring to Plan 5) | **Polish now** |
| Hero approach | **Full-bleed sacred-art background, text overlaid** (mobile-friendly variant required) |
| Brand mark | **Chi-rho ☧** (used as roundel + as ornament between sections + on favicon) |
| Drop cap on headline | **Yes** — illuminated capital on the first letter of "A digital…" |
| Manifesto sequence | Keeps the existing scroll-scrubbed shape; just gets real imagery instead of gradient placeholders |
| Pillar plates | Restructure as illuminated-folio-style cards: ornamental arched border + image background + drop-cap "I / II / III" |
| Section dividers | Thin gilt rule with centered chi-rho ornament |
| Texture | Bump existing grain from 4% → 8% opacity. Add a faint chi-rho watermark in the body backdrop. |
| Studio branding | Custom logo + icon (chi-rho + wordmark). Accent colour swap (rubric instead of Payload's default purple). **Don't touch elevation tokens** — that broke input contrast in a previous attempt. |

Phase B (after user uploads images) is **zero code work** — placeholders auto-swap once the upload fields are populated. So your job is fully specified in Phase A.

---

## 2 · Critical "don't break this" warnings

These are bear-traps that cost time previously. Avoid them:

### 2a · Studio CSS — don't override `--theme-elevation-*`

In `src/app/(payload)/custom.scss`, **do not** override Payload's elevation tokens (`--theme-elevation-0`, `--50`, `--100`, etc.). Doing so cracks the contrast model — input labels, placeholders, borders all derive from those tokens. We did this once before; it made the studio unreadable until reverted. Scope your overrides tightly to:

- Sidebar brand strip (the area around the logo)
- Login screen
- Accent color tokens (success/primary buttons → rubric red instead of the default purple)
- Header/sidebar fonts (Cormorant italic for `h1`/`h2` only)

Form inputs / labels / borders / errors / contrast model: **untouched**.

### 2b · Drizzle's interactive prompt deadlock

When you change the schema (add/remove a field), Payload's dev-mode `pnpm dev` boot will run Drizzle's `push` workflow. If it sees ambiguous changes (e.g., a renamed field), it prompts interactively and **deadlocks any non-interactive process** (the seed script, `pnpm build`, CI).

**Pure additions are safe.** If you only ADD fields (which Phase A only does — `image` to hero, `image` to each pillar, `brand` group to settings), Drizzle creates the new columns silently. No prompt.

If for any reason a field disappears (rename without explicit drop), refer to memory file `project_runtime_gotchas.md` entry #8 — you'll need to drop the orphan column from the rels tables before booting.

### 2c · Tantum schema, not payload schema

App-level raw tables (`rate_limits`, `source_chunks`, `media_chunks`) live in the **`tantum`** schema, not `payload`. This is why `src/db/init-raw-tables.ts` exists. Don't change this — Payload's adapter scans only `payload.*`, and putting raw tables there breaks Drizzle push.

### 2d · Live preview already works — don't redo it

The pipeline is wired:
- `/next/preview` route handler enables `draftMode()` and redirects
- Each renderer (home, manifesto, credits, reading list, reading detail) reads `draftMode().isEnabled` and queries with `draft: true`
- `<LivePreviewListener>` from `@payloadcms/live-preview-react` mounts when in draft mode
- All four page-globals have `versions.drafts.autosave.interval = 375`
- Articles collection has the same autosave config

**Don't refactor any of this.** When you add new fields to globals, they're auto-included in the existing draft/preview flow.

### 2e · Tailwind v4 @theme tokens

Sacred palette is already in `src/app/(frontend)/globals.css`:
- `--color-vellum`, `--color-vellum-deep`, `--color-parchment`
- `--color-ink`, `--color-ink-soft`
- `--color-rubric`, `--color-rubric-deep`
- `--color-gilt`, `--color-incense`, `--color-lapis`
- `--shadow-altar`, `--shadow-relief`, `--radius-altar`

Use these classes (`text-rubric`, `bg-vellum-deep`, etc.). Don't introduce new colour tokens unless you really need to.

### 2f · Manifesto sequence component imports

Components live at `src/app/(frontend)/components/` (no underscore). The original plan source said `_components/`; that was wrong. Existing convention is `components/`.

---

## 3 · Phase A task list

Execute in order. Each task is committable on its own. The whole batch is suitable for one focused subagent run, OR two batches if you want a checkpoint after task 7.

### Task 1 · Add chi-rho brand SVG components

**Files to create:**
- `src/components/brand/chi-rho.tsx`
- `src/components/brand/wordmark.tsx`

#### `src/components/brand/chi-rho.tsx`

```tsx
// Reusable chi-rho monogram. Renders crisp at any size.
// `size` prop controls pixel dimensions; defaults to inheriting font-size via 1em.
import type { SVGProps } from 'react'

export function ChiRho({
  size = '1em',
  ...rest
}: SVGProps<SVGSVGElement> & { size?: string | number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Chi (X) */}
      <line x1="14" y1="14" x2="50" y2="50" />
      <line x1="50" y1="14" x2="14" y2="50" />
      {/* Rho (P): vertical stem + bowl on the upper right */}
      <line x1="32" y1="14" x2="32" y2="58" />
      <path d="M 32 14 Q 50 14 50 26 Q 50 38 32 38" fill="none" />
    </svg>
  )
}
```

#### `src/components/brand/wordmark.tsx`

```tsx
import { ChiRho } from './chi-rho'

export function Wordmark({
  className,
  showIcon = true,
}: {
  className?: string
  showIcon?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ''}`}>
      {showIcon ? (
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-ink text-vellum"
          style={{ boxShadow: 'var(--shadow-relief)' }}
        >
          <ChiRho size={18} />
        </span>
      ) : null}
      <span className="leading-tight">
        <span className="block font-display text-lg italic text-ink">Tantum Ergo</span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          Studio · ZA
        </span>
      </span>
    </span>
  )
}
```

#### Update `src/app/(frontend)/components/site-header.tsx`

Replace the existing `<Link href="/" className="flex items-center gap-3">…</Link>` block (the "TE" letterform circle + "Tantum Ergo" text) with:

```tsx
<Link href="/" className="block">
  <Wordmark />
</Link>
```

…and add the import: `import { Wordmark } from '@/components/brand/wordmark'`.

#### Commit

```bash
git add src/components/brand/ "src/app/(frontend)/components/site-header.tsx"
git commit -m "feat(brand): add ChiRho + Wordmark components, swap site header logo"
```

---

### Task 2 · Studio branding — Logo + Icon components

**Files to create:**
- `src/app/(payload)/components/StudioLogo.tsx`
- `src/app/(payload)/components/StudioIcon.tsx`

#### `src/app/(payload)/components/StudioLogo.tsx`

```tsx
import { ChiRho } from '@/components/brand/chi-rho'

export default function StudioLogo() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '4px 0',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#1a1410',
          color: '#fbf6ea',
        }}
      >
        <ChiRho size={16} />
      </span>
      <span
        style={{
          fontFamily:
            'Cormorant Garamond, ui-serif, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 22,
          letterSpacing: '-0.01em',
          color: '#1a1410',
        }}
      >
        Tantum Ergo
      </span>
    </div>
  )
}
```

#### `src/app/(payload)/components/StudioIcon.tsx`

```tsx
import { ChiRho } from '@/components/brand/chi-rho'

export default function StudioIcon() {
  return (
    <span
      aria-hidden
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#1a1410',
        color: '#fbf6ea',
      }}
    >
      <ChiRho size={14} />
    </span>
  )
}
```

#### Wire in `src/payload.config.ts`

Inside the `admin` block, add a `components.graphics` section:

```ts
admin: {
  user: Users.slug,
  importMap: { baseDir: path.resolve(dirname) },
  meta: {
    title: 'Tantum Ergo Studio',
    description: 'Editorial control room for the Tantum Ergo formation platform.',
    titleSuffix: ' — Tantum Ergo',
  },
  components: {
    graphics: {
      Logo: '/app/(payload)/components/StudioLogo',
      Icon: '/app/(payload)/components/StudioIcon',
    },
  },
  // (existing livePreview block, if any, stays as-is)
},
```

The string paths use Payload's import-map convention — they resolve relative to `src/`. (Payload 3 references components by string path; the `payload generate:importmap` command bakes them into `importMap.js`.)

#### Refresh import map

```bash
pnpm generate:importmap
pnpm typecheck
```

#### Commit

```bash
git add src/app/\(payload\)/components/ src/payload.config.ts "src/app/(payload)/admin/importMap.js"
git commit -m "feat(brand): wire custom Studio logo + icon (chi-rho + Cormorant wordmark)"
```

---

### Task 3 · Studio CSS — accent swap + brand strip

**File to modify:** `src/app/(payload)/custom.scss`

Replace the file's contents with:

```scss
/* Tantum Ergo studio overrides — keep minimal.
 * DO NOT override --theme-elevation-* tokens; doing so cracks input contrast.
 * Only safe-isolated brand bits and the accent color (rubric instead of purple). */

/* Accent swap: Payload's default purple → our rubric red */
:root {
  --theme-success-500: #8c2a2a;
  --theme-success-600: #5e1a1a;
  --theme-success-700: #4a1414;
}

/* Brand strip in the sidebar — gentle gilt accent rule under the logo */
.nav__header {
  position: relative;

  &::after {
    content: '';
    display: block;
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(176, 138, 62, 0.4) 50%,
      transparent 100%
    );
  }
}

/* Italic Cormorant on top-level admin headers */
.collection-list__header h1,
.global-edit__header h1,
.dashboard__header h1 {
  font-family: 'Cormorant Garamond', ui-serif, Georgia, serif;
  font-style: italic;
  letter-spacing: -0.01em;
}
```

#### Commit

```bash
git add "src/app/(payload)/custom.scss"
git commit -m "feat(brand): rubric-red accent swap + sidebar gilt rule + italic admin headers"
```

---

### Task 4 · Add `image` field to `HomePage.hero` and to each pillar

**File to modify:** `src/globals/HomePage.ts`

In the `Hero` tab, inside the `hero` group's `fields` array, append (after `ctaSecondaryHref`):

```ts
{
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  admin: {
    description:
      'Full-bleed background image for the hero section. Aspect 16:9 ideal. Mobile crops centre.',
  },
},
```

In the `Pillars` tab, inside each of `pillars.atlas`, `pillars.doctrine`, `pillars.catechist` groups, append after `href`:

```ts
{
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  admin: {
    description:
      'Background image for this pillar plate. Aspect 4:5 portrait.',
  },
},
```

#### Verify

```bash
pnpm generate:types
pnpm typecheck
```

#### Commit

```bash
git add src/globals/HomePage.ts src/payload-types.ts 2>/dev/null || git add src/globals/HomePage.ts
git commit -m "feat(home): add image fields to HomePage hero + each pillar plate"
```

(The `src/payload-types.ts` is gitignored — that's fine. It regenerates on demand.)

---

### Task 5 · Add `brand` group to `Settings` global

**File to modify:** `src/globals/Settings.ts`

After the `socials` array field, before `mapboxStyle`, insert:

```ts
{
  name: 'brand',
  type: 'group',
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional custom logo. If unset, the chi-rho + wordmark default renders.',
      },
    },
    {
      name: 'faviconLight',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'PNG, transparent background, 32×32 or 64×64.' },
    },
    {
      name: 'faviconDark',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'PNG, transparent background, for dark mode.' },
    },
  ],
},
```

#### Commit

```bash
git add src/globals/Settings.ts
git commit -m "feat(home): add brand group (logo, favicons) to Settings global"
```

---

### Task 6 · `GildedRule` component (chi-rho section divider)

**File to create:** `src/app/(frontend)/components/gilded-rule.tsx`

```tsx
import { ChiRho } from '@/components/brand/chi-rho'

// A thin horizontal gilt rule with a centered chi-rho ornament. Used between
// home page sections to give a manuscript-tradition rhythm.
export function GildedRule({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={`mx-auto flex w-full max-w-7xl items-center gap-4 px-5 sm:px-8 ${
        className ?? ''
      }`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gilt/50 to-transparent" />
      <ChiRho size={20} className="text-gilt" />
      <span className="h-px flex-1 bg-gradient-to-r from-gilt/50 via-gilt/50 to-transparent" />
    </div>
  )
}
```

#### Commit

```bash
git add "src/app/(frontend)/components/gilded-rule.tsx"
git commit -m "feat(home): add GildedRule chi-rho section divider"
```

---

### Task 7 · Drop cap component + restructured hero

**File to create:** `src/app/(frontend)/components/illuminated-drop-cap.tsx`

```tsx
// Illuminated drop cap — the first letter of a headline in gilt, set inside
// a small ornamental cartouche. Renders inline with the rest of the headline.
export function IlluminatedDropCap({ children }: { children: string }) {
  return (
    <span className="relative float-left mr-3 mt-1 inline-block">
      <span
        aria-hidden
        className="grid place-items-center rounded-md font-display text-[1.4em] italic leading-none"
        style={{
          width: '1.1em',
          height: '1.1em',
          color: '#fbf6ea',
          background:
            'linear-gradient(135deg, #b08a3e 0%, #9c7530 50%, #8c2a2a 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(140,42,42,0.25)',
        }}
      >
        {children}
      </span>
    </span>
  )
}
```

**File to modify:** `src/app/(frontend)/page.tsx`

Replace the entire file. The new shape: full-bleed image hero (with placeholder gradient when no image set), text overlaid, mobile-friendly. After the hero comes a GildedRule, then manifesto sequence, then GildedRule, then pillar plates, then GildedRule, then reading band.

```tsx
// src/app/(frontend)/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { draftMode } from 'next/headers'

import { GildedRule } from './components/gilded-rule'
import { IlluminatedDropCap } from './components/illuminated-drop-cap'
import { LivePreviewListener } from './components/live-preview-listener'
import { MagneticCTA } from './components/magnetic-cta'
import { ManifestoSequence } from './components/manifesto-sequence'
import { PillarPlate } from './components/pillar-plate'
import { RevealItem, SectionReveal } from './components/section-reveal'
import { payload } from '@/lib/payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type ImageDoc = { url?: string | null; alt?: string | null } | null | undefined

function imageURL(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { url?: string | null }
  return v.url ?? null
}

export default async function Home() {
  const { isEnabled: isDraft } = await draftMode()
  const p = await payload()
  const home = await p.findGlobal({ slug: 'home-page', draft: isDraft })

  const limit = home.readingBand?.limit ?? 6
  const articles = await p.find({
    collection: 'articles',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit,
    sort: '-publishedAt',
  })

  const hero = home.hero ?? {}
  const seq = home.manifestoSequence ?? {}
  const pillars = home.pillars ?? {}
  const reading = home.readingBand ?? {}

  const heroImageURL = imageURL(hero.image)
  const headline1 = hero.headlineLine1 ?? ''
  // Pull off the first letter of headline1 for the drop cap; keep the remainder.
  const dropCap = headline1.charAt(0).toUpperCase()
  const dropCapTail = headline1.slice(1)

  return (
    <main className="relative isolate">
      {/* Hero — full-bleed image with text overlay */}
      <section className="relative isolate overflow-hidden">
        {/* Background: image if present, otherwise atmospheric gradient placeholder */}
        <div className="absolute inset-0 -z-10">
          {heroImageURL ? (
            <Image
              src={heroImageURL}
              alt={(hero.image as ImageDoc)?.alt ?? ''}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(80% 60% at 70% 25%, rgba(176,138,62,0.45) 0%, transparent 60%), radial-gradient(70% 50% at 25% 80%, rgba(140,42,42,0.25) 0%, transparent 70%), linear-gradient(180deg, rgba(31,51,88,0.55), rgba(12,10,8,0.95))',
              }}
            />
          )}
          {/* Gradient veil — keeps text readable, dark in lower-left, fades upper-right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(115deg, rgba(12,10,8,0.85) 0%, rgba(12,10,8,0.55) 35%, rgba(12,10,8,0.15) 65%, rgba(12,10,8,0.0) 100%)',
            }}
          />
          {/* Bottom fade so reveal of next section is graceful */}
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{
              background:
                'linear-gradient(180deg, rgba(251,246,234,0) 0%, var(--color-vellum) 100%)',
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col justify-end px-5 pb-20 pt-32 sm:px-8 sm:pb-28 md:min-h-[92dvh] md:pb-40 md:pt-48">
          <SectionReveal className="max-w-3xl text-vellum">
            {hero.eyebrow ? (
              <RevealItem>
                <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-gilt">
                  {hero.eyebrow}
                </p>
              </RevealItem>
            ) : null}
            <RevealItem>
              <h1 className="mt-6 font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] tracking-tight text-vellum">
                {dropCap ? <IlluminatedDropCap>{dropCap}</IlluminatedDropCap> : null}
                {dropCapTail}
                <br />
                <em className="font-light italic text-gilt">{hero.headlineItalic}</em>{' '}
                {hero.headlineLine2 ? (
                  <span className="font-display">{hero.headlineLine2}</span>
                ) : null}
              </h1>
            </RevealItem>
            {hero.subheadline ? (
              <RevealItem>
                <p className="mt-8 max-w-[55ch] text-base leading-relaxed text-vellum/80 sm:text-lg">
                  {hero.subheadline}
                </p>
              </RevealItem>
            ) : null}
            <RevealItem>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                {hero.ctaPrimaryLabel && hero.ctaPrimaryHref ? (
                  <MagneticCTA href={hero.ctaPrimaryHref}>{hero.ctaPrimaryLabel}</MagneticCTA>
                ) : null}
                {hero.ctaSecondaryLabel && hero.ctaSecondaryHref ? (
                  <MagneticCTA href={hero.ctaSecondaryHref} intent="secondary">
                    {hero.ctaSecondaryLabel}
                  </MagneticCTA>
                ) : null}
              </div>
            </RevealItem>
          </SectionReveal>
        </div>
      </section>

      <GildedRule className="pt-12" />

      {/* Manifesto sequence (scroll-scrubbed) */}
      {seq.enabled && (seq.frames?.length ?? 0) > 0 ? (
        <ManifestoSequence frames={seq.frames as never} />
      ) : null}

      <GildedRule className="py-12" />

      {/* Three pillar plates */}
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 md:py-20">
        <SectionReveal className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <RevealItem className="md:col-span-12">
            {pillars.eyebrow ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
                {pillars.eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight text-ink md:text-6xl">
              {pillars.headlineLine1}{' '}
              <em className="italic text-rubric-deep">{pillars.headlineItalic}</em>
            </h2>
          </RevealItem>
          <RevealItem className="md:col-span-12">
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <PillarPlate
                index="I"
                name={pillars.atlas?.title ?? 'Atlas'}
                intent={pillars.atlas?.intent ?? ''}
                href={pillars.atlas?.href ?? '/atlas'}
                tone="rubric"
                imageURL={imageURL(pillars.atlas?.image)}
              />
              <PillarPlate
                index="II"
                name={pillars.doctrine?.title ?? 'Doctrine'}
                intent={pillars.doctrine?.intent ?? ''}
                href={pillars.doctrine?.href ?? '/doctrine'}
                tone="lapis"
                imageURL={imageURL(pillars.doctrine?.image)}
              />
              <PillarPlate
                index="III"
                name={pillars.catechist?.title ?? 'Catechist'}
                intent={pillars.catechist?.intent ?? ''}
                href={pillars.catechist?.href ?? '/catechist'}
                tone="gilt"
                imageURL={imageURL(pillars.catechist?.image)}
              />
            </div>
          </RevealItem>
        </SectionReveal>
      </section>

      <GildedRule className="py-12" />

      {/* Editorial primer band */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 md:pb-40">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            {reading.eyebrow ?? 'From the reading room'}
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
            {reading.emptyMessage ?? 'Reading room opens soon.'}
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

      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}
```

#### Commit

```bash
git add "src/app/(frontend)/components/illuminated-drop-cap.tsx" "src/app/(frontend)/page.tsx"
git commit -m "feat(home): full-bleed sacred-art hero + illuminated drop cap + GildedRule transitions"
```

---

### Task 8 · Update `PillarPlate` to accept and render image background

**File to modify:** `src/app/(frontend)/components/pillar-plate.tsx`

Read the existing file, then update the `Props` type to accept an optional `imageURL`, and render that image as the plate's background (with a dark vignette so text remains readable). When no image is set, fall back to the existing gradient.

The component is a client component (uses Framer Motion `useMotionValue`/`useSpring`/`useTransform` for the magnetic tilt). Keep all that intact. Just enhance the visual layer.

The complete new file:

```tsx
'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

const SPRING = { stiffness: 200, damping: 20, mass: 0.6 } as const

export function PillarPlate({
  index,
  name,
  intent,
  href,
  tone,
  imageURL,
}: {
  index: 'I' | 'II' | 'III'
  name: string
  intent: string
  href: string
  tone: 'rubric' | 'lapis' | 'gilt'
  imageURL?: string | null
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
        className={`group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-altar)] bg-gradient-to-br ${palette} ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-altar`}
      >
        {/* Background image (if set) sits behind everything */}
        {imageURL ? (
          <Image
            src={imageURL}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : null}

        {/* Vignette overlay — keeps text legible regardless of image */}
        <div
          className="absolute inset-0"
          style={{
            background: imageURL
              ? 'linear-gradient(180deg, rgba(12,10,8,0.05) 0%, rgba(12,10,8,0.55) 60%, rgba(12,10,8,0.85) 100%)'
              : 'transparent',
          }}
        />

        {/* Ornamental arched border — top */}
        <svg
          aria-hidden
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 h-3 w-full text-gilt"
        >
          <path d="M0 12 Q 50 0 100 12" fill="currentColor" opacity="0.4" />
        </svg>

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-6">
          <div>
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.28em] ${
                imageURL ? 'text-vellum/70' : 'text-ink-soft'
              }`}
            >
              Plate {index}
            </p>
            <h3
              className={`mt-3 font-display text-3xl italic md:text-4xl ${
                imageURL ? 'text-vellum' : 'text-ink'
              }`}
            >
              {name}
            </h3>
            <p
              className={`mt-3 max-w-[28ch] text-sm leading-relaxed ${
                imageURL ? 'text-vellum/80' : 'text-ink-soft'
              }`}
            >
              {intent}
            </p>
          </div>
          <span
            aria-hidden
            className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
              imageURL ? 'text-vellum' : 'text-ink'
            }`}
          >
            Enter
            <span className="inline-block h-px w-6 bg-current opacity-50 transition-all duration-300 group-hover:w-12 group-hover:opacity-100" />
          </span>
        </div>
      </Link>
    </motion.span>
  )
}
```

#### Commit

```bash
git add "src/app/(frontend)/components/pillar-plate.tsx"
git commit -m "feat(home): PillarPlate accepts image background; arched gilt top border"
```

---

### Task 9 · Bump grain + add chi-rho watermark

**File to modify:** `src/app/(frontend)/globals.css`

Find the `body::before` rule (the grain pseudo-element). Bump opacity from `0.04` to `0.07`.

Then find the body's `background:` declaration and replace it with one that layers a subtle chi-rho watermark on top:

```css
body {
  background:
    radial-gradient(80% 60% at 50% 0%, #fdf9ef 0%, transparent 60%),
    radial-gradient(60% 50% at 100% 100%, #f3e7c9 0%, transparent 70%),
    var(--color-vellum);
  background-attachment: fixed;
}

/* Faint chi-rho watermark, fixed to viewport so it doesn't repaint on scroll */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><g fill='none' stroke='%231a1410' stroke-width='8' stroke-linecap='round'><line x1='150' y1='150' x2='250' y2='250'/><line x1='250' y1='150' x2='150' y2='250'/><line x1='200' y1='150' x2='200' y2='280'/><path d='M 200 150 Q 260 150 260 190 Q 260 230 200 230' /></g></svg>");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 60vmin auto;
}
```

#### Commit

```bash
git add "src/app/(frontend)/globals.css"
git commit -m "feat(home): bump grain to 7%, add faint chi-rho watermark on body"
```

---

### Task 10 · Update seed script to publish the new fields with sensible defaults

**File to modify:** `src/scripts/seed-foundation.ts`

The seed currently doesn't populate `brand` (Settings) or `image` (HomePage hero/pillars). Pure additions are safe to leave unset (they default to null and the placeholders render).

If you want to seed brand defaults, add to the Settings updateGlobal call:

```ts
brand: {
  // logo + favicons left null — the chi-rho fallback renders.
},
```

For images, leave them null in seed. The user generates them via Gemini and uploads via studio.

**No commit needed unless you make the brand addition above.**

---

### Task 11 · Verify

```bash
pnpm typecheck
pnpm lint
pnpm seed:foundation
pnpm dev
```

In a separate terminal:

```bash
for path in / /reading /manifesto /credits /atlas; do
  printf "%-30s " "$path"
  curl -s -o /dev/null -w "HTTP %{http_code} | %{time_total}s\n" --max-time 60 "http://localhost:3000$path"
done
```

All should be 200. Then in a browser:

1. Open `<http://localhost:3000/>` — full-bleed gradient hero (placeholder until images upload), drop cap on first letter, gilt rules between sections, three pillar plates with arched gilt top border.
2. Mobile (DevTools 390×844): hero collapses to viewport height with image filling top, text overlay readable.
3. Open `<http://localhost:3000/admin>` — sidebar shows new chi-rho icon + "Tantum Ergo" wordmark in italic Cormorant. Save buttons should now be rubric red, not purple. Form inputs unchanged from before.

---

## 4 · Final commit + branch state

After all tasks land, verify:

```bash
git log --oneline -15
pnpm typecheck && pnpm lint && pnpm build
```

Build should succeed. ~10 new commits on top of `54c99f0`. Branch ready for the user to test and for Phase B (image uploads).

---

## 5 · What "done" looks like — user-visible checklist

| Surface | Before | After |
|---|---|---|
| Home hero | Asymmetric two-column with geometric oculus on right | Full-bleed atmospheric background (gradient placeholder, swaps to user's Gemini-generated image when uploaded), text overlaid lower-left, drop cap on first letter |
| Section transitions | Hard cuts between sections | Thin gilt rule with chi-rho ornament between every section |
| Pillar plates | Coloured-gradient cards | Image-capable plates with arched gilt top border; image takes background, text overlays with vignette |
| Backdrop texture | Grain at 4% (barely visible) | Grain at 7% + faint fixed chi-rho watermark |
| Site header logo | "TE" letterform circle | Chi-rho roundel + "Tantum Ergo" wordmark |
| Studio sidebar | Default Payload purple | Chi-rho roundel + Cormorant italic wordmark + gilt accent rule |
| Studio buttons | Purple | Rubric red |
| Studio inputs | Untouched (correct contrast) | Untouched (correct contrast) ← **this is the test that you didn't break things** |

---

## 6 · Image prompts for the user (reference — they have them already)

The user is generating these via Gemini in parallel. Listed here so you can drop them into a `docs/superpowers/handoffs/2026-05-04-image-prompts.md` if convenient, but the user doesn't need them again.

| File | Slot | Aspect |
|---|---|---|
| `hero-vault.jpg` | HomePage › Hero › Image | 16:9 |
| `seq-01-threshold.jpg` | HomePage › Manifesto Sequence › Frame 1 › Image | 16:9 |
| `seq-02-witness.jpg` | HomePage › Manifesto Sequence › Frame 2 › Image | 16:9 |
| `seq-03-page.jpg` | HomePage › Manifesto Sequence › Frame 3 › Image | 16:9 |
| `seq-04-voice.jpg` | HomePage › Manifesto Sequence › Frame 4 › Image | 16:9 |
| `pillar-atlas.jpg` | HomePage › Pillars › Atlas › Image | 4:5 |
| `pillar-doctrine.jpg` | HomePage › Pillars › Doctrine › Image | 4:5 |
| `pillar-catechist.jpg` | HomePage › Pillars › Catechist › Image | 4:5 |

Once uploaded, no code change is needed. Live preview catches the swap immediately.

---

## 7 · Closing note for the next session

The user explicitly requested the new session "just pick up." That's what this handoff is for. After you commit Task 11's verification, message the user with:

> Phase A done. Branch is at `<latest-sha>`. Test the home + studio yourselves (the user-visible checklist in §5 of the handoff is the rubric). Once your generated images are uploaded via studio, Phase B is automatic — no code change. When you're satisfied, say go and Plan 2 (Atlas pillar) is next.

You don't need to write Plan 2 yet — that's a separate spec/plan/execution cycle the user will trigger. But if you have spare context, you can stub out a one-paragraph Plan 2 outline as a heads-up.

Don't write or invoke `superpowers:writing-plans` for Plan 2 in this session unless explicitly asked.
