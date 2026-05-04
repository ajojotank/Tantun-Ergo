<div align="right">
  <sub><i>Genitori, Genitoque · laus et jubilatio</i></sub>
</div>

# Tantum Ergo

> **A digital Sistine Chapel for Catholic formation.**
> Three instruments, one reverent surface — a cartographic **Miracle Atlas**, a long-form **Doctrine LMS**, and a citation-bound **AI Catechist**. Mobile-first. Scroll-scrubbed. Built to last centuries.

[tantumergo.co.za](https://tantumergo.co.za) — under construction.

---

## Vision

Most Catholic web is informational. Tantum Ergo is **formational**. The product is a single, slow, image-led surface where:

- Approved miracles are placed on a **3D atlas** with sources, dates, and ecclesial status — scrubbable along the timeline of the Church.
- Doctrine is taught as a **paced syllabus** — councils, encyclicals, the Catechism — through video, audio, and reading paths with mastery checks.
- An **AI Catechist** answers questions only with retrieval-grounded citation from the magisterium. It cites; it never invents.

The aesthetic ceiling is the Sistine Chapel. The performance ceiling is a 3-year-old phone in a parish hall.

---

## Tech stack

| Layer            | Choice                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 16** (App Router, React 19, RSC-first)                                             |
| CMS              | **Payload CMS 3.84** running natively inside Next.js — admin at `/admin`, REST + GraphQL API |
| Database         | **Supabase Postgres** via `@payloadcms/db-postgres` (connection-pooled)                      |
| Styling          | **Tailwind CSS v4** with a sacred design token system (`vellum`, `rubric`, `gilt`, `lapis`)  |
| Type system      | **TypeScript** strict, Lexical rich text, auto-generated `payload-types.ts`                  |
| Motion           | **Framer Motion 12** — scroll-linked image sequences, magnetic CTAs, spring physics          |
| Image processing | **Sharp** (Payload's native pipeline)                                                        |

The Next.js App Router uses two route groups so the editorial studio and the public surface can each own their own root layout:

```
src/
├── app/
│   ├── (frontend)/       ← public Tantum Ergo surface
│   │   ├── layout.tsx    ← Cormorant Garamond + Geist, sacred palette
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── components/   ← isolated client leaves (scroll-rubric, magnetic-cta)
│   └── (payload)/        ← editorial studio
│       ├── layout.tsx    ← Payload's RootLayout
│       ├── custom.scss
│       ├── admin/[[...segments]]/   ← /admin
│       └── api/[...slug] · /graphql · /graphql-playground
├── collections/
│   ├── Users.ts          ← Stewards (admin · theologian · editor)
│   ├── Media.ts          ← Reliquary — focal-point uploads, four image sizes
│   └── Pages.ts          ← Drafts, autosave, scheduled publish, live preview
└── payload.config.ts     ← Postgres + Lexical + live preview breakpoints
```

---

## Local setup

> **Prerequisites:** Node ≥ 20.9, pnpm ≥ 10, and a Supabase project (free tier is fine).

### 1. Install

```bash
git clone https://github.com/<you>/tantum-ergo.git tantum-ergo
cd tantum-ergo/webapp
pnpm install
```

### 2. Configure Supabase

In your Supabase dashboard go to **Project Settings → Database → Connection string → URI (Connection pooler)** and copy the pooler URI. Then:

```bash
cp .env.example .env
```

Fill in the three required values:

```dotenv
DATABASE_URI=postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
PAYLOAD_SECRET=$(openssl rand -base64 48)   # paste the result
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

> The pooler URI is required because Payload runs serverlessly inside Next.js route handlers — direct connections will exhaust Supabase's connection pool. Append `?pgbouncer=true` for transaction-pooled writes.

### 3. Generate types and import map

```bash
pnpm generate:importmap   # registers Payload's admin component graph
pnpm generate:types       # writes src/payload-types.ts
```

### 4. Run

```bash
pnpm dev
```

| Surface                | URL                                       |
| ---------------------- | ----------------------------------------- |
| Public site            | <http://localhost:3000>                   |
| Editorial studio       | <http://localhost:3000/admin>             |
| REST API               | <http://localhost:3000/api>               |
| GraphQL playground     | <http://localhost:3000/api/graphql-playground> |

The first visit to `/admin` will prompt you to create the inaugural Steward (admin user).

### Live preview

The `Pages` collection ships with autosave (375 ms debounce), draft/publish workflow, scheduled publish, and live preview wired to `mobile · tablet · desktop` breakpoints. Open any page in the studio → Live Preview tab to see your edits compose against the production typography in real time.

---

## Scripts

| Command                    | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `pnpm dev`                 | Run Next.js + Payload locally                             |
| `pnpm devsafe`             | Same, but nukes `.next/` first (use after schema changes) |
| `pnpm build` / `pnpm start`| Production build + run                                    |
| `pnpm typecheck`           | `tsc --noEmit`                                            |
| `pnpm lint`                | ESLint                                                    |
| `pnpm generate:types`      | Regenerate `src/payload-types.ts` from the config         |
| `pnpm generate:importmap`  | Regenerate the Payload admin component import graph       |

---

## Roadmap

We ship v1.0 (the polished shell, ready for the content team) inside one focused week, then hand off content authoring. Spec: [`docs/superpowers/specs/2026-05-04-tantum-ergo-v1-design.md`](docs/superpowers/specs/2026-05-04-tantum-ergo-v1-design.md).

### Plan 1 · Foundation — **shipped (`feat/foundation`)**

Public marketing surface, mobile drawer, scroll-scrubbed manifesto sequence, `/reading` index + detail, `/manifesto`, `/credits`, three pillar coming-soon placeholders. All copy and imagery flow through the Payload studio (Settings + ManifestoSequence globals + Pages collection). Idempotent foundation seed populates a walkable site with `[Sample]`-marked filler. Plan: [`docs/superpowers/plans/2026-05-04-tantum-ergo-foundation.md`](docs/superpowers/plans/2026-05-04-tantum-ergo-foundation.md).

### Plan 2 · Atlas pillar — next

Mapbox GL JS globe with explore + pilgrimage modes, `Miracles` collection, scroll-scrubbed pilgrimage chapters, mobile catalogue fallback, Atlas filler seed.

### Plan 3 · Doctrine LMS pillar

`DoctrineTracks` / `DoctrineModules` / `DoctrineUnits` collections, breviary-style unit player with Read / Watch / Listen lanes, gentle mastery checks, `localStorage` progress, Doctrine filler seed.

### Plan 4 · Catechist pillar

`Sources` collection + ingestion job (PDF/DOCX → chunked + embedded with `gemini-embedding-2`, multimodal), `/api/catechist/ask` with structured-output citation guarantee (no path to render an answer without citations), epistolary spiritual-direction UI, per-IP rate limiting via the `tantum.rate_limits` table.

### Plan 5 · Storage + polish

`@payloadcms/storage-s3` pointed at Supabase Storage, lint / typecheck / build clean, accessibility self-test, perf budget verification (LCP < 2.5s on mid-range mobile).

After v1.0, the content team takes over: they author miracles in the Atlas, modules in Doctrine, and upload Magisterial sources for the Catechist to ingest.

---

## Conventions

- **Mobile-first.** Asymmetric desktop layouts collapse to single column below `md`.
- **No pure black.** `--color-ink` is `#1a1410`. Accents are limited to `rubric` (deep red) and `gilt` (muted ochre).
- **No emoji** in product surfaces — iconography only.
- **One root layout per route group.** The frontend owns `<html>`/`<body>`; the studio uses Payload's `RootLayout`.
- **Animation isolation.** Scroll-linked or perpetual motion lives in tiny `'use client'` leaves so the parent server tree never re-renders.

---

## License

Proprietary. © Tantum Ergo Studio. All rights reserved.
