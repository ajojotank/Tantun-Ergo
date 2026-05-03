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

### v0.2 — Miracle Atlas (Q3 2026)

- Mapbox GL JS globe with WebGL custom layers.
- A `Miracles` collection (location, date, type, source documents, ecclesial status).
- Scroll-linked timeline scrubber: drag through the centuries; the globe re-renders the witnesses living at each year.
- Image-sequence transitions for "approach" cinematics on each pinned miracle.

### v0.3 — Doctrine LMS (Q4 2026)

- `Tracks → Modules → Units` content model.
- Video (Mux), audio (homily-style narration), and reading lanes with synchronized progress.
- Mastery-check rubric per unit; spaced-repetition prompts.
- Offline-first reading via service worker for parish use without bandwidth.

### v0.4 — AI Catechist (Q1 2027)

- Retrieval over the Catechism, Vatican II texts, encyclicals (Latin + ZA-relevant translations).
- Citation-required answers — no claim ungrounded.
- Conversation memory bound to a Steward profile; exportable to spiritual director.

### v1.0 — Public launch (Easter 2027)

- WCAG 2.2 AA throughout, including reduced-motion variants of every scroll-scrubbed sequence.
- ZA-first hosting with edge caching across Africa.

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
