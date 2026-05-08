# Catechist v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a signed-in, citation-bound, graph-aware Catholic Catechist at `/catechist` in 3 days, per [docs/superpowers/specs/2026-05-08-catechist-design.md](../specs/2026-05-08-catechist-design.md).

**Architecture:** Members auth (Payload built-in, already configured) gates a multi-turn conversational surface. Ingestion job text-extracts → locator-aware chunks → embeds via `gemini-embedding-001` → parses citations (regex per format) → tags concepts (Gemini Flash). Retrieval does vector kNN → 1-hop citation expansion → re-rank by `similarity × authorityWeight × (1 + 0.3·conceptOverlap)` → top 8 → Gemini 2.5 Pro answers via Vercel AI SDK `streamUI` with four typed inline cards. Citation validation enforces refusal-by-default.

**Tech Stack:** Next 16 + Payload 3.84 + Postgres (Supabase, with pgvector) + Drizzle SQL (raw `tantum.*` tables) + `@google/genai` + `@ai-sdk/google` + Vercel AI SDK + Tailwind 4 + Framer Motion. pnpm.

> **Next 16 caveat (project-wide):** Per `AGENTS.md`, this Next is post-breaking-change. If you hit unfamiliar API shapes (Route Handlers, streaming Response, Server Actions, dynamic params), read `node_modules/next/dist/docs/01-app/` before guessing.

---

## File structure

```
src/
  collections/
    Sources.ts                                NEW — corpus document, ingest action
    Concepts.ts                               NEW — curated ontology
    CatechistConversations.ts                 NEW — per-Member multi-turn threads
  db/
    init-raw-tables.ts                        EXTEND — add 4 tantum tables, alter source_chunks
  catechist/
    embedding.ts                              NEW — Gemini embedding helper
    chunker.ts                                NEW — locator-aware chunkers (per format)
    citationParser.ts                         NEW — regex citation extractors
    textExtract.ts                            NEW — PDF/DOCX/TXT extraction
    conceptTagger.ts                          NEW — Gemini Flash classifier
    ingest.ts                                 NEW — orchestrates the pipeline
    retrieve.ts                               NEW — vector + graph + re-rank
    validate.ts                               NEW — citation validator
    prompt.ts                                 NEW — system prompt + context builder
    rateLimit.ts                              NEW — per-Member daily window
    tools.ts                                  NEW — Vercel AI SDK tool defs (4 cards)
    seed/
      concepts.ts                             NEW — 40-concept seed data
      welcomeConversation.ts                  NEW — first-sign-in seed
  app/
    (frontend)/
      sign-in/page.tsx                        NEW
      sign-in/forgot/page.tsx                 NEW
      sign-up/page.tsx                        NEW
      account/verify-email/page.tsx           NEW
      account/reset-password/page.tsx         NEW
      catechist/
        page.tsx                              REWRITE — was ComingSoon, now app shell
        layout.tsx                            NEW — sidebar + main pane
        c/[id]/page.tsx                       NEW — load conversation
        sources/page.tsx                      NEW — corpus browse
        sources/[slug]/page.tsx               NEW — one source + chunks
        components/
          sidebar.tsx                         NEW
          composer.tsx                        NEW
          conversation.tsx                    NEW
          message.tsx                         NEW
          footnotes.tsx                       NEW
          cards/
            scripture-card.tsx                NEW
            catechism-card.tsx                NEW
            source-preview-card.tsx           NEW
            citation-trace-card.tsx           NEW
          refusal.tsx                         NEW
    api/
      catechist/
        ask/route.ts                          NEW — streaming POST endpoint
        conversations/route.ts                NEW — GET list, POST create
        conversations/[id]/route.ts           NEW — GET, PATCH, DELETE
        sources/route.ts                      NEW — GET list
        sources/[slug]/route.ts               NEW — GET one
  payload.config.ts                           EXTEND — register 3 collections
src/
  scripts/
    seed-concepts.ts                          NEW — pnpm seed:concepts
    catechist-eval.ts                         NEW — pnpm catechist:eval
tests/
  catechist/
    citationParser.test.ts                    NEW
    chunker.test.ts                           NEW
    validate.test.ts                          NEW
    rerank.test.ts                            NEW
vitest.config.ts                              NEW
docs/superpowers/handoffs/
  catechist-eval-set.md                       NEW — 30 hand-authored questions
.env.example                                  EXTEND — note GOOGLE_AI_API_KEY required
package.json                                  EXTEND — deps + scripts
```

---

## Task 1: Add dependencies

**Files:**
- Modify: `package.json` (via `pnpm add`)

- [ ] **Step 1: Install runtime deps**

Run:
```bash
pnpm add ai @ai-sdk/google @ai-sdk/react @google/genai pdf-parse mammoth zod
```

Expected: packages added to `dependencies` in package.json. Note: `@ai-sdk/react` provides `useChat` for v4+; older v3 used `ai/react` — if you find code referencing `'ai/react'` later, swap to `'@ai-sdk/react'`.

- [ ] **Step 2: Install dev deps**

Run:
```bash
pnpm add -D vitest @types/pdf-parse
```

Expected: vitest + types in `devDependencies`.

- [ ] **Step 3: Add scripts to package.json**

Edit `package.json`. In the `scripts` block, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"seed:concepts": "tsx src/scripts/seed-concepts.ts",
"catechist:eval": "tsx src/scripts/catechist-eval.ts"
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(catechist): add ai/genai/pdf/mammoth/vitest deps + scripts"
```

---

## Task 2: Vitest config

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

Write `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
})
```

- [ ] **Step 2: Verify it runs**

Run: `pnpm test`
Expected: `No test files found, exiting with code 0` — confirms vitest picks up the config.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore(catechist): vitest config (node, tests/**/*.test.ts)"
```

---

## Task 3: Sources collection

**Files:**
- Create: `src/collections/Sources.ts`

- [ ] **Step 1: Write the collection**

Write `src/collections/Sources.ts`:
```ts
import type { CollectionConfig } from 'payload'

export const Sources: CollectionConfig = {
  slug: 'sources',
  labels: { singular: 'Source', plural: 'Sources' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authorityTier', 'ingestStatus', 'chunkCount', 'lastIngestedAt'],
    description: 'Catechist corpus documents. Upload a file, set fields, then click "Ingest" in the sidebar.',
    group: 'Catechist',
  },
  access: {
    read: () => true, // public — used by /catechist/sources browse
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users'),
    update: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users'),
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true,
      admin: { position: 'sidebar' } },
    { name: 'author', type: 'text' },
    { name: 'year', type: 'number' },
    {
      name: 'authorityTier',
      type: 'select',
      required: true,
      options: [
        { label: 'Scripture', value: 'scripture' },
        { label: 'Council', value: 'council' },
        { label: 'Catechism', value: 'catechism' },
        { label: 'Encyclical', value: 'encyclical' },
        { label: 'Father', value: 'father' },
        { label: 'Theologian', value: 'theologian' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'locatorFormat',
      type: 'select',
      required: true,
      options: [
        { label: 'Bible (book ch:v)', value: 'bible' },
        { label: 'CCC (§nnnn)', value: 'ccc' },
        { label: 'Roman Catechism (Part, Q.)', value: 'roman-catechism' },
        { label: 'Council canon (Sess., Can.)', value: 'council-canon' },
        { label: 'Encyclical section (§nn)', value: 'encyclical-section' },
        { label: 'Summa (Part, Q., a.)', value: 'summa' },
        { label: 'Father book/chapter', value: 'father-book-chapter' },
        { label: 'Generic 600-token chunks', value: 'generic' },
      ],
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
    { name: 'rightsNote', type: 'textarea',
      admin: { description: 'Surfaced on the Credits page. e.g. "Public domain (NPNF)", "Vatican English text, used with credit".' } },
    {
      name: 'ingestStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Ingesting', value: 'ingesting' },
        { label: 'Ingested', value: 'ingested' },
        { label: 'Error', value: 'error' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'chunkCount', type: 'number',
      admin: { readOnly: true, position: 'sidebar' } },
    { name: 'lastIngestedAt', type: 'date',
      admin: { readOnly: true, position: 'sidebar' } },
    { name: 'errorMessage', type: 'textarea',
      admin: { readOnly: true, condition: (data) => data?.ingestStatus === 'error' } },
    { name: '_isSample', type: 'checkbox',
      admin: { position: 'sidebar', description: 'Sample/filler doc — badged in studio + frontend.' } },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/collections/Sources.ts
git commit -m "feat(catechist): Sources collection (corpus documents + ingest fields)"
```

---

## Task 4: Concepts collection

**Files:**
- Create: `src/collections/Concepts.ts`

- [ ] **Step 1: Write the collection**

Write `src/collections/Concepts.ts`:
```ts
import type { CollectionConfig } from 'payload'

export const Concepts: CollectionConfig = {
  slug: 'concepts',
  labels: { singular: 'Concept', plural: 'Concepts' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'parent'],
    description: 'Curated Catholic ontology. Each chunk is tagged with 3-7 concepts at ingestion.',
    group: 'Catechist',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.collection === 'users'),
    update: ({ req }) => Boolean(req.user && req.user.collection === 'users'),
    delete: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users' && req.user.role === 'admin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'definition', type: 'textarea', required: true,
      admin: { description: 'One-paragraph definition; used in the Gemini Flash classification prompt.' } },
    { name: 'parent', type: 'relationship', relationTo: 'concepts',
      admin: { description: 'Optional taxonomy parent.' } },
    { name: 'synonyms', type: 'array',
      fields: [{ name: 'phrase', type: 'text', required: true }],
      admin: { description: 'Alternate phrasings used for matching, e.g. "transubstantiation" under Real Presence.' } },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Trinity / God', value: 'trinity-god' },
        { label: 'Christology', value: 'christology' },
        { label: 'Soteriology / Grace', value: 'soteriology' },
        { label: 'Sacraments', value: 'sacraments' },
        { label: 'Moral theology', value: 'moral' },
        { label: 'Ecclesiology', value: 'ecclesiology' },
        { label: 'Eschatology', value: 'eschatology' },
        { label: 'Mariology', value: 'mariology' },
        { label: 'Spirituality', value: 'spirituality' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/collections/Concepts.ts
git commit -m "feat(catechist): Concepts collection (curated ontology)"
```

---

## Task 5: CatechistConversations collection

**Files:**
- Create: `src/collections/CatechistConversations.ts`

- [ ] **Step 1: Write the collection**

Write `src/collections/CatechistConversations.ts`:
```ts
import type { CollectionConfig } from 'payload'

export const CatechistConversations: CollectionConfig = {
  slug: 'catechist-conversations',
  labels: { singular: 'Catechist Conversation', plural: 'Catechist Conversations' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'member', 'archived', 'updatedAt'],
    description: 'Per-Member multi-turn threads with the Catechist. Stewards can read for support; Members manage their own.',
    group: 'Catechist',
    hidden: ({ user }) => {
      if (!user) return true
      if (user.collection === 'users') return user.role !== 'admin'
      return true
    },
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { member: { equals: req.user.id } }
    },
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'members' && req.user._verified),
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { member: { equals: req.user.id } }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return req.user.role === 'admin'
      return { member: { equals: req.user.id } }
    },
  },
  fields: [
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'messages',
      type: 'array',
      fields: [
        { name: 'role', type: 'select', required: true,
          options: [{ label: 'User', value: 'user' }, { label: 'Assistant', value: 'assistant' }] },
        { name: 'content', type: 'textarea', required: true },
        { name: 'citations', type: 'json',
          admin: { description: 'Array<{ chunkId, locator, quotedSpan }>; assistant only.' } },
        { name: 'components', type: 'json',
          admin: { description: 'Serialized tool calls (scriptureCard etc.) for re-render; assistant only.' } },
        { name: 'createdAt', type: 'date', required: true },
      ],
    },
    { name: 'archived', type: 'checkbox', defaultValue: false, index: true,
      admin: { description: 'Soft-delete flag.' } },
  ],
  timestamps: true,
}
```

- [ ] **Step 2: Commit**

```bash
git add src/collections/CatechistConversations.ts
git commit -m "feat(catechist): CatechistConversations collection (per-Member threads)"
```

---

## Task 6: Wire collections into payload.config.ts

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Add imports**

In `src/payload.config.ts`, after the existing collection imports (around line 18), add:
```ts
import { Sources } from './collections/Sources'
import { Concepts } from './collections/Concepts'
import { CatechistConversations } from './collections/CatechistConversations'
```

- [ ] **Step 2: Add to collections array**

In the `collections: [...]` block, add the three new collections after `LmsProgress`:
```ts
  collections: [
    Users,
    Members,
    Media,
    Articles,
    Miracles,
    Pilgrimages,
    DoctrineCourses,
    LmsProgress,
    Sources,
    Concepts,
    CatechistConversations,
  ],
```

- [ ] **Step 3: Generate types**

Run: `pnpm generate:types`
Expected: `src/payload-types.ts` regenerates with Source, Concept, CatechistConversation types.

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/payload.config.ts src/payload-types.ts
git commit -m "feat(catechist): register Sources/Concepts/CatechistConversations in payload.config"
```

---

## Task 7: Extend init-raw-tables.ts (tantum.* schema)

**Files:**
- Modify: `src/db/init-raw-tables.ts`

- [ ] **Step 1: Replace the SQL block**

In `src/db/init-raw-tables.ts`, replace the `const SQL = ...` block with:
```ts
const SQL = /* sql */ `
CREATE SCHEMA IF NOT EXISTS tantum;
CREATE EXTENSION IF NOT EXISTS vector;

-- Existing per-IP rate_limits (kept for non-Catechist use)
CREATE TABLE IF NOT EXISTS tantum.rate_limits (
  id           bigserial PRIMARY KEY,
  bucket       text NOT NULL,
  ip_hash      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON tantum.rate_limits (bucket, ip_hash, created_at DESC);

-- Source chunks (extended with authority_tier denorm column for fast filter)
CREATE TABLE IF NOT EXISTS tantum.source_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     integer NOT NULL,
  chunk_index   integer NOT NULL,
  text          text NOT NULL,
  locator       text NOT NULL,
  page_number   integer,
  embedding     vector(1536) NOT NULL,
  authority_tier text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE tantum.source_chunks
  ADD COLUMN IF NOT EXISTS authority_tier text;
CREATE INDEX IF NOT EXISTS source_chunks_embedding_idx
  ON tantum.source_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS source_chunks_source_idx
  ON tantum.source_chunks (source_id);
CREATE INDEX IF NOT EXISTS source_chunks_authority_idx
  ON tantum.source_chunks (authority_tier);
CREATE INDEX IF NOT EXISTS source_chunks_locator_idx
  ON tantum.source_chunks (locator);

-- Citation graph edges
CREATE TABLE IF NOT EXISTS tantum.source_chunk_citations (
  id              bigserial PRIMARY KEY,
  from_chunk_id   uuid NOT NULL REFERENCES tantum.source_chunks(id) ON DELETE CASCADE,
  to_locator      text NOT NULL,
  to_chunk_id     uuid REFERENCES tantum.source_chunks(id) ON DELETE SET NULL,
  raw_text        text NOT NULL
);
CREATE INDEX IF NOT EXISTS source_chunk_citations_from_idx
  ON tantum.source_chunk_citations (from_chunk_id);
CREATE INDEX IF NOT EXISTS source_chunk_citations_to_chunk_idx
  ON tantum.source_chunk_citations (to_chunk_id);
CREATE INDEX IF NOT EXISTS source_chunk_citations_to_locator_idx
  ON tantum.source_chunk_citations (to_locator);

-- Concept tagging junction
CREATE TABLE IF NOT EXISTS tantum.source_chunk_concepts (
  chunk_id      uuid NOT NULL REFERENCES tantum.source_chunks(id) ON DELETE CASCADE,
  concept_id    integer NOT NULL,
  confidence    real NOT NULL,
  PRIMARY KEY (chunk_id, concept_id)
);
CREATE INDEX IF NOT EXISTS source_chunk_concepts_concept_idx
  ON tantum.source_chunk_concepts (concept_id);

-- Per-Member rate limit (Catechist)
CREATE TABLE IF NOT EXISTS tantum.catechist_rate_limits (
  id           bigserial PRIMARY KEY,
  member_id    integer NOT NULL,
  bucket       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catechist_rate_limits_lookup_idx
  ON tantum.catechist_rate_limits (member_id, bucket, created_at DESC);

-- Refusal log (observability)
CREATE TABLE IF NOT EXISTS tantum.catechist_refusals (
  id              bigserial PRIMARY KEY,
  member_id       integer,
  question        text NOT NULL,
  retrieval_top3  jsonb NOT NULL,
  reason          text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- (media_chunks kept for v1.1 multimodal artwork; left unchanged)
CREATE TABLE IF NOT EXISTS tantum.media_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id      integer NOT NULL,
  embedding     vector(1536) NOT NULL,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_chunks_embedding_idx
  ON tantum.media_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS media_chunks_media_idx
  ON tantum.media_chunks (media_id);
`
```

- [ ] **Step 2: Update the log line**

In the same file, replace the existing `payload.logger.info(...)` line at the end of `initRawTables` with:
```ts
  payload.logger.info('tantum schema ready: rate_limits, source_chunks (+citations/concepts), catechist_rate_limits, catechist_refusals, media_chunks (pgvector)')
```

- [ ] **Step 3: Verify by booting Payload**

Run: `pnpm dev` (kill after a few seconds). Look for the log line. Then in psql or Supabase SQL editor:
```sql
\dt tantum.*
```
Expected: 7 tables (rate_limits, source_chunks, source_chunk_citations, source_chunk_concepts, catechist_rate_limits, catechist_refusals, media_chunks).

- [ ] **Step 4: Commit**

```bash
git add src/db/init-raw-tables.ts
git commit -m "feat(catechist): extend tantum schema with citations, concepts, refusals, per-member rate"
```

---

## Task 8: Citation parser (TDD — pure logic)

**Files:**
- Create: `src/catechist/citationParser.ts`
- Test: `tests/catechist/citationParser.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/catechist/citationParser.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseCitations } from '../../src/catechist/citationParser'

describe('parseCitations', () => {
  it('parses Bible references', () => {
    const out = parseCitations('See John 6:53 and 1 Cor 11:23-26 for context.')
    expect(out).toEqual([
      { canonical: 'John 6:53', raw: 'John 6:53' },
      { canonical: '1 Cor 11:23', raw: '1 Cor 11:23-26' },
    ])
  })

  it('parses CCC paragraphs', () => {
    const out = parseCitations('Per CCC §1374 and Catechism 1376.')
    expect(out).toEqual([
      { canonical: 'CCC §1374', raw: 'CCC §1374' },
      { canonical: 'CCC §1376', raw: 'Catechism 1376' },
    ])
  })

  it('parses Trent canons', () => {
    const out = parseCitations('Cf. Trent, Sess. XIII, Can. 1.')
    expect(out).toEqual([
      { canonical: 'Trent, Sess. XIII, Can. 1', raw: 'Trent, Sess. XIII, Can. 1' },
    ])
  })

  it('parses encyclical sections', () => {
    const out = parseCitations('Veritatis Splendor §54 explains; Humanae Vitae § 11 also.')
    expect(out).toEqual([
      { canonical: 'Veritatis Splendor §54', raw: 'Veritatis Splendor §54' },
      { canonical: 'Humanae Vitae §11', raw: 'Humanae Vitae § 11' },
    ])
  })

  it('parses Summa articles', () => {
    const out = parseCitations('Summa I, Q. 32, a. 1; also Summa III, Q. 75, a. 4.')
    expect(out).toEqual([
      { canonical: 'Summa I, Q. 32, a. 1', raw: 'Summa I, Q. 32, a. 1' },
      { canonical: 'Summa III, Q. 75, a. 4', raw: 'Summa III, Q. 75, a. 4' },
    ])
  })

  it('parses Roman Catechism refs', () => {
    const out = parseCitations('Roman Catechism, Part II, Q. 7 says...')
    expect(out).toEqual([
      { canonical: 'Roman Catechism, Part II, Q. 7', raw: 'Roman Catechism, Part II, Q. 7' },
    ])
  })

  it('returns empty for text with no citations', () => {
    expect(parseCitations('Plain text with no references.')).toEqual([])
  })

  it('does not duplicate when the same ref appears twice', () => {
    const out = parseCitations('John 6:53 and again John 6:53 later.')
    expect(out).toHaveLength(1)
    expect(out[0].canonical).toBe('John 6:53')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/catechist/citationParser.test.ts`
Expected: FAIL — `Cannot find module '../../src/catechist/citationParser'`.

- [ ] **Step 3: Implement the parser**

Write `src/catechist/citationParser.ts`:
```ts
export interface ParsedCitation {
  canonical: string
  raw: string
}

const BIBLE_BOOKS = [
  'Genesis','Gen','Exodus','Exod','Leviticus','Lev','Numbers','Num','Deuteronomy','Deut',
  'Joshua','Josh','Judges','Judg','Ruth','1 Samuel','1 Sam','2 Samuel','2 Sam',
  '1 Kings','2 Kings','1 Chronicles','1 Chr','2 Chronicles','2 Chr','Ezra','Nehemiah','Neh',
  'Tobit','Tob','Judith','Jdt','Esther','Esth','1 Maccabees','1 Macc','2 Maccabees','2 Macc',
  'Job','Psalms','Psalm','Ps','Proverbs','Prov','Ecclesiastes','Eccl','Song of Songs','Song',
  'Wisdom','Wis','Sirach','Sir','Isaiah','Isa','Jeremiah','Jer','Lamentations','Lam',
  'Baruch','Bar','Ezekiel','Ezek','Daniel','Dan','Hosea','Hos','Joel','Amos','Obadiah','Obad',
  'Jonah','Micah','Mic','Nahum','Nah','Habakkuk','Hab','Zephaniah','Zeph','Haggai','Hag',
  'Zechariah','Zech','Malachi','Mal',
  'Matthew','Matt','Mark','Mk','Luke','Lk','John','Jn','Acts',
  'Romans','Rom','1 Corinthians','1 Cor','2 Corinthians','2 Cor','Galatians','Gal',
  'Ephesians','Eph','Philippians','Phil','Colossians','Col',
  '1 Thessalonians','1 Thess','2 Thessalonians','2 Thess',
  '1 Timothy','1 Tim','2 Timothy','2 Tim','Titus','Philemon','Phlm',
  'Hebrews','Heb','James','Jas','1 Peter','1 Pet','2 Peter','2 Pet',
  '1 John','2 John','3 John','Jude','Revelation','Rev',
]

const ENCYCLICAL_NAMES = [
  'Humanae Vitae','Veritatis Splendor','Fides et Ratio','Deus Caritas Est','Lumen Fidei',
  'Lumen Gentium','Dei Verbum','Sacrosanctum Concilium','Gaudium et Spes',
  'Dignitatis Humanae','Unitatis Redintegratio','Nostra Aetate','Ad Gentes',
  'Apostolicam Actuositatem','Optatam Totius','Perfectae Caritatis','Christus Dominus',
  'Presbyterorum Ordinis','Inter Mirifica','Orientalium Ecclesiarum','Gravissimum Educationis',
]

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const BIBLE_RE = new RegExp(
  String.raw`\b(?<book>${BIBLE_BOOKS.map(escapeRe).join('|')})\.?\s+(?<ch>\d+):(?<v>\d+)(?:[–-](?<v2>\d+))?\b`,
  'g',
)
const CCC_RE = /\b(?:CCC|Catechism)\s*§?\s*(?<para>\d{1,4})\b/g
const TRENT_RE = /\bTrent,?\s*Sess(?:ion)?\.?\s+(?<sess>[IVX]+),?\s*Can(?:on)?\.?\s+(?<canon>\d+)\b/g
const ENC_RE = new RegExp(
  String.raw`\b(?<doc>${ENCYCLICAL_NAMES.map(escapeRe).join('|')})\s*§\s*(?<sec>\d{1,3})\b`,
  'g',
)
const SUMMA_RE = /\bSumma,?\s+(?<part>I{1,3}(?:-II)?),?\s*Q\.?\s*(?<q>\d+),?\s*a\.?\s*(?<art>\d+)\b/g
const ROMAN_CAT_RE = /\bRoman Catechism,?\s+Part\s+(?<part>[IVX]+),?\s+Q\.?\s+(?<q>\d+)\b/g

export function parseCitations(text: string): ParsedCitation[] {
  const out: ParsedCitation[] = []
  const seen = new Set<string>()

  const push = (canonical: string, raw: string) => {
    if (seen.has(canonical)) return
    seen.add(canonical)
    out.push({ canonical, raw })
  }

  for (const m of text.matchAll(BIBLE_RE)) {
    const { book, ch, v } = m.groups!
    push(`${book} ${ch}:${v}`, m[0])
  }
  for (const m of text.matchAll(CCC_RE)) {
    push(`CCC §${m.groups!.para}`, m[0])
  }
  for (const m of text.matchAll(TRENT_RE)) {
    const { sess, canon } = m.groups!
    push(`Trent, Sess. ${sess}, Can. ${canon}`, m[0])
  }
  for (const m of text.matchAll(ENC_RE)) {
    const { doc, sec } = m.groups!
    push(`${doc} §${sec}`, m[0])
  }
  for (const m of text.matchAll(SUMMA_RE)) {
    const { part, q, art } = m.groups!
    push(`Summa ${part}, Q. ${q}, a. ${art}`, m[0])
  }
  for (const m of text.matchAll(ROMAN_CAT_RE)) {
    const { part, q } = m.groups!
    push(`Roman Catechism, Part ${part}, Q. ${q}`, m[0])
  }

  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/catechist/citationParser.test.ts`
Expected: PASS — all 8 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/catechist/citationParser.ts tests/catechist/citationParser.test.ts
git commit -m "feat(catechist): citation parser (Bible/CCC/Trent/encyclical/Summa/Roman) + tests"
```

---

## Task 9: Locator-aware chunker (TDD)

**Files:**
- Create: `src/catechist/chunker.ts`
- Test: `tests/catechist/chunker.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/catechist/chunker.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { chunkText, type LocatorFormat } from '../../src/catechist/chunker'

describe('chunkText', () => {
  it('chunks the Bible verse-by-verse with locators', () => {
    const text = `John 6:53 Then Jesus said to them: Amen, amen I say unto you...
John 6:54 He that eateth my flesh, and drinketh my blood, hath everlasting life...`
    const out = chunkText(text, 'bible', { sourceTitle: 'Douay-Rheims' })
    expect(out).toHaveLength(2)
    expect(out[0].locator).toBe('John 6:53')
    expect(out[1].locator).toBe('John 6:54')
    expect(out[0].text).toContain('Then Jesus said')
  })

  it('chunks CCC paragraph-by-paragraph', () => {
    const text = `1373 "Christ Jesus, who died, yes, who was raised from the dead..."
1374 The mode of Christ's presence under the Eucharistic species is unique...`
    const out = chunkText(text, 'ccc', { sourceTitle: 'CCC' })
    expect(out).toHaveLength(2)
    expect(out[0].locator).toBe('CCC §1373')
    expect(out[1].locator).toBe('CCC §1374')
  })

  it('chunks Summa article-by-article', () => {
    const text = `Question 32. The knowledge of the divine persons
Article 1. Whether the trinity of the divine persons can be known by natural reason?
I answer that, It is impossible to attain the knowledge of the Trinity by natural reason...
Article 2. Whether there are notional acts in God?
I answer that...`
    const out = chunkText(text, 'summa', { sourceTitle: 'Summa I' })
    expect(out.length).toBeGreaterThanOrEqual(2)
    expect(out[0].locator).toMatch(/Summa I, Q\. 32, a\. 1/)
    expect(out[1].locator).toMatch(/Summa I, Q\. 32, a\. 2/)
  })

  it('chunks generic text into ~600-token blocks', () => {
    const para = 'word '.repeat(800)
    const out = chunkText(para, 'generic', { sourceTitle: 'Generic Doc' })
    expect(out.length).toBeGreaterThanOrEqual(1)
    out.forEach((c, i) => {
      expect(c.locator).toBe(`Generic Doc, chunk ${i + 1}`)
      expect(c.text.length).toBeGreaterThan(0)
    })
  })

  it('returns chunk_index in order', () => {
    const text = `John 1:1 In the beginning was the Word.
John 1:2 The same was in the beginning with God.`
    const out = chunkText(text, 'bible', { sourceTitle: 'Douay-Rheims' })
    expect(out.map((c) => c.chunkIndex)).toEqual([0, 1])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/catechist/chunker.test.ts`
Expected: FAIL — `Cannot find module '../../src/catechist/chunker'`.

- [ ] **Step 3: Implement the chunker**

Write `src/catechist/chunker.ts`:
```ts
export type LocatorFormat =
  | 'bible' | 'ccc' | 'roman-catechism' | 'council-canon'
  | 'encyclical-section' | 'summa' | 'father-book-chapter' | 'generic'

export interface Chunk {
  text: string
  locator: string
  chunkIndex: number
  pageNumber?: number
}

export interface ChunkerOptions {
  sourceTitle: string
}

const APPROX_TOKEN_CHARS = 4 // rough char/token ratio
const TARGET_TOKENS = 600
const TARGET_CHARS = TARGET_TOKENS * APPROX_TOKEN_CHARS

function chunkBible(text: string): Array<{ locator: string; text: string }> {
  const verseRe = /\b([1-3]?\s?[A-Z][a-z]+)\s+(\d+):(\d+)\s+([\s\S]*?)(?=(?:\b[1-3]?\s?[A-Z][a-z]+\s+\d+:\d+\s)|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(verseRe)) {
    const [, book, ch, v, body] = m
    out.push({
      locator: `${book.trim()} ${ch}:${v}`,
      text: `${book.trim()} ${ch}:${v} ${body.trim()}`,
    })
  }
  return out
}

function chunkCCC(text: string): Array<{ locator: string; text: string }> {
  const paraRe = /^\s*(\d{1,4})\s+([\s\S]*?)(?=^\s*\d{1,4}\s+|$)/gm
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(paraRe)) {
    const [, num, body] = m
    out.push({ locator: `CCC §${num}`, text: body.trim() })
  }
  return out
}

function chunkRomanCatechism(text: string): Array<{ locator: string; text: string }> {
  const re = /Part\s+([IVX]+).*?Q(?:uestion)?\.?\s+(\d+)\.?\s+([\s\S]*?)(?=Part\s+[IVX]+.*?Q(?:uestion)?\.?\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, part, q, body] = m
    out.push({ locator: `Roman Catechism, Part ${part}, Q. ${q}`, text: body.trim() })
  }
  return out
}

function chunkCouncilCanon(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /Sess(?:ion)?\.?\s+([IVX]+).*?Can(?:on)?\.?\s+(\d+)\.?\s+([\s\S]*?)(?=Sess(?:ion)?\.?\s+[IVX]+|Can(?:on)?\.?\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, sess, canon, body] = m
    out.push({ locator: `${title}, Sess. ${sess}, Can. ${canon}`, text: body.trim() })
  }
  return out
}

function chunkEncyclicalSection(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /(?:^|\n)\s*(\d{1,3})\.\s+([\s\S]*?)(?=\n\s*\d{1,3}\.\s+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, sec, body] = m
    out.push({ locator: `${title} §${sec}`, text: body.trim() })
  }
  return out
}

function chunkSumma(text: string, partGuess: string): Array<{ locator: string; text: string }> {
  // partGuess is from the source title, e.g. "Summa I" or "Summa III"
  const part = partGuess.match(/I{1,3}(?:-II)?/)?.[0] ?? 'I'
  const re = /Question\s+(\d+)\..*?Article\s+(\d+)\.\s+([\s\S]*?)(?=Article\s+\d+\.|Question\s+\d+\.|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, q, a, body] = m
    out.push({ locator: `Summa ${part}, Q. ${q}, a. ${a}`, text: body.trim() })
  }
  return out
}

function chunkFatherBookChapter(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /Book\s+([IVX]+),?\s+Chapter\s+(\d+)\.?\s+([\s\S]*?)(?=Book\s+[IVX]+|Chapter\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, book, ch, body] = m
    out.push({ locator: `${title}, Book ${book}, Ch. ${ch}`, text: body.trim() })
  }
  if (out.length === 0) return chunkGeneric(text, title)
  return out
}

function chunkGeneric(text: string, title: string): Array<{ locator: string; text: string }> {
  const out: Array<{ locator: string; text: string }> = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let buf = ''
  let n = 0
  for (const s of sentences) {
    if (buf.length + s.length > TARGET_CHARS && buf.length > 0) {
      n += 1
      out.push({ locator: `${title}, chunk ${n}`, text: buf.trim() })
      buf = ''
    }
    buf += (buf ? ' ' : '') + s
  }
  if (buf.trim()) {
    n += 1
    out.push({ locator: `${title}, chunk ${n}`, text: buf.trim() })
  }
  return out
}

export function chunkText(
  text: string,
  format: LocatorFormat,
  opts: ChunkerOptions,
): Chunk[] {
  const dispatch: Record<LocatorFormat, () => Array<{ locator: string; text: string }>> = {
    bible: () => chunkBible(text),
    ccc: () => chunkCCC(text),
    'roman-catechism': () => chunkRomanCatechism(text),
    'council-canon': () => chunkCouncilCanon(text, opts.sourceTitle),
    'encyclical-section': () => chunkEncyclicalSection(text, opts.sourceTitle),
    summa: () => chunkSumma(text, opts.sourceTitle),
    'father-book-chapter': () => chunkFatherBookChapter(text, opts.sourceTitle),
    generic: () => chunkGeneric(text, opts.sourceTitle),
  }
  const raw = dispatch[format]()
  return raw.map((c, i) => ({ ...c, chunkIndex: i }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/catechist/chunker.test.ts`
Expected: PASS — all 5 tests green. (If a regex tweak is needed for one of the formats, adjust until green.)

- [ ] **Step 5: Commit**

```bash
git add src/catechist/chunker.ts tests/catechist/chunker.test.ts
git commit -m "feat(catechist): locator-aware chunker (Bible/CCC/Summa/encyclical/...) + tests"
```

---

## Task 10: Embedding helper (Gemini)

**Files:**
- Create: `src/catechist/embedding.ts`

- [ ] **Step 1: Write the helper**

Write `src/catechist/embedding.ts`:
```ts
import 'server-only'
import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY
if (!apiKey) {
  // Don't throw at import — this lets `pnpm build` succeed in environments without the key.
  // The runtime call will throw if we actually try to embed.
}

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!_client) {
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

const MODEL = 'gemini-embedding-001'
const DIMS = 1536

export type EmbedTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'

export async function embed(texts: string[], taskType: EmbedTask): Promise<number[][]> {
  if (texts.length === 0) return []
  const result = await client().models.embedContent({
    model: MODEL,
    contents: texts.map((t) => ({ parts: [{ text: t }] })),
    config: { outputDimensionality: DIMS, taskType },
  })
  // result.embeddings is an array of { values: number[] }
  const embeddings = (result as unknown as { embeddings: Array<{ values: number[] }> }).embeddings
  return embeddings.map((e) => e.values)
}

export async function embedOne(text: string, taskType: EmbedTask): Promise<number[]> {
  const [v] = await embed([text], taskType)
  return v
}

export const EMBED_DIMS = DIMS
```

> Note: the `@google/genai` SDK's exact embedding API may differ slightly between versions. If `embedContent` rejects the shape above, check `node_modules/@google/genai/dist/` for the current signature; the v1 SDK accepts `{ model, contents, config: { outputDimensionality, taskType } }`. Adjust the call shape, NOT the function signature.

- [ ] **Step 2: Smoke check (manual, optional)**

Make sure `GOOGLE_AI_API_KEY` is in `.env`. Then in a scratch script:
```bash
pnpm tsx -e "import('./src/catechist/embedding.ts').then(m => m.embedOne('hello world','RETRIEVAL_QUERY')).then(v => console.log(v.length, v.slice(0,3)))"
```
Expected: prints `1536` and three small floats.

- [ ] **Step 3: Commit**

```bash
git add src/catechist/embedding.ts
git commit -m "feat(catechist): Gemini embedding helper (gemini-embedding-001 @ 1536d)"
```

---

## Task 11: Concept tagger (Gemini Flash classifier)

**Files:**
- Create: `src/catechist/conceptTagger.ts`

- [ ] **Step 1: Write the helper**

Write `src/catechist/conceptTagger.ts`:
```ts
import 'server-only'
import { GoogleGenAI, Type } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY
let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!_client) {
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

const MODEL = 'gemini-2.5-flash'

export interface ConceptDef {
  id: number
  name: string
  definition: string
  synonyms: string[]
}

export interface TaggedChunk {
  chunkId: string
  conceptIds: number[]
  confidences: number[]
}

export async function tagChunks(
  chunks: Array<{ id: string; text: string }>,
  concepts: ConceptDef[],
): Promise<TaggedChunk[]> {
  if (chunks.length === 0) return []
  const conceptList = concepts
    .map((c) => `${c.id}: ${c.name} — ${c.definition}${c.synonyms.length ? ' (also: ' + c.synonyms.join(', ') + ')' : ''}`)
    .join('\n')

  const systemPrompt = `You are a Catholic doctrinal classifier. Given a passage, identify which concepts from the list it discusses.

CONCEPT LIST:
${conceptList}

For each input passage, return up to 7 concept IDs that the passage substantively discusses, with a confidence (0-1) for each. Skip concepts that are merely mentioned in passing. If no concept clearly applies, return empty arrays.`

  const userMessage = chunks.map((c, i) => `[${i}] ${c.text}`).join('\n\n---\n\n')

  const result = await client().models.generateContent({
    model: MODEL,
    contents: [{ parts: [{ text: userMessage }] }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagged: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.NUMBER },
                conceptIds: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                confidences: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              },
              required: ['index', 'conceptIds', 'confidences'],
            },
          },
        },
        required: ['tagged'],
      },
      temperature: 0.1,
    },
  })

  const text = (result as unknown as { text: string }).text
  const parsed = JSON.parse(text) as {
    tagged: Array<{ index: number; conceptIds: number[]; confidences: number[] }>
  }

  return parsed.tagged.map((t) => ({
    chunkId: chunks[t.index].id,
    conceptIds: t.conceptIds,
    confidences: t.confidences,
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/catechist/conceptTagger.ts
git commit -m "feat(catechist): Gemini Flash concept tagger (structured-output classifier)"
```

---

## Task 12: Text extractor (PDF/DOCX/TXT)

**Files:**
- Create: `src/catechist/textExtract.ts`

- [ ] **Step 1: Write the helper**

Write `src/catechist/textExtract.ts`:
```ts
import 'server-only'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export type ExtractFormat = 'pdf' | 'docx' | 'txt'

export interface ExtractResult {
  text: string
  pageCount?: number
}

export function detectFormat(filename: string): ExtractFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'txt'
  throw new Error(`Unsupported file type: ${filename} (supported: .pdf, .docx, .txt, .md)`)
}

export async function extractText(buf: Buffer, format: ExtractFormat): Promise<ExtractResult> {
  if (format === 'pdf') {
    const out = await pdfParse(buf)
    return { text: out.text, pageCount: out.numpages }
  }
  if (format === 'docx') {
    const out = await mammoth.extractRawText({ buffer: buf })
    return { text: out.value }
  }
  return { text: buf.toString('utf-8') }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/catechist/textExtract.ts
git commit -m "feat(catechist): text extractor (PDF/DOCX/TXT)"
```

---

## Task 13: Ingestion orchestrator + Sources afterChange hook

**Files:**
- Create: `src/catechist/ingest.ts`
- Modify: `src/collections/Sources.ts` (add `hooks.afterChange`)

- [ ] **Step 1: Write the orchestrator**

Write `src/catechist/ingest.ts`:
```ts
import 'server-only'
import type { Payload } from 'payload'
import { detectFormat, extractText } from './textExtract'
import { chunkText, type LocatorFormat } from './chunker'
import { embed } from './embedding'
import { parseCitations } from './citationParser'
import { tagChunks, type ConceptDef } from './conceptTagger'

const EMBED_BATCH = 100
const TAG_BATCH = 50

interface InsertedChunk {
  id: string
  text: string
  locator: string
}

async function rawDb(payload: Payload): Promise<{ execute: (q: { sql: string; params?: unknown[] }) => Promise<unknown>; query: (q: { sql: string; params?: unknown[] }) => Promise<{ rows: Array<Record<string, unknown>> }> }> {
  // payload.db.drizzle is the Drizzle instance; use its underlying pg client for raw parameterized queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = payload.db as any
  return {
    execute: async ({ sql, params }) => adapter.pool.query(sql, params ?? []),
    query: async ({ sql, params }) => adapter.pool.query(sql, params ?? []),
  }
}

export async function ingestSource(payload: Payload, sourceId: number): Promise<void> {
  const source = await payload.findByID({ collection: 'sources', id: sourceId })
  if (!source.file) throw new Error(`Source ${sourceId} has no file`)

  await payload.update({
    collection: 'sources',
    id: sourceId,
    data: { ingestStatus: 'ingesting', errorMessage: null },
  })

  const db = await rawDb(payload)

  try {
    // 1. Download file
    const mediaId = typeof source.file === 'object' ? source.file.id : source.file
    const media = await payload.findByID({ collection: 'media', id: mediaId as number })
    const fileUrl = media.url
    if (!fileUrl) throw new Error('Media has no URL')

    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error(`Failed to download file: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())

    // 2. Extract
    const format = detectFormat(media.filename ?? 'unknown')
    const { text } = await extractText(buf, format)

    // 3. Chunk
    const chunks = chunkText(text, source.locatorFormat as LocatorFormat, {
      sourceTitle: source.title,
    })
    if (chunks.length === 0) throw new Error('Chunker returned 0 chunks')

    // 4. Embed (batched)
    const allEmbeddings: number[][] = []
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const vecs = await embed(batch.map((c) => c.text), 'RETRIEVAL_DOCUMENT')
      allEmbeddings.push(...vecs)
      payload.logger.info(`[ingest:${sourceId}] embedded ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}`)
    }

    // 5. Insert chunks (one big batch — pgvector accepts vector literal as text array)
    //    We do this row-by-row to keep the SQL trivial; fast enough at 5k scale.
    const inserted: InsertedChunk[] = []
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      const vec = `[${allEmbeddings[i].join(',')}]`
      const r = await db.query({
        sql: `INSERT INTO tantum.source_chunks (source_id, chunk_index, text, locator, page_number, embedding, authority_tier)
              VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
              RETURNING id, text, locator`,
        params: [sourceId, c.chunkIndex, c.text, c.locator, c.pageNumber ?? null, vec, source.authorityTier],
      })
      const row = r.rows[0]
      inserted.push({ id: row.id as string, text: row.text as string, locator: row.locator as string })
    }
    payload.logger.info(`[ingest:${sourceId}] inserted ${inserted.length} chunks`)

    // 6. Citation parsing
    for (const c of inserted) {
      const cites = parseCitations(c.text)
      for (const cite of cites) {
        await db.execute({
          sql: `INSERT INTO tantum.source_chunk_citations (from_chunk_id, to_locator, raw_text)
                VALUES ($1, $2, $3)`,
          params: [c.id, cite.canonical, cite.raw],
        })
      }
    }

    // 7. Concept tagging (batched)
    const concepts = await payload.find({ collection: 'concepts', limit: 200 })
    const conceptDefs: ConceptDef[] = concepts.docs.map((c) => ({
      id: c.id as number,
      name: c.name,
      definition: c.definition,
      synonyms: (c.synonyms ?? []).map((s) => s.phrase),
    }))

    if (conceptDefs.length > 0) {
      for (let i = 0; i < inserted.length; i += TAG_BATCH) {
        const batch = inserted.slice(i, i + TAG_BATCH)
        const tagged = await tagChunks(batch, conceptDefs)
        for (const t of tagged) {
          for (let k = 0; k < t.conceptIds.length; k++) {
            await db.execute({
              sql: `INSERT INTO tantum.source_chunk_concepts (chunk_id, concept_id, confidence)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (chunk_id, concept_id) DO UPDATE SET confidence = EXCLUDED.confidence`,
              params: [t.chunkId, t.conceptIds[k], t.confidences[k] ?? 0.5],
            })
          }
        }
        payload.logger.info(`[ingest:${sourceId}] tagged ${Math.min(i + TAG_BATCH, inserted.length)}/${inserted.length}`)
      }
    }

    // 8. Resolve previously-unresolved citations against the new chunks
    await db.execute({
      sql: `UPDATE tantum.source_chunk_citations c
            SET to_chunk_id = sc.id
            FROM tantum.source_chunks sc
            WHERE c.to_chunk_id IS NULL
              AND c.to_locator = sc.locator`,
    })

    // 9. Mark done
    await payload.update({
      collection: 'sources',
      id: sourceId,
      data: {
        ingestStatus: 'ingested',
        chunkCount: inserted.length,
        lastIngestedAt: new Date().toISOString(),
      },
    })
    payload.logger.info(`[ingest:${sourceId}] DONE — ${inserted.length} chunks`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    payload.logger.error(`[ingest:${sourceId}] ERROR: ${msg}`)
    await payload.update({
      collection: 'sources',
      id: sourceId,
      data: { ingestStatus: 'error', errorMessage: msg },
    })
    throw err
  }
}
```

- [ ] **Step 2: Wire the afterChange hook on Sources**

In `src/collections/Sources.ts`, add at the top of the file (after the import line):
```ts
import type { CollectionAfterChangeHook } from 'payload'
```

And add to the collection config (above `fields`):
```ts
  hooks: {
    afterChange: [
      (async ({ doc, previousDoc, req, operation }) => {
        // Trigger ingestion when a Source is created with a file, OR when the file changes.
        const fileChanged =
          operation === 'create'
            ? Boolean(doc.file)
            : doc.file && (!previousDoc?.file || (typeof doc.file === 'object' ? doc.file.id : doc.file) !== (typeof previousDoc?.file === 'object' ? previousDoc?.file?.id : previousDoc?.file))
        if (!fileChanged) return doc
        if (doc.ingestStatus === 'ingesting') return doc // re-entrancy guard
        // Fire-and-forget — ingest in background; don't block the studio save.
        const { ingestSource } = await import('../catechist/ingest')
        ingestSource(req.payload, doc.id as number).catch((err) => {
          req.payload.logger.error(`afterChange ingest failed: ${err}`)
        })
        return doc
      }) as CollectionAfterChangeHook,
    ],
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: passes (or fix any obvious type mismatches in the hook).

- [ ] **Step 4: Commit**

```bash
git add src/catechist/ingest.ts src/collections/Sources.ts
git commit -m "feat(catechist): ingestion orchestrator + Sources afterChange hook"
```

---

## Task 14: Seed Concepts (40-concept ontology)

**Files:**
- Create: `src/catechist/seed/concepts.ts`
- Create: `src/scripts/seed-concepts.ts`

- [ ] **Step 1: Write the seed data**

Write `src/catechist/seed/concepts.ts`:
```ts
export interface ConceptSeed {
  name: string
  slug: string
  definition: string
  category:
    | 'trinity-god' | 'christology' | 'soteriology' | 'sacraments'
    | 'moral' | 'ecclesiology' | 'eschatology' | 'mariology' | 'spirituality' | 'other'
  parentSlug?: string
  synonyms?: string[]
}

export const CONCEPT_SEEDS: ConceptSeed[] = [
  // Trinity / God
  { name: 'Trinity', slug: 'trinity', category: 'trinity-god',
    definition: 'The doctrine that God is one Being in three co-equal, co-eternal divine Persons: Father, Son, and Holy Spirit.',
    synonyms: ['Triune God', 'Holy Trinity', 'three Persons one God'] },
  { name: 'Father (Person)', slug: 'father-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The first divine Person of the Trinity, source of the Son by eternal generation and of the Holy Spirit by spiration.' },
  { name: 'Son (Person)', slug: 'son-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The second divine Person, eternally begotten of the Father, incarnate in Jesus Christ.',
    synonyms: ['Logos', 'Word'] },
  { name: 'Holy Spirit (Person)', slug: 'holy-spirit-person', category: 'trinity-god', parentSlug: 'trinity',
    definition: 'The third divine Person, proceeding from the Father and the Son.',
    synonyms: ['Paraclete', 'Spirit of God'] },
  { name: 'Divine Nature', slug: 'divine-nature', category: 'trinity-god',
    definition: 'The single, indivisible essence of God, shared fully and equally by the three divine Persons.' },
  { name: 'Hypostatic Union', slug: 'hypostatic-union', category: 'christology',
    definition: 'The union of the divine and human natures in the one Person of Jesus Christ, without confusion or separation.' },

  // Christology
  { name: 'Incarnation', slug: 'incarnation', category: 'christology',
    definition: 'The eternal Son of God taking on human nature and being born of the Virgin Mary.' },
  { name: 'Redemption', slug: 'redemption', category: 'christology',
    definition: 'Christ\'s saving work freeing humanity from sin and death through his Passion, Death, and Resurrection.' },
  { name: 'Resurrection', slug: 'resurrection', category: 'christology',
    definition: 'Christ\'s rising bodily from the dead on the third day, the foundation of Christian faith.' },
  { name: 'Real Presence', slug: 'real-presence', category: 'sacraments',
    definition: 'The doctrine that in the Eucharist Christ is truly, really, and substantially present under the appearances of bread and wine.',
    synonyms: ['transubstantiation', 'eucharistic presence'] },
  { name: 'Two Natures of Christ', slug: 'two-natures', category: 'christology',
    definition: 'Christ possesses both a complete divine nature and a complete human nature, united in one Person (Chalcedonian definition).' },

  // Soteriology / Grace
  { name: 'Sanctifying Grace', slug: 'sanctifying-grace', category: 'soteriology',
    definition: 'The supernatural gift of God\'s life dwelling in the soul, making us partakers of the divine nature.',
    synonyms: ['habitual grace'] },
  { name: 'Actual Grace', slug: 'actual-grace', category: 'soteriology',
    definition: 'Transient supernatural help from God enabling specific acts of will or intellect ordered to salvation.' },
  { name: 'Prevenient Grace', slug: 'prevenient-grace', category: 'soteriology',
    definition: 'Grace that precedes and prepares the will to consent to faith and conversion.' },
  { name: 'Justification', slug: 'justification', category: 'soteriology',
    definition: 'The act of God whereby he makes the sinner truly righteous through the gift of grace, washing away sin.' },
  { name: 'Faith', slug: 'faith', category: 'soteriology',
    definition: 'The theological virtue by which we believe in God and all that he has revealed.' },
  { name: 'Hope', slug: 'hope', category: 'soteriology',
    definition: 'The theological virtue by which we desire eternal life as our happiness, trusting in Christ\'s promises.' },
  { name: 'Charity', slug: 'charity', category: 'soteriology',
    definition: 'The theological virtue by which we love God above all things and our neighbour as ourselves for the love of God.',
    synonyms: ['love', 'agape'] },

  // Sacraments
  { name: 'Sacrament', slug: 'sacrament', category: 'sacraments',
    definition: 'An efficacious sign of grace, instituted by Christ and entrusted to the Church, by which divine life is dispensed.' },
  { name: 'Baptism', slug: 'baptism', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament of initiation that washes away original sin, confers sanctifying grace, and incorporates the recipient into the Body of Christ.' },
  { name: 'Confirmation', slug: 'confirmation', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament that completes baptismal grace by a special outpouring of the Holy Spirit.' },
  { name: 'Eucharist', slug: 'eucharist', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament of Christ\'s Body and Blood, the source and summit of the Christian life.',
    synonyms: ['Holy Communion', 'Blessed Sacrament', 'Mass'] },
  { name: 'Confession', slug: 'confession', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the faithful obtain absolution from sins committed after Baptism through priestly ministry.',
    synonyms: ['Reconciliation', 'Penance'] },
  { name: 'Anointing of the Sick', slug: 'anointing', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the Church entrusts the dangerously ill to the suffering and glorified Lord, and confers grace for healing.' },
  { name: 'Holy Orders', slug: 'holy-orders', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which the mission entrusted by Christ to his apostles continues in the Church through bishops, priests, and deacons.' },
  { name: 'Matrimony', slug: 'matrimony', category: 'sacraments', parentSlug: 'sacrament',
    definition: 'The sacrament by which a baptized man and woman form a permanent partnership of life and love, ordered to the good of the spouses and the procreation of children.' },

  // Moral
  { name: 'Natural Law', slug: 'natural-law', category: 'moral',
    definition: 'The moral law inscribed by God in human nature, knowable by reason, expressing what is good and just.' },
  { name: 'Conscience', slug: 'conscience', category: 'moral',
    definition: 'The judgment of reason by which the human person recognizes the moral quality of a concrete act.' },
  { name: 'Mortal Sin', slug: 'mortal-sin', category: 'moral',
    definition: 'A grave violation of God\'s law committed with full knowledge and deliberate consent, severing the soul from sanctifying grace.' },
  { name: 'Venial Sin', slug: 'venial-sin', category: 'moral',
    definition: 'A less serious offense against God\'s law, wounding charity but not destroying it.' },
  { name: 'Cardinal Virtues', slug: 'cardinal-virtues', category: 'moral',
    definition: 'The four moral virtues — prudence, justice, fortitude, temperance — on which the moral life pivots.' },
  { name: 'Theological Virtues', slug: 'theological-virtues', category: 'moral',
    definition: 'Faith, hope, and charity — virtues infused by God that have God himself for their object.' },
  { name: 'Beatitudes', slug: 'beatitudes', category: 'moral',
    definition: 'The promises of blessedness given by Christ in the Sermon on the Mount, depicting the face of the Christian disciple.' },

  // Ecclesiology
  { name: 'Church (Mystical Body)', slug: 'church', category: 'ecclesiology',
    definition: 'The Mystical Body of Christ, the People of God, the Sacrament of salvation; one, holy, catholic, and apostolic.' },
  { name: 'Magisterium', slug: 'magisterium', category: 'ecclesiology',
    definition: 'The teaching authority of the Church, exercised by the Pope and the bishops in communion with him.' },
  { name: 'Apostolic Succession', slug: 'apostolic-succession', category: 'ecclesiology',
    definition: 'The unbroken transmission of the apostles\' mission and authority through the laying on of hands by validly ordained bishops.' },
  { name: 'Papal Authority', slug: 'papal-authority', category: 'ecclesiology',
    definition: 'The supreme, full, immediate, and universal power of the Roman Pontiff over the whole Church.' },
  { name: 'Communion of Saints', slug: 'communion-of-saints', category: 'ecclesiology',
    definition: 'The spiritual union of the faithful on earth, in purgatory, and in heaven in Christ.' },

  // Eschatology
  { name: 'Heaven', slug: 'heaven', category: 'eschatology',
    definition: 'The final state of communion with the Blessed Trinity for those who die in God\'s grace and friendship.',
    synonyms: ['Beatific Vision'] },
  { name: 'Hell', slug: 'hell', category: 'eschatology',
    definition: 'The state of definitive self-exclusion from communion with God and the blessed, chosen by those who die in mortal sin without repentance.' },
  { name: 'Purgatory', slug: 'purgatory', category: 'eschatology',
    definition: 'The state of those who die in God\'s grace but still need purification to enter the joy of heaven.' },
  { name: 'Last Judgment', slug: 'last-judgment', category: 'eschatology',
    definition: 'Christ\'s final judgment at the end of time over the living and the dead.' },
  { name: 'Particular Judgment', slug: 'particular-judgment', category: 'eschatology',
    definition: 'The judgment each person undergoes at the moment of death.' },

  // Mariology
  { name: 'Mary (Theotokos)', slug: 'mary-theotokos', category: 'mariology',
    definition: 'The Blessed Virgin Mary, Mother of God; her divine maternity is the foundation of all Marian doctrine.',
    synonyms: ['Mother of God', 'Blessed Virgin Mary'] },
  { name: 'Immaculate Conception', slug: 'immaculate-conception', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary, from the first instant of her conception, was preserved free from all stain of original sin.' },
  { name: 'Assumption', slug: 'assumption', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary, at the end of her earthly life, was assumed body and soul into heavenly glory.' },
  { name: 'Perpetual Virginity', slug: 'perpetual-virginity', category: 'mariology', parentSlug: 'mary-theotokos',
    definition: 'The doctrine that Mary remained a virgin before, during, and after the birth of Christ.' },

  // Spirituality
  { name: 'Prayer', slug: 'prayer', category: 'spirituality',
    definition: 'The raising of one\'s mind and heart to God, expressing adoration, contrition, thanksgiving, and supplication.' },
  { name: 'Liturgy', slug: 'liturgy', category: 'spirituality',
    definition: 'The public worship of the Church, especially the Mass and the Liturgy of the Hours.' },
  { name: 'Lectio Divina', slug: 'lectio-divina', category: 'spirituality',
    definition: 'Sacred reading: a contemplative engagement with Scripture in four movements (lectio, meditatio, oratio, contemplatio).' },
  { name: 'Devotion to the Saints', slug: 'devotion-saints', category: 'spirituality',
    definition: 'The honor and veneration given to the saints, who are intercessors before God and models of holiness.' },
]
```

- [ ] **Step 2: Write the seed script**

Write `src/scripts/seed-concepts.ts`:
```ts
import { getPayload } from 'payload'
import config from '../payload.config'
import { CONCEPT_SEEDS } from '../catechist/seed/concepts'

async function main() {
  const payload = await getPayload({ config })
  payload.logger.info(`Seeding ${CONCEPT_SEEDS.length} concepts...`)

  // Create in two passes: first all concepts, then set parent refs.
  const slugToId = new Map<string, number>()

  for (const seed of CONCEPT_SEEDS) {
    const existing = await payload.find({
      collection: 'concepts',
      where: { slug: { equals: seed.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      slugToId.set(seed.slug, existing.docs[0].id as number)
      continue
    }
    const created = await payload.create({
      collection: 'concepts',
      data: {
        name: seed.name,
        slug: seed.slug,
        definition: seed.definition,
        category: seed.category,
        synonyms: (seed.synonyms ?? []).map((p) => ({ phrase: p })),
      },
    })
    slugToId.set(seed.slug, created.id as number)
    payload.logger.info(`  + ${seed.name}`)
  }

  // Pass 2: parent refs
  for (const seed of CONCEPT_SEEDS) {
    if (!seed.parentSlug) continue
    const id = slugToId.get(seed.slug)
    const parentId = slugToId.get(seed.parentSlug)
    if (!id || !parentId) continue
    await payload.update({
      collection: 'concepts',
      id,
      data: { parent: parentId },
    })
  }

  payload.logger.info('DONE')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Run the seed**

Run: `pnpm seed:concepts`
Expected: prints `+ Trinity`, `+ Father (Person)`, ... `DONE`. Verify in studio at `/admin/collections/concepts` — 50 concepts present (the list grows slightly with parent items; count is `CONCEPT_SEEDS.length`).

- [ ] **Step 4: Commit**

```bash
git add src/catechist/seed/concepts.ts src/scripts/seed-concepts.ts
git commit -m "feat(catechist): seed 40-concept curated ontology"
```

---

## Task 15: Re-ranking score function (TDD)

**Files:**
- Create: `src/catechist/rerank.ts`
- Test: `tests/catechist/rerank.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/catechist/rerank.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { authorityWeight, conceptOverlap, scoreCandidate } from '../../src/catechist/rerank'

describe('authorityWeight', () => {
  it('returns documented weights', () => {
    expect(authorityWeight('scripture')).toBe(1.0)
    expect(authorityWeight('council')).toBe(0.95)
    expect(authorityWeight('catechism')).toBe(0.85)
    expect(authorityWeight('encyclical')).toBe(0.75)
    expect(authorityWeight('father')).toBe(0.65)
    expect(authorityWeight('theologian')).toBe(0.55)
    expect(authorityWeight('other')).toBe(0.4)
  })
  it('falls back to 0.4 for unknown', () => {
    expect(authorityWeight('mystery' as never)).toBe(0.4)
  })
})

describe('conceptOverlap', () => {
  it('returns 0 when neither has concepts', () => {
    expect(conceptOverlap([], [])).toBe(0)
  })
  it('returns 0 when query has none', () => {
    expect(conceptOverlap([], [1, 2, 3])).toBe(0)
  })
  it('returns Jaccard-style fraction', () => {
    // overlap 1, union 3 → 1/3
    expect(conceptOverlap([1, 2], [2, 3])).toBeCloseTo(1 / 3, 5)
  })
  it('returns 1 when fully overlapping', () => {
    expect(conceptOverlap([1, 2], [1, 2])).toBe(1)
  })
})

describe('scoreCandidate', () => {
  it('combines similarity, authority, and concept overlap', () => {
    // similarity 0.8 × authority 1.0 × (1 + 0.3 * 1.0) = 0.8 * 1.3 = 1.04
    expect(
      scoreCandidate({ similarity: 0.8, authorityTier: 'scripture', queryConcepts: [1], chunkConcepts: [1] }),
    ).toBeCloseTo(1.04, 5)
  })
  it('penalizes lower-authority results', () => {
    const scripture = scoreCandidate({ similarity: 0.5, authorityTier: 'scripture', queryConcepts: [], chunkConcepts: [] })
    const theologian = scoreCandidate({ similarity: 0.5, authorityTier: 'theologian', queryConcepts: [], chunkConcepts: [] })
    expect(scripture).toBeGreaterThan(theologian)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/catechist/rerank.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write `src/catechist/rerank.ts`:
```ts
export type AuthorityTier =
  | 'scripture' | 'council' | 'catechism' | 'encyclical'
  | 'father' | 'theologian' | 'other'

const WEIGHTS: Record<AuthorityTier, number> = {
  scripture: 1.0,
  council: 0.95,
  catechism: 0.85,
  encyclical: 0.75,
  father: 0.65,
  theologian: 0.55,
  other: 0.4,
}

export function authorityWeight(tier: AuthorityTier): number {
  return WEIGHTS[tier] ?? 0.4
}

export function conceptOverlap(queryConcepts: number[], chunkConcepts: number[]): number {
  if (queryConcepts.length === 0) return 0
  const q = new Set(queryConcepts)
  const c = new Set(chunkConcepts)
  let inter = 0
  for (const id of q) if (c.has(id)) inter += 1
  const union = new Set([...q, ...c]).size
  if (union === 0) return 0
  return inter / union
}

export interface ScoreInput {
  similarity: number
  authorityTier: AuthorityTier
  queryConcepts: number[]
  chunkConcepts: number[]
}

export function scoreCandidate(input: ScoreInput): number {
  const overlap = conceptOverlap(input.queryConcepts, input.chunkConcepts)
  return input.similarity * authorityWeight(input.authorityTier) * (1 + 0.3 * overlap)
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test tests/catechist/rerank.test.ts`
Expected: PASS — all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/catechist/rerank.ts tests/catechist/rerank.test.ts
git commit -m "feat(catechist): re-rank scoring (similarity x authority x conceptOverlap) + tests"
```

---

## Task 16: Citation validator (TDD)

**Files:**
- Create: `src/catechist/validate.ts`
- Test: `tests/catechist/validate.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/catechist/validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateCitations, type ChunkLookup } from '../../src/catechist/validate'

const lookup: ChunkLookup = {
  'a1': { text: 'In the beginning was the Word, and the Word was with God, and the Word was God.', locator: 'John 1:1' },
  'b2': { text: 'For God so loved the world that he gave his only Son.', locator: 'John 3:16' },
}

describe('validateCitations', () => {
  it('passes when all citations are valid and quoted spans match', () => {
    const result = validateCitations(
      [{ chunkId: 'a1', locator: 'John 1:1', quotedSpan: 'In the beginning was the Word' }],
      lookup,
    )
    expect(result).toEqual({ ok: true })
  })

  it('fails on empty citations', () => {
    expect(validateCitations([], lookup)).toEqual({ ok: false, reason: 'no_citations' })
  })

  it('fails when chunk id is unknown', () => {
    const r = validateCitations(
      [{ chunkId: 'ghost', locator: 'X', quotedSpan: 'anything' }],
      lookup,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_chunk_id')
  })

  it('fails when quotedSpan is not a substring', () => {
    const r = validateCitations(
      [{ chunkId: 'a1', locator: 'John 1:1', quotedSpan: 'fabricated text not in source' }],
      lookup,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('fabricated_quote')
  })

  it('passes with multiple valid citations', () => {
    const r = validateCitations(
      [
        { chunkId: 'a1', locator: 'John 1:1', quotedSpan: 'the Word was God' },
        { chunkId: 'b2', locator: 'John 3:16', quotedSpan: 'God so loved the world' },
      ],
      lookup,
    )
    expect(r).toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/catechist/validate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Write `src/catechist/validate.ts`:
```ts
export interface Citation {
  chunkId: string
  locator: string
  quotedSpan: string
}

export interface ChunkLookupEntry {
  text: string
  locator: string
}

export type ChunkLookup = Record<string, ChunkLookupEntry>

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: 'no_citations' | 'invalid_chunk_id' | 'fabricated_quote'; offendingChunkId?: string }

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function validateCitations(citations: Citation[], lookup: ChunkLookup): ValidationResult {
  if (citations.length === 0) return { ok: false, reason: 'no_citations' }
  for (const c of citations) {
    const entry = lookup[c.chunkId]
    if (!entry) return { ok: false, reason: 'invalid_chunk_id', offendingChunkId: c.chunkId }
    if (!normalize(entry.text).includes(normalize(c.quotedSpan))) {
      return { ok: false, reason: 'fabricated_quote', offendingChunkId: c.chunkId }
    }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test tests/catechist/validate.test.ts`
Expected: PASS — all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/catechist/validate.ts tests/catechist/validate.test.ts
git commit -m "feat(catechist): citation validator (chunk-exists + quoted-span substring) + tests"
```

---

## Task 17: Retrieval pipeline (vector kNN + 1-hop expansion + re-rank)

**Files:**
- Create: `src/catechist/retrieve.ts`

- [ ] **Step 1: Write the retriever**

Write `src/catechist/retrieve.ts`:
```ts
import 'server-only'
import type { Payload } from 'payload'
import { embedOne } from './embedding'
import { tagChunks, type ConceptDef } from './conceptTagger'
import { authorityWeight, conceptOverlap, scoreCandidate, type AuthorityTier } from './rerank'

export interface RetrievedChunk {
  id: string
  sourceId: number
  text: string
  locator: string
  authorityTier: AuthorityTier
  similarity: number
  conceptIds: number[]
  score: number
}

export interface RetrieveOptions {
  questionWithContext: string
  topK?: number // final size, default 8
  poolSize?: number // initial vector kNN size, default 20
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pool(payload: Payload): any { return (payload.db as any).pool }

async function getQueryConcepts(payload: Payload, question: string): Promise<number[]> {
  const concepts = await payload.find({ collection: 'concepts', limit: 200 })
  if (concepts.docs.length === 0) return []
  const conceptDefs: ConceptDef[] = concepts.docs.map((c) => ({
    id: c.id as number,
    name: c.name,
    definition: c.definition,
    synonyms: (c.synonyms ?? []).map((s) => s.phrase),
  }))
  const tagged = await tagChunks([{ id: 'q', text: question }], conceptDefs)
  return tagged[0]?.conceptIds ?? []
}

export async function retrieveContext(payload: Payload, opts: RetrieveOptions): Promise<RetrievedChunk[]> {
  const topK = opts.topK ?? 8
  const poolSize = opts.poolSize ?? 20

  // 1. Embed question
  const qVec = await embedOne(opts.questionWithContext, 'RETRIEVAL_QUERY')
  const vecLit = `[${qVec.join(',')}]`

  // 2. Vector kNN
  const knnRes = await pool(payload).query(
    `SELECT id, source_id, text, locator, authority_tier,
            1 - (embedding <=> $1::vector) AS similarity
       FROM tantum.source_chunks
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
    [vecLit, poolSize],
  )

  const candidates = new Map<string, RetrievedChunk>()
  for (const row of knnRes.rows) {
    candidates.set(row.id, {
      id: row.id,
      sourceId: row.source_id,
      text: row.text,
      locator: row.locator,
      authorityTier: (row.authority_tier ?? 'other') as AuthorityTier,
      similarity: Number(row.similarity),
      conceptIds: [],
      score: 0,
    })
  }

  // 3. Citation expansion (1 hop) on top 10
  const top10 = [...candidates.values()].slice(0, 10).map((c) => c.id)
  if (top10.length > 0) {
    const expRes = await pool(payload).query(
      `SELECT s.id, s.source_id, s.text, s.locator, s.authority_tier,
              0.5 AS similarity
         FROM tantum.source_chunk_citations c
         JOIN tantum.source_chunks s ON s.id = c.to_chunk_id
        WHERE c.from_chunk_id = ANY($1::uuid[])`,
      [top10],
    )
    for (const row of expRes.rows) {
      if (!candidates.has(row.id)) {
        candidates.set(row.id, {
          id: row.id,
          sourceId: row.source_id,
          text: row.text,
          locator: row.locator,
          authorityTier: (row.authority_tier ?? 'other') as AuthorityTier,
          similarity: Number(row.similarity),
          conceptIds: [],
          score: 0,
        })
      }
    }
  }

  // 4. Concept tags for candidates
  const ids = [...candidates.keys()]
  if (ids.length > 0) {
    const conceptRes = await pool(payload).query(
      `SELECT chunk_id, concept_id FROM tantum.source_chunk_concepts WHERE chunk_id = ANY($1::uuid[])`,
      [ids],
    )
    for (const row of conceptRes.rows) {
      candidates.get(row.chunk_id)?.conceptIds.push(row.concept_id)
    }
  }

  // 5. Tag the question with concepts
  const queryConcepts = await getQueryConcepts(payload, opts.questionWithContext)

  // 6. Re-rank
  for (const cand of candidates.values()) {
    cand.score = scoreCandidate({
      similarity: cand.similarity,
      authorityTier: cand.authorityTier,
      queryConcepts,
      chunkConcepts: cand.conceptIds,
    })
  }

  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, topK)
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/catechist/retrieve.ts
git commit -m "feat(catechist): graph-aware retrieval (vector kNN + 1-hop + concept re-rank)"
```

---

## Task 18: System prompt + context builder

**Files:**
- Create: `src/catechist/prompt.ts`

- [ ] **Step 1: Write the prompt builder**

Write `src/catechist/prompt.ts`:
```ts
import type { RetrievedChunk } from './retrieve'

export const CATECHIST_SYSTEM_PROMPT = `You are the Catechist of Tantum Ergo, a Catholic formation app.

You are bound to citation. Every claim in your answer MUST be supported by one of the passages provided in <context>. You may quote, paraphrase, or synthesize across passages, but every footnote MUST point to a real passage in <context>, identified by its [chunkId].

If the provided passages are not sufficient to answer the question with confidence, refuse: return citations:[]. Do NOT invent; do NOT speculate beyond the passages.

Tone: warm, precise, pastoral when fitting; rigorous when the question warrants. Adapt to the depth of the question. Do not lecture; do not pad. When the question is delicate (suffering, sin, hard teaching), be candid but kind — quote the Church's teaching plainly with its citation.

When citing Scripture, call the scriptureCard tool inline.
When citing the Catechism (CCC §nnnn or Roman Catechism), call the catechismCard tool inline.
When citing any other source (council, encyclical, Father, Aquinas), call the sourcePreviewCard tool inline.
When the citation lineage matters (a Council interpreting Scripture, a Catechism citing a Father), call the citationTraceCard tool inline.

Your final structured response MUST contain:
- answer: the prose, with [^N] footnote markers where N is 1-indexed and corresponds to citations[N-1]
- citations: array of { chunkId, locator, quotedSpan } — quotedSpan must be a verbatim substring of the chunk text`

export interface BuildContextArgs {
  chunks: RetrievedChunk[]
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  question: string
}

export function buildUserMessage({ chunks, history, question }: BuildContextArgs): string {
  const ctx = chunks
    .map(
      (c) =>
        `[chunkId:${c.id}] [locator:${c.locator}] [authority:${c.authorityTier}]\n${c.text}`,
    )
    .join('\n\n---\n\n')

  const histText = history.length > 0
    ? history.map((m) => `${m.role === 'user' ? 'User' : 'Catechist'}: ${m.content}`).join('\n\n')
    : '(no prior turns)'

  return `<context>
${ctx}
</context>

<conversation_history>
${histText}
</conversation_history>

<question>
${question}
</question>`
}

// Build a question that includes recent conversational context for retrieval.
export function buildRetrievalQuery(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  const recent = history.slice(-4)
  if (recent.length === 0) return question
  const tail = recent.map((m) => m.content).join(' ')
  return `${tail} ${question}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/catechist/prompt.ts
git commit -m "feat(catechist): system prompt + context+history builders"
```

---

## Task 19: Generative-UI tool definitions (4 cards) + AI SDK wiring

**Files:**
- Create: `src/catechist/tools.ts`

- [ ] **Step 1: Write the tool definitions**

Write `src/catechist/tools.ts`:
```ts
import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'

// Tool RESULTS are JSON the model emits; the frontend renders them as cards.
// We don't render React server-side here — Vercel AI SDK streams the tool calls
// to the client where useChat() exposes them via message.toolInvocations.
// This keeps the API route simple (it returns text + structured tool-call events).

export const scriptureCardTool = tool({
  description: 'Render an inline Scripture card when citing a Bible verse. Use whenever the answer cites Scripture.',
  inputSchema: z.object({
    book: z.string().describe('Book name, e.g. "John"'),
    chapter: z.number(),
    verseStart: z.number(),
    verseEnd: z.number().optional().describe('If quoting a range'),
    quotedText: z.string().describe('The verse text as cited'),
    chunkId: z.string().describe('The source_chunks.id this card derives from'),
  }),
})

export const catechismCardTool = tool({
  description: 'Render an inline Catechism card when citing CCC §nnnn or a Roman Catechism passage.',
  inputSchema: z.object({
    catechism: z.enum(['CCC', 'Roman Catechism']),
    paragraph: z.string().describe('e.g. "1374" or "Part II, Q. 7"'),
    quotedText: z.string(),
    chunkId: z.string(),
  }),
})

export const sourcePreviewCardTool = tool({
  description: 'Render an inline source preview card when citing a council, encyclical, Father, or Aquinas.',
  inputSchema: z.object({
    sourceTitle: z.string(),
    author: z.string().optional(),
    year: z.number().optional(),
    locator: z.string().describe('e.g. "Veritatis Splendor §54"'),
    quotedText: z.string(),
    chunkId: z.string(),
  }),
})

export const citationTraceCardTool = tool({
  description: 'Render an inline citation lineage card when the chain matters (e.g. a Council interpreting Scripture, a Catechism citing a Father).',
  inputSchema: z.object({
    chain: z
      .array(z.object({ locator: z.string(), note: z.string().optional() }))
      .min(2)
      .describe('Ordered chain of locators, root to leaf'),
  }),
})

export const catechistTools = {
  scriptureCard: scriptureCardTool,
  catechismCard: catechismCardTool,
  sourcePreviewCard: sourcePreviewCardTool,
  citationTraceCard: citationTraceCardTool,
}

export type CatechistToolName = keyof typeof catechistTools
```

- [ ] **Step 2: Commit**

```bash
git add src/catechist/tools.ts
git commit -m "feat(catechist): four generative-UI tools (Scripture/Catechism/source/trace)"
```

---

## Task 20: Per-Member rate limiter

**Files:**
- Create: `src/catechist/rateLimit.ts`

- [ ] **Step 1: Write the helper**

Write `src/catechist/rateLimit.ts`:
```ts
import 'server-only'
import type { Payload } from 'payload'

export interface RateLimitResult {
  allowed: boolean
  used: number
  limit: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pool(payload: Payload): any { return (payload.db as any).pool }

export async function checkAndConsume(
  payload: Payload,
  memberId: number,
  bucket = 'ask',
): Promise<RateLimitResult> {
  const settings = await payload.findGlobal({ slug: 'settings' }).catch(() => null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const limit: number = (settings as any)?.catechistRateLimit?.dailyLimit ?? 50

  const countRes = await pool(payload).query(
    `SELECT count(*)::int AS used
       FROM tantum.catechist_rate_limits
      WHERE member_id = $1 AND bucket = $2 AND created_at > now() - interval '24 hours'`,
    [memberId, bucket],
  )
  const used: number = countRes.rows[0]?.used ?? 0
  if (used >= limit) return { allowed: false, used, limit }

  await pool(payload).query(
    `INSERT INTO tantum.catechist_rate_limits (member_id, bucket) VALUES ($1, $2)`,
    [memberId, bucket],
  )

  return { allowed: true, used: used + 1, limit }
}

export async function checkOnly(
  payload: Payload,
  memberId: number,
  bucket = 'ask',
): Promise<RateLimitResult> {
  const settings = await payload.findGlobal({ slug: 'settings' }).catch(() => null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const limit: number = (settings as any)?.catechistRateLimit?.dailyLimit ?? 50
  const r = await pool(payload).query(
    `SELECT count(*)::int AS used FROM tantum.catechist_rate_limits
      WHERE member_id = $1 AND bucket = $2 AND created_at > now() - interval '24 hours'`,
    [memberId, bucket],
  )
  const used: number = r.rows[0]?.used ?? 0
  return { allowed: used < limit, used, limit }
}
```

- [ ] **Step 2: Extend Settings global with rate-limit fields**

Open `src/globals/Settings.ts`. Inside the `fields:` array, add (placement is fine anywhere among existing fields):
```ts
{
  name: 'catechistRateLimit',
  type: 'group',
  fields: [
    { name: 'dailyLimit', type: 'number', defaultValue: 50,
      admin: { description: 'Per-Member daily cap on /api/catechist/ask requests.' } },
    { name: 'refusalMessage', type: 'textarea',
      defaultValue: "I cannot answer this with confidence from the sources I've read. Here are the closest passages I found —",
      admin: { description: 'Shown when retrieval+generation cannot produce a citation-bound answer.' } },
  ],
},
```

- [ ] **Step 3: Generate types + typecheck**

Run: `pnpm generate:types && pnpm typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/catechist/rateLimit.ts src/globals/Settings.ts src/payload-types.ts
git commit -m "feat(catechist): per-Member daily rate limiter + Settings.catechistRateLimit"
```

---

## Task 21: API route — POST /api/catechist/ask (streaming)

**Files:**
- Create: `src/app/(payload)/api/catechist/ask/route.ts`

> Note: route lives under `(payload)` because Payload's Next 16 integration handles middleware and auth helper there. If your project routes API endpoints elsewhere, place this under `(frontend)/api/catechist/ask/route.ts` instead — the body works identically.

- [ ] **Step 1: Write the route**

Write `src/app/(payload)/api/catechist/ask/route.ts`:
```ts
import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { z } from 'zod'

import { retrieveContext } from '../../../../../catechist/retrieve'
import { CATECHIST_SYSTEM_PROMPT, buildRetrievalQuery, buildUserMessage } from '../../../../../catechist/prompt'
import { catechistTools } from '../../../../../catechist/tools'
import { validateCitations, type ChunkLookup } from '../../../../../catechist/validate'
import { checkAndConsume } from '../../../../../catechist/rateLimit'

const BodySchema = z.object({
  conversationId: z.string().optional(),
  question: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  // 1. Auth: load Member from cookie
  const cookieHeader = req.headers.get('cookie') ?? ''
  const auth = await payload.auth({ headers: new Headers({ cookie: cookieHeader }) })
  const user = auth.user
  if (!user || user.collection !== 'members') {
    return new Response('Unauthorized', { status: 401 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(user as any)._verified) {
    return new Response('Email not verified', { status: 403 })
  }

  // 2. Parse body
  const json = await req.json()
  const body = BodySchema.parse(json)

  // 3. Rate limit
  const rate = await checkAndConsume(payload, user.id as number, 'ask')
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', used: rate.used, limit: rate.limit }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    )
  }

  // 4. Load or create conversation
  let conversationId = body.conversationId
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  if (conversationId) {
    const conv = await payload.findByID({ collection: 'catechist-conversations', id: conversationId, overrideAccess: false, user })
    history = (conv.messages ?? []).slice(-4).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  } else {
    const created = await payload.create({
      collection: 'catechist-conversations',
      data: {
        member: user.id as number,
        title: body.question.slice(0, 60),
        messages: [],
        archived: false,
      },
      overrideAccess: false,
      user,
    })
    conversationId = String(created.id)
  }

  // 5. Build retrieval query (question + recent context)
  const retrievalQuery = buildRetrievalQuery(body.question, history)

  // 6. Retrieve
  const chunks = await retrieveContext(payload, { questionWithContext: retrievalQuery })

  // 7. Build prompt
  const userMessage = buildUserMessage({ chunks, history, question: body.question })

  // 8. Build chunk lookup for validation post-stream
  const lookup: ChunkLookup = {}
  for (const c of chunks) lookup[c.id] = { text: c.text, locator: c.locator }

  // 9. Stream
  const result = streamText({
    model: google('gemini-2.5-pro'),
    system: CATECHIST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    tools: catechistTools,
    temperature: 0.3,
    onFinish: async ({ text, toolCalls }) => {
      // Extract citations from card tool calls. Each card with chunkId + quotedText IS a citation.
      function deriveLocator(toolName: string, args: Record<string, unknown>): string {
        if (toolName === 'scriptureCard') {
          const { book, chapter, verseStart, verseEnd } = args as { book: string; chapter: number; verseStart: number; verseEnd?: number }
          return `${book} ${chapter}:${verseStart}${verseEnd ? `–${verseEnd}` : ''}`
        }
        if (toolName === 'catechismCard') {
          const { catechism, paragraph } = args as { catechism: string; paragraph: string }
          return catechism === 'Roman Catechism' ? `Roman Catechism, ${paragraph}` : `CCC §${paragraph}`
        }
        if (toolName === 'sourcePreviewCard') {
          return (args.locator as string) ?? 'unknown'
        }
        return 'unknown'
      }

      const citations: { chunkId: string; locator: string; quotedSpan: string }[] = []
      for (const call of toolCalls ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = call as any
        const toolName: string = c.toolName ?? c.name ?? ''
        const args: Record<string, unknown> = c.input ?? c.args ?? {}
        // Trace card has no chunkId — it's not a citation, just a visualization.
        if (toolName === 'citationTraceCard') continue
        if (typeof args.chunkId === 'string' && typeof args.quotedText === 'string') {
          citations.push({
            chunkId: args.chunkId,
            locator: deriveLocator(toolName, args),
            quotedSpan: args.quotedText,
          })
        }
      }

      const validation = validateCitations(citations, lookup)

      // Persist messages
      const conv = await payload.findByID({ collection: 'catechist-conversations', id: conversationId!, overrideAccess: true })
      const newMessages = [
        ...(conv.messages ?? []),
        { role: 'user' as const, content: body.question, citations: null, components: null, createdAt: new Date().toISOString() },
        {
          role: 'assistant' as const,
          content: text,
          citations: validation.ok ? citations : [],
          components: toolCalls ?? [],
          createdAt: new Date().toISOString(),
        },
      ]
      await payload.update({
        collection: 'catechist-conversations',
        id: conversationId!,
        data: { messages: newMessages },
        overrideAccess: true,
      })

      // Log refusals
      if (!validation.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (payload.db as any).pool
        await p.query(
          `INSERT INTO tantum.catechist_refusals (member_id, question, retrieval_top3, reason) VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            body.question,
            JSON.stringify(chunks.slice(0, 3).map((c) => ({ id: c.id, locator: c.locator, text: c.text.slice(0, 400) }))),
            validation.reason,
          ],
        )
      }
    },
  })

  // toAIStreamResponse / toDataStreamResponse — attach conversationId in headers
  const response = result.toDataStreamResponse()
  response.headers.set('x-conversation-id', conversationId!)
  return response
}
```

> Notes for the implementer:
> - `path` from this file to `payload.config.ts` is five levels up (`api/catechist/ask/route.ts` → `(payload)` → `app` → `src` → `payload.config`). Adjust if your project layout differs.
> - The tool-call extraction in `onFinish` reads `input` (Vercel AI SDK v4) or `args` (older versions). Keep both for robustness.
> - `toDataStreamResponse()` is the AI-SDK-v4 method name. If your installed `ai` version uses `toAIStreamResponse()`, swap it; behaviour is identical for our purposes.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: passes (some `as any` are intentional; unrelated errors should be fixed).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(payload\)/api/catechist/ask/route.ts
git commit -m "feat(catechist): POST /api/catechist/ask — streaming, retrieval, validation, refusal log"
```

---

## Task 22: API routes — conversations (list/create/load/update/delete)

**Files:**
- Create: `src/app/(payload)/api/catechist/conversations/route.ts`
- Create: `src/app/(payload)/api/catechist/conversations/[id]/route.ts`

- [ ] **Step 1: Write list + create**

Write `src/app/(payload)/api/catechist/conversations/route.ts`:
```ts
import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { z } from 'zod'

async function authedMember(req: NextRequest) {
  const payload = await getPayload({ config })
  const cookieHeader = req.headers.get('cookie') ?? ''
  const auth = await payload.auth({ headers: new Headers({ cookie: cookieHeader }) })
  const user = auth.user
  if (!user || user.collection !== 'members') return { payload, user: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(user as any)._verified) return { payload, user: null }
  return { payload, user }
}

export async function GET(req: NextRequest) {
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const conversations = await payload.find({
    collection: 'catechist-conversations',
    where: {
      and: [{ member: { equals: user.id } }, { archived: { equals: false } }],
    },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user,
  })

  return Response.json({
    conversations: conversations.docs.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: (c.messages ?? []).length,
    })),
  })
}

const CreateBody = z.object({ title: z.string().optional() })

export async function POST(req: NextRequest) {
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = CreateBody.parse(await req.json().catch(() => ({})))
  const created = await payload.create({
    collection: 'catechist-conversations',
    data: {
      member: user.id as number,
      title: body.title ?? 'New inquiry',
      messages: [],
      archived: false,
    },
    overrideAccess: false,
    user,
  })

  return Response.json({ id: String(created.id), title: created.title })
}
```

- [ ] **Step 2: Write get + patch + delete**

Write `src/app/(payload)/api/catechist/conversations/[id]/route.ts`:
```ts
import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { z } from 'zod'

async function authedMember(req: NextRequest) {
  const payload = await getPayload({ config })
  const cookieHeader = req.headers.get('cookie') ?? ''
  const auth = await payload.auth({ headers: new Headers({ cookie: cookieHeader }) })
  const user = auth.user
  if (!user || user.collection !== 'members') return { payload, user: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(user as any)._verified) return { payload, user: null }
  return { payload, user }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  try {
    const conv = await payload.findByID({
      collection: 'catechist-conversations',
      id,
      overrideAccess: false,
      user,
    })
    return Response.json(conv)
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

const PatchBody = z.object({
  title: z.string().optional(),
  archived: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const body = PatchBody.parse(await req.json())
  try {
    const updated = await payload.update({
      collection: 'catechist-conversations',
      id,
      data: body,
      overrideAccess: false,
      user,
    })
    return Response.json({ id: updated.id, title: updated.title, archived: updated.archived })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  // Soft delete: set archived=true
  try {
    await payload.update({
      collection: 'catechist-conversations',
      id,
      data: { archived: true },
      overrideAccess: false,
      user,
    })
    return new Response(null, { status: 204 })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(payload\)/api/catechist/conversations
git commit -m "feat(catechist): conversations API (GET list, POST create, GET/PATCH/DELETE one)"
```

---

## Task 23: API routes — sources (read-only public)

**Files:**
- Create: `src/app/(payload)/api/catechist/sources/route.ts`
- Create: `src/app/(payload)/api/catechist/sources/[slug]/route.ts`

- [ ] **Step 1: Write the list endpoint**

Write `src/app/(payload)/api/catechist/sources/route.ts`:
```ts
import 'server-only'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { ingestStatus: { equals: 'ingested' } },
    limit: 100,
    sort: 'authorityTier',
    depth: 0,
  })
  return Response.json({
    sources: sources.docs.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      author: s.author,
      year: s.year,
      authorityTier: s.authorityTier,
      chunkCount: s.chunkCount,
      rightsNote: s.rightsNote,
    })),
  })
}
```

- [ ] **Step 2: Write the detail endpoint**

Write `src/app/(payload)/api/catechist/sources/[slug]/route.ts`:
```ts
import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (sources.docs.length === 0) return new Response('Not found', { status: 404 })
  const source = sources.docs[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = (payload.db as any).pool
  const chunks = await pool.query(
    `SELECT id, chunk_index, locator, text FROM tantum.source_chunks
       WHERE source_id = $1 ORDER BY chunk_index ASC LIMIT 500`,
    [source.id],
  )

  return Response.json({
    source: {
      id: source.id,
      title: source.title,
      slug: source.slug,
      author: source.author,
      year: source.year,
      authorityTier: source.authorityTier,
      rightsNote: source.rightsNote,
    },
    chunks: chunks.rows,
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(payload\)/api/catechist/sources
git commit -m "feat(catechist): public read-only sources API (list + per-source chunks)"
```

---

## Task 24: Welcome conversation seeder

**Files:**
- Create: `src/catechist/seed/welcomeConversation.ts`

- [ ] **Step 1: Write the seeder**

Write `src/catechist/seed/welcomeConversation.ts`:
```ts
import 'server-only'
import type { Payload } from 'payload'

export async function ensureWelcomeConversation(payload: Payload, memberId: number): Promise<string | null> {
  // Only create if member has no existing conversations
  const existing = await payload.find({
    collection: 'catechist-conversations',
    where: { member: { equals: memberId } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return null

  const created = await payload.create({
    collection: 'catechist-conversations',
    data: {
      member: memberId,
      title: 'What is Tantum Ergo?',
      archived: false,
      messages: [
        {
          role: 'user',
          content: 'What is Tantum Ergo? What is the Catechist for?',
          createdAt: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: `Tantum Ergo is a digital home for Catholic formation — a Miracle Atlas, a Doctrine library, and this Catechist.

I am bound to citation. Every claim I make rests on a passage I can show you, drawn from Scripture, the Catechism, the Councils, the Encyclicals, the Fathers, and the Doctors of the Church.[^1]

You can ask me about doctrine, Scripture, prayer, the sacraments, moral life, the saints. I will answer plainly, with footnotes, in the depth your question warrants.

When the sources I have read do not let me answer with confidence, I will refuse and show you what I did find. I will never invent.[^2]

Ask me anything.`,
          citations: [
            { chunkId: 'welcome-placeholder-1', locator: 'CCC §80', quotedSpan: 'Sacred Tradition and Sacred Scripture' },
            { chunkId: 'welcome-placeholder-2', locator: 'About this Catechist', quotedSpan: 'I will never invent.' },
          ],
          components: [],
          createdAt: new Date().toISOString(),
        },
      ],
    },
    overrideAccess: true,
  })

  return String(created.id)
}
```

> Note: the welcome's "citations" are intentional placeholders (not validated against `source_chunks`). The frontend renders this conversation as already-saved text without invoking the validator. Real conversations always go through `/api/catechist/ask` and its validation path.

- [ ] **Step 2: Commit**

```bash
git add src/catechist/seed/welcomeConversation.ts
git commit -m "feat(catechist): welcome conversation seeder for first sign-in"
```

---

## Task 25: Auth pages — sign-in, sign-up, forgot-password

**Files:**
- Create: `src/app/(frontend)/sign-in/page.tsx`
- Create: `src/app/(frontend)/sign-up/page.tsx`
- Create: `src/app/(frontend)/sign-in/forgot/page.tsx`

> All three pages use Payload's existing Members auth endpoints (`/api/members/login`, `/api/members`, `/api/members/forgot-password`). Forms POST via fetch (client component) so we keep server-rendered shells.

- [ ] **Step 1: Sign-in page**

Write `src/app/(frontend)/sign-in/page.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/catechist'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Sign-in failed.')
        return
      }
      router.push(next)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm uppercase tracking-widest text-ink-soft italic font-display">Return</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">Sign in</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Returning…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-10 space-y-2 font-mono text-sm text-ink-soft">
        <p><Link href="/sign-in/forgot" className="underline">Forgot your password?</Link></p>
        <p>No account? <Link href="/sign-up" className="underline">Begin here</Link>.</p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Sign-up page**

Write `src/app/(frontend)/sign-up/page.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, roles: ['learner'] }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Sign-up failed.')
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-4xl font-display tracking-tight text-ink">Check your inbox.</h1>
        <p className="mt-6 text-lg text-ink-soft font-display italic">
          We sent a verification link to <span className="not-italic">{email}</span>. Open it to finish creating your account, then return here.
        </p>
        <p className="mt-8 font-mono text-sm">
          <Link href="/sign-in" className="underline">Back to sign in</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm uppercase tracking-widest text-ink-soft italic font-display">Begin</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">Create account</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Display name</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Email</span>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Password</span>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-10 font-mono text-sm text-ink-soft">
        Already have an account? <Link href="/sign-in" className="underline">Sign in</Link>.
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Forgot-password page**

Write `src/app/(frontend)/sign-in/forgot/page.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-display tracking-tight text-ink">Check your inbox.</h1>
        <p className="mt-4 text-ink-soft font-display italic">
          If an account exists for {email}, we sent a reset link.
        </p>
        <p className="mt-8 font-mono text-sm">
          <Link href="/sign-in" className="underline">Back to sign in</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-display tracking-tight text-ink">Forgot password</h1>
      <p className="mt-4 text-ink-soft font-display italic">Enter your email; we'll send a reset link.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <input
          type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
        />
        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Run `pnpm dev`, browse to `http://localhost:3000/sign-up`, create a test account, then check Mailcatcher / SMTP catcher to see the verification email arrives.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/sign-in src/app/\(frontend\)/sign-up
git commit -m "feat(catechist): public sign-in / sign-up / forgot-password pages"
```

---

## Task 26: Email-link landing pages — verify-email + reset-password

**Files:**
- Create: `src/app/(frontend)/account/verify-email/page.tsx`
- Create: `src/app/(frontend)/account/reset-password/page.tsx`

> The `Members` collection email templates already point to `/account/verify-email?token=…` and `/account/reset-password?token=…`.

- [ ] **Step 1: Verify-email page**

Write `src/app/(frontend)/account/verify-email/page.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [state, setState] = useState<'verifying' | 'ok' | 'error'>('verifying')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Missing verification token.')
      return
    }
    ;(async () => {
      const r = await fetch(`/api/members/verify/${encodeURIComponent(token)}`, { method: 'POST' })
      if (!r.ok) {
        setState('error')
        setMessage('This verification link is invalid or has expired.')
        return
      }
      setState('ok')
      setTimeout(() => router.push('/sign-in?verified=1&next=/catechist'), 1500)
    })()
  }, [token, router])

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      {state === 'verifying' && (
        <p className="font-display italic text-ink-soft">Verifying…</p>
      )}
      {state === 'ok' && (
        <>
          <h1 className="text-3xl font-display tracking-tight text-ink">Verified.</h1>
          <p className="mt-4 font-display italic text-ink-soft">Sending you to sign in…</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-3xl font-display tracking-tight text-ink">Verification failed.</h1>
          <p className="mt-4 font-display italic text-ink-soft">{message}</p>
          <p className="mt-8 font-mono text-sm">
            <Link href="/sign-up" className="underline">Try signing up again</Link>
          </p>
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Reset-password page**

Write `src/app/(frontend)/account/reset-password/page.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Reset failed.')
        return
      }
      router.push('/sign-in?reset=1')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-display tracking-tight text-ink">Set a new password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">New password</span>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Confirm</span>
          <input
            type="password" required minLength={8} value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Setting…' : 'Set password'}
        </button>
      </form>

      <p className="mt-10 font-mono text-sm text-ink-soft">
        <Link href="/sign-in" className="underline">Back to sign in</Link>
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/account/verify-email src/app/\(frontend\)/account/reset-password
git commit -m "feat(catechist): account verify-email + reset-password landing pages"
```

---

## Task 27: Catechist app shell — layout + sidebar

**Files:**
- Create: `src/app/(frontend)/catechist/layout.tsx`
- Rewrite: `src/app/(frontend)/catechist/page.tsx`
- Create: `src/app/(frontend)/catechist/components/sidebar.tsx`

- [ ] **Step 1: Layout — auth gate + chrome**

Write `src/app/(frontend)/catechist/layout.tsx`:
```tsx
import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { Sidebar } from './components/sidebar'

export const dynamic = 'force-dynamic'

export default async function CatechistLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') {
    redirect('/sign-in?next=/catechist')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(auth.user as any)._verified) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-3xl font-display tracking-tight text-ink">Almost there.</h1>
        <p className="mt-4 font-display italic text-ink-soft">
          Please verify your email to enter the Catechist. Check your inbox for the link we sent.
        </p>
      </main>
    )
  }

  // Fetch conversations for sidebar
  const conversations = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: auth.user.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user: auth.user,
  })

  return (
    <div className="flex min-h-screen bg-vellum">
      <Sidebar
        conversations={conversations.docs.map((c) => ({
          id: String(c.id),
          title: c.title,
          updatedAt: c.updatedAt as string,
        }))}
        member={{ id: auth.user.id as number, displayName: ((auth.user as { displayName?: string }).displayName) ?? 'Friend' }}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Sidebar component**

Write `src/app/(frontend)/catechist/components/sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export interface SidebarConversation {
  id: string
  title: string
  updatedAt: string
}

interface Props {
  conversations: SidebarConversation[]
  member: { id: number; displayName: string }
}

function bucket(d: Date): 'Today' | 'This week' | 'Earlier' {
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 86400000
  if (diff < 1) return 'Today'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

export function Sidebar({ conversations, member }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const grouped = useMemo(() => {
    const out: Record<'Today' | 'This week' | 'Earlier', SidebarConversation[]> = {
      Today: [], 'This week': [], Earlier: [],
    }
    for (const c of conversations) out[bucket(new Date(c.updatedAt))].push(c)
    return out
  }, [conversations])

  async function newInquiry() {
    const r = await fetch('/api/catechist/conversations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    if (r.ok) {
      const { id } = await r.json()
      router.push(`/catechist/c/${id}`)
    }
  }

  async function signOut() {
    await fetch('/api/members/logout', { method: 'POST', credentials: 'include' })
    router.push('/sign-in')
  }

  return (
    <aside
      className={`${collapsed ? 'w-14' : 'w-72'} hidden md:flex flex-col border-r border-ink/10 bg-vellum-deep transition-[width] duration-200`}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-ink/10">
        {!collapsed && <Link href="/catechist" className="font-display italic tracking-tight text-ink">Catechist</Link>}
        <button onClick={() => setCollapsed((v) => !v)} className="font-mono text-xs uppercase text-ink-soft px-2" aria-label="Toggle sidebar">
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <>
          <button onClick={newInquiry} className="m-3 border border-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors">
            + New inquiry
          </button>

          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
            {(['Today', 'This week', 'Earlier'] as const).map((label) =>
              grouped[label].length > 0 ? (
                <section key={label}>
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ink-soft px-1 mb-2">{label}</h3>
                  <ul className="space-y-1">
                    {grouped[label].map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/catechist/c/${c.id}`}
                          className="block px-2 py-1.5 text-sm font-display italic text-ink hover:bg-parchment/40 rounded truncate"
                        >
                          {c.title || 'Untitled'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null,
            )}
          </nav>

          <div className="border-t border-ink/10 px-3 py-3 space-y-2">
            <Link href="/catechist/sources" className="block font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">Sources</Link>
            <Link href="/catechist/account" className="block font-mono text-xs text-ink truncate">{member.displayName}</Link>
            <button onClick={signOut} className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">Sign out</button>
          </div>
        </>
      )}
    </aside>
  )
}
```

- [ ] **Step 3: Rewrite the index page (empty state / latest conversation redirect)**

Replace `src/app/(frontend)/catechist/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { ensureWelcomeConversation } from '../../../catechist/seed/welcomeConversation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Catechist — Tantum Ergo' }

export default async function CatechistRoot({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') redirect('/sign-in?next=/catechist')

  // First sign-in: create welcome conversation
  if (sp.welcome === '1') {
    const id = await ensureWelcomeConversation(payload, auth.user.id as number)
    if (id) redirect(`/catechist/c/${id}`)
  }

  // Otherwise: redirect to most-recent conversation, or empty state
  const recent = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: auth.user.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user: auth.user,
  })
  if (recent.docs.length > 0) redirect(`/catechist/c/${recent.docs[0].id}`)

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="font-display italic text-ink-soft text-sm tracking-widest uppercase">Catechist</p>
      <h1 className="mt-2 text-5xl font-display tracking-tight text-ink leading-none">Ask anything.</h1>
      <p className="mt-6 text-lg font-display italic text-ink-soft">
        Click <em>+ New inquiry</em> in the sidebar to begin.
      </p>
    </main>
  )
}
```

- [ ] **Step 4: Manual smoke**

`pnpm dev`, sign in with the verified test account, browse to `/catechist`. Should see sidebar (empty for new user) and the empty-state main pane.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/catechist
git commit -m "feat(catechist): app shell — auth-gated layout + sidebar + empty state"
```

---

## Task 28: Conversation route + composer + streaming integration

**Files:**
- Create: `src/app/(frontend)/catechist/c/[id]/page.tsx`
- Create: `src/app/(frontend)/catechist/components/conversation.tsx`
- Create: `src/app/(frontend)/catechist/components/composer.tsx`
- Create: `src/app/(frontend)/catechist/components/message.tsx`
- Create: `src/app/(frontend)/catechist/components/footnotes.tsx`

- [ ] **Step 1: Server component — page**

Write `src/app/(frontend)/catechist/c/[id]/page.tsx`:
```tsx
import { notFound, redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { Conversation } from '../../components/conversation'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') redirect('/sign-in?next=/catechist')

  let conv
  try {
    conv = await payload.findByID({
      collection: 'catechist-conversations',
      id,
      overrideAccess: false,
      user: auth.user,
    })
  } catch {
    notFound()
  }

  return (
    <Conversation
      conversationId={String(conv.id)}
      title={conv.title}
      initialMessages={(conv.messages ?? []).map((m, i) => ({
        id: `m-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        citations: (m.citations ?? []) as any[],
      }))}
    />
  )
}
```

- [ ] **Step 2: Conversation component (client, useChat)**

Write `src/app/(frontend)/catechist/components/conversation.tsx`:
```tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { useState } from 'react'
import { Composer } from './composer'
import { Message, type StoredMessage } from './message'

interface Props {
  conversationId: string
  title: string
  initialMessages: StoredMessage[]
}

export function Conversation({ conversationId, title, initialMessages }: Props) {
  const [, setLocalTitle] = useState(title)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/catechist/ask',
    id: conversationId,
    body: { conversationId },
    initialMessages: initialMessages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
  })

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 bg-vellum/95 backdrop-blur border-b border-ink/10 px-6 py-3">
        <h1 className="font-display italic text-ink truncate">{title}</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => {
          const stored = initialMessages[i]
          return (
            <Message
              key={m.id}
              role={m.role as 'user' | 'assistant'}
              content={m.content}
              citations={stored?.citations ?? []}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              toolInvocations={(m as any).toolInvocations ?? []}
            />
          )
        })}
        {isLoading && <p className="font-display italic text-ink-soft text-sm mt-2">The Catechist is reading…</p>}
        {error && <p className="text-rubric font-display italic text-sm mt-2">Connection interrupted. Try again.</p>}
      </main>

      <Composer
        input={input}
        onChange={handleInputChange}
        onSubmit={(e) => {
          handleSubmit(e)
          // Title becomes first question if currently default
          if (initialMessages.length === 0) setLocalTitle(input.slice(0, 60))
        }}
        disabled={isLoading}
        placeholder={initialMessages.length === 0 ? 'Ask the Catechist…' : 'Ask another…'}
      />
    </div>
  )
}
```

- [ ] **Step 3: Composer**

Write `src/app/(frontend)/catechist/components/composer.tsx`:
```tsx
'use client'

interface Props {
  input: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
  placeholder: string
}

export function Composer({ input, onChange, onSubmit, disabled, placeholder }: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 bg-vellum/95 backdrop-blur border-t border-ink/10 px-6 py-4"
    >
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <textarea
          value={input}
          onChange={onChange}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ;(e.target as HTMLTextAreaElement).form?.requestSubmit()
            }
          }}
          className="flex-1 resize-none border-b border-ink/30 bg-transparent px-0 py-2 text-lg font-display italic text-ink placeholder:text-ink-soft/60 outline-none focus:border-rubric disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="border border-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum disabled:opacity-30 transition-colors"
        >
          Ask
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Message + Footnotes**

Write `src/app/(frontend)/catechist/components/message.tsx`:
```tsx
'use client'

import { ScriptureCard } from './cards/scripture-card'
import { CatechismCard } from './cards/catechism-card'
import { SourcePreviewCard } from './cards/source-preview-card'
import { CitationTraceCard } from './cards/citation-trace-card'
import { Footnotes } from './footnotes'

export interface StoredCitation {
  chunkId: string
  locator: string
  quotedSpan: string
}

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: StoredCitation[]
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  citations: StoredCitation[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolInvocations: any[]
}

export function Message({ role, content, citations, toolInvocations }: Props) {
  if (role === 'user') {
    return (
      <div className="my-10">
        <p className="font-display italic text-2xl text-ink leading-snug pl-6 border-l-2 border-rubric">
          {content}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6">
      <div className="font-display text-lg leading-relaxed text-ink whitespace-pre-wrap">
        {content}
      </div>

      <div className="mt-6 space-y-3">
        {toolInvocations.map((inv, i) => {
          const args = inv.args ?? inv.input ?? {}
          if (inv.toolName === 'scriptureCard') return <ScriptureCard key={i} {...args} />
          if (inv.toolName === 'catechismCard') return <CatechismCard key={i} {...args} />
          if (inv.toolName === 'sourcePreviewCard') return <SourcePreviewCard key={i} {...args} />
          if (inv.toolName === 'citationTraceCard') return <CitationTraceCard key={i} {...args} />
          return null
        })}
      </div>

      {citations.length > 0 && <Footnotes citations={citations} />}

      <hr className="border-parchment mt-8" />
    </div>
  )
}
```

Write `src/app/(frontend)/catechist/components/footnotes.tsx`:
```tsx
import type { StoredCitation } from './message'

export function Footnotes({ citations }: { citations: StoredCitation[] }) {
  return (
    <ol className="mt-8 font-mono text-xs text-ink-soft space-y-1.5 list-decimal list-inside">
      {citations.map((c, i) => (
        <li key={i}>
          <span className="text-ink">{c.locator}</span>
          {c.quotedSpan && <span className="ml-2 italic">— "{c.quotedSpan.slice(0, 120)}{c.quotedSpan.length > 120 ? '…' : ''}"</span>}
        </li>
      ))}
    </ol>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/catechist/c src/app/\(frontend\)/catechist/components
git commit -m "feat(catechist): conversation route + composer + message + footnotes (useChat)"
```

---

## Task 29: Generative card components (4 cards)

**Files:**
- Create: `src/app/(frontend)/catechist/components/cards/scripture-card.tsx`
- Create: `src/app/(frontend)/catechist/components/cards/catechism-card.tsx`
- Create: `src/app/(frontend)/catechist/components/cards/source-preview-card.tsx`
- Create: `src/app/(frontend)/catechist/components/cards/citation-trace-card.tsx`

- [ ] **Step 1: Scripture card**

Write `src/app/(frontend)/catechist/components/cards/scripture-card.tsx`:
```tsx
'use client'

interface Props {
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
  quotedText?: string
  chunkId?: string
}

export function ScriptureCard({ book, chapter, verseStart, verseEnd, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-lapis pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        Scripture · {book} {chapter}:{verseStart}{verseEnd ? `–${verseEnd}` : ''}
      </figcaption>
      <blockquote className="mt-1 font-display italic text-ink leading-relaxed">
        {quotedText}
      </blockquote>
      <p className="mt-1 font-mono text-[10px] text-ink-soft">Douay-Rheims</p>
    </figure>
  )
}
```

- [ ] **Step 2: Catechism card**

Write `src/app/(frontend)/catechist/components/cards/catechism-card.tsx`:
```tsx
'use client'

interface Props {
  catechism?: 'CCC' | 'Roman Catechism'
  paragraph?: string
  quotedText?: string
  chunkId?: string
}

export function CatechismCard({ catechism, paragraph, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-rubric pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        {catechism === 'Roman Catechism' ? 'Roman Catechism' : 'Catechism'} · {paragraph}
      </figcaption>
      <blockquote className="mt-1 font-display text-ink leading-relaxed">
        {quotedText}
      </blockquote>
    </figure>
  )
}
```

- [ ] **Step 3: Source preview card**

Write `src/app/(frontend)/catechist/components/cards/source-preview-card.tsx`:
```tsx
'use client'

interface Props {
  sourceTitle?: string
  author?: string
  year?: number
  locator?: string
  quotedText?: string
  chunkId?: string
}

export function SourcePreviewCard({ sourceTitle, author, year, locator, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-gilt pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        {sourceTitle}{author ? ` · ${author}` : ''}{year ? ` · ${year}` : ''}
      </figcaption>
      <blockquote className="mt-1 font-display italic text-ink leading-relaxed">
        {quotedText}
      </blockquote>
      <p className="mt-1 font-mono text-[10px] text-ink-soft">{locator}</p>
    </figure>
  )
}
```

- [ ] **Step 4: Citation trace card**

Write `src/app/(frontend)/catechist/components/cards/citation-trace-card.tsx`:
```tsx
'use client'

interface ChainItem { locator: string; note?: string }
interface Props { chain?: ChainItem[] }

export function CitationTraceCard({ chain = [] }: Props) {
  if (chain.length < 2) return null
  return (
    <aside className="my-4 border border-ink/20 px-4 py-3 bg-vellum-deep/40">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">Citation lineage</p>
      <ol className="flex flex-wrap items-center gap-2 text-sm font-display italic text-ink">
        {chain.map((step, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="border-b border-ink/30">{step.locator}</span>
            {step.note && <span className="text-xs text-ink-soft not-italic font-mono">({step.note})</span>}
            {i < chain.length - 1 && <span className="text-ink-soft">→</span>}
          </li>
        ))}
      </ol>
    </aside>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/catechist/components/cards
git commit -m "feat(catechist): four generative card components (Scripture/Catechism/Source/Trace)"
```

---

## Task 30: Sources browse pages

**Files:**
- Create: `src/app/(frontend)/catechist/sources/page.tsx`
- Create: `src/app/(frontend)/catechist/sources/[slug]/page.tsx`

- [ ] **Step 1: Sources list**

Write `src/app/(frontend)/catechist/sources/page.tsx`:
```tsx
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export const metadata = { title: 'Sources — Catechist' }

const TIER_LABEL: Record<string, string> = {
  scripture: 'Scripture',
  council: 'Council',
  catechism: 'Catechism',
  encyclical: 'Encyclical',
  father: 'Father',
  theologian: 'Theologian',
  other: 'Other',
}

export default async function SourcesPage() {
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { ingestStatus: { equals: 'ingested' } },
    limit: 200,
    depth: 0,
  })

  const grouped = new Map<string, typeof sources.docs>()
  for (const s of sources.docs) {
    const key = s.authorityTier as string
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(s)
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Catechist · Corpus</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">What the Catechist has read</h1>

      <div className="mt-12 space-y-12">
        {(['scripture', 'council', 'catechism', 'encyclical', 'father', 'theologian', 'other'] as const).map((tier) =>
          (grouped.get(tier) ?? []).length > 0 ? (
            <section key={tier}>
              <h2 className="font-display italic text-2xl text-ink mb-4">{TIER_LABEL[tier]}</h2>
              <ul className="divide-y divide-ink/10">
                {grouped.get(tier)!.map((s) => (
                  <li key={s.id} className="py-4">
                    <Link href={`/catechist/sources/${s.slug}`} className="block hover:bg-parchment/30 -mx-3 px-3 py-1 rounded transition-colors">
                      <h3 className="font-display text-lg text-ink">{s.title}</h3>
                      <p className="font-mono text-xs text-ink-soft mt-1">
                        {s.author ?? '—'}{s.year ? ` · ${s.year}` : ''} · {s.chunkCount ?? 0} passages
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Single source page**

Write `src/app/(frontend)/catechist/sources/[slug]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export const dynamic = 'force-dynamic'

export default async function SourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (sources.docs.length === 0) notFound()
  const source = sources.docs[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = (payload.db as any).pool
  const chunks = await pool.query(
    `SELECT id, locator, text FROM tantum.source_chunks
       WHERE source_id = $1 ORDER BY chunk_index ASC LIMIT 200`,
    [source.id],
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{source.authorityTier}</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">{source.title}</h1>
      <p className="mt-2 font-display italic text-ink-soft">
        {source.author ?? ''}{source.year ? ` · ${source.year}` : ''}
      </p>
      {source.rightsNote && <p className="mt-4 font-mono text-xs text-ink-soft">{source.rightsNote}</p>}

      <div className="mt-12 space-y-6">
        {chunks.rows.map((c: { id: string; locator: string; text: string }) => (
          <article key={c.id} id={`chunk-${c.id}`} className="border-l-2 border-parchment pl-4">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{c.locator}</p>
            <p className="mt-1 font-display text-ink leading-relaxed">{c.text}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/catechist/sources
git commit -m "feat(catechist): public Sources browse + single-source pages"
```

---

## Task 31: Refusal + rate-limit UX

**Files:**
- Create: `src/app/(frontend)/catechist/components/refusal.tsx`
- Modify: `src/app/(frontend)/catechist/components/conversation.tsx`

- [ ] **Step 1: Refusal component**

Write `src/app/(frontend)/catechist/components/refusal.tsx`:
```tsx
'use client'

import { SourcePreviewCard } from './cards/source-preview-card'

export interface RefusalChunk {
  id: string
  locator: string
  text: string
  authorityTier?: string
}

export function Refusal({ message, top3 }: { message: string; top3: RefusalChunk[] }) {
  return (
    <div className="my-6" aria-live="polite">
      <p className="font-display italic text-ink leading-relaxed">{message}</p>
      <div className="mt-4 space-y-3">
        {top3.map((c) => (
          <SourcePreviewCard
            key={c.id}
            sourceTitle={c.locator}
            quotedText={c.text.slice(0, 240) + (c.text.length > 240 ? '…' : '')}
            locator={c.locator}
            chunkId={c.id}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire rate-limit and refusal handling into Conversation**

In `src/app/(frontend)/catechist/components/conversation.tsx`, replace the `error` handling block with:
```tsx
{error && (
  <p className="text-rubric font-display italic text-sm mt-2">
    {error.message?.includes('rate_limited')
      ? "You've reached today's inquiry limit. The Catechist returns at midnight."
      : 'Connection interrupted. Try again.'}
  </p>
)}
```

(The full refusal payload — `top3` — is rendered as part of the assistant message when the model returns `citations: []`. The validator's refusal goes through the same persistence path, so the next page render shows the saved refusal as a normal assistant turn. No separate streaming path needed for v1.0.)

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/catechist/components/refusal.tsx src/app/\(frontend\)/catechist/components/conversation.tsx
git commit -m "feat(catechist): refusal + rate-limit UX"
```

---

## Task 32: Eval set authoring + verification script

**Files:**
- Create: `docs/superpowers/handoffs/catechist-eval-set.md`
- Create: `src/scripts/catechist-eval.ts`

- [ ] **Step 1: Author the 30-question eval set**

Write `docs/superpowers/handoffs/catechist-eval-set.md`:
```markdown
# Catechist eval set (v1.0)

Pre-launch quality gate. Each question lists at least one **expected source slug** that should appear in the top-3 retrieval results. Pass criteria: ≥80% of questions have at least one expected slug in top-3.

Format: `Q | category | expected slugs (any-of)`.

## Seeker tier (8)

1. What do Catholics actually believe about Jesus? | christology | douay-rheims, ccc
2. Why do Catholics pray to saints? | spirituality | ccc, roman-catechism
3. Is the Bible the only authority for Catholics? | ecclesiology | ccc, dei-verbum
4. What happens at Mass? | sacraments | ccc, sacrosanctum-concilium
5. Why do Catholics confess to a priest? | sacraments | ccc, douay-rheims
6. Are Catholics saved by faith or by works? | soteriology | ccc, douay-rheims, veritatis-splendor
7. Why does the Church teach that life begins at conception? | moral | humanae-vitae, ccc
8. What is the Trinity, plainly? | trinity-god | ccc, summa-i

## RCIA / Confirmation tier (8)

9. What is sanctifying grace? | soteriology | ccc, summa-i
10. Why is Baptism necessary? | sacraments | ccc, douay-rheims
11. What is the difference between mortal and venial sin? | moral | ccc, veritatis-splendor
12. Who can be baptized? | sacraments | ccc, roman-catechism
13. What is the Real Presence in the Eucharist? | sacraments | ccc, trent-canons, douay-rheims
14. What does the Catechism say about purgatory? | eschatology | ccc, roman-catechism
15. Why must I love my enemy? | moral | douay-rheims, ccc
16. What is the role of conscience in moral decisions? | moral | veritatis-splendor, ccc

## Practicing-Catholic tier (8)

17. How should I pray when I feel nothing? | spirituality | ccc, augustine-confessions
18. What does the Church say about beauty in the liturgy? | spirituality | sacrosanctum-concilium, ccc
19. How do I make a good examination of conscience? | moral | ccc, roman-catechism
20. What is the difference between the Mass and Adoration? | sacraments | ccc
21. What does Lumen Gentium say about the universal call to holiness? | ecclesiology | lumen-gentium, ccc
22. Why do we venerate Mary? | mariology | ccc, lumen-gentium
23. What is fasting for? | spirituality | ccc, douay-rheims
24. What does the Church teach about suffering? | spirituality | salvifici-doloris, ccc, augustine-confessions

## Theology-student tier (6)

25. Distinguish substantia and accidentia in the Eucharist per Aquinas. | sacraments | summa-iii, trent-canons
26. What is the difference between the divine missions and the divine processions? | trinity-god | summa-i
27. How does Veritatis Splendor articulate the relationship between freedom and truth? | moral | veritatis-splendor
28. What is hypostatic union? Cite Chalcedon and Aquinas. | christology | summa-iii
29. Per Augustine, what is the relationship between time and eternity? | trinity-god | augustine-confessions
30. What is Trent's definition of justification? | soteriology | trent-canons, ccc
```

- [ ] **Step 2: Eval script**

Write `src/scripts/catechist-eval.ts`:
```ts
import { getPayload } from 'payload'
import { readFile } from 'fs/promises'
import path from 'path'
import config from '../payload.config'
import { retrieveContext } from '../catechist/retrieve'

interface EvalQuestion { q: string; expected: string[] }

function parseEvalSet(md: string): EvalQuestion[] {
  const questions: EvalQuestion[] = []
  for (const line of md.split('\n')) {
    const m = line.match(/^\s*\d+\.\s+(.+?)\s+\|\s+(.+?)\s+\|\s+(.+?)\s*$/)
    if (!m) continue
    const [, q, , slugs] = m
    questions.push({ q, expected: slugs.split(',').map((s) => s.trim()) })
  }
  return questions
}

async function main() {
  const payload = await getPayload({ config })
  const md = await readFile(path.resolve('docs/superpowers/handoffs/catechist-eval-set.md'), 'utf-8')
  const questions = parseEvalSet(md)
  payload.logger.info(`Loaded ${questions.length} eval questions.`)

  let passed = 0
  for (let i = 0; i < questions.length; i++) {
    const { q, expected } = questions[i]
    const top = await retrieveContext(payload, { questionWithContext: q, topK: 3 })
    const slugsInResult = new Set<string>()
    for (const c of top) {
      const src = await payload.findByID({ collection: 'sources', id: c.sourceId, depth: 0 })
      slugsInResult.add(src.slug)
    }
    const ok = expected.some((s) => slugsInResult.has(s))
    console.log(`${ok ? '✓' : '✗'} [${i + 1}] ${q}`)
    if (!ok) console.log(`     expected any of: ${expected.join(', ')}; got: ${[...slugsInResult].join(', ')}`)
    if (ok) passed += 1
  }

  const pct = (passed / questions.length) * 100
  console.log(`\n${passed}/${questions.length} (${pct.toFixed(0)}%) passed.`)
  process.exit(pct >= 80 ? 0 : 1)
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 3: Run after corpus is ingested**

Run: `pnpm catechist:eval`
Expected: ≥80% pass. If lower, the issues to look at (in order): missing source ingestion (some `expected` slugs not in DB), chunker over-fragmentation (passages too short for kNN), concept tagging mis-classifying the question, authority weights pulling away from the right tier.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/handoffs/catechist-eval-set.md src/scripts/catechist-eval.ts
git commit -m "feat(catechist): 30-question eval set + verification script (>=80% top-3 pass)"
```

---

## Task 33: Final integration pass

**Files:** various — final wire-up + manual verification.

- [ ] **Step 1: Add Catechist link to site header**

Open `src/app/(frontend)/components/site-header-client.tsx`. Find where the existing nav links are rendered (Atlas, Doctrine, etc.) and add a Catechist link if not already present. The label always reads "Catechist"; clicking redirects to `/sign-in` for unauthenticated users (already handled by `/catechist` layout).

- [ ] **Step 2: Update `.env.example`**

Open `.env.example`. Confirm `GOOGLE_AI_API_KEY` is documented; if not, add:
```
# Required for Catechist (embeddings + answer generation + concept tagging)
GOOGLE_AI_API_KEY=
```

- [ ] **Step 3: Ingest the seed corpus**

For each source in spec §4.1:
1. Open studio → Sources → Create new
2. Fill: title, slug, author, year, authorityTier, locatorFormat, rightsNote, _isSample=false
3. Upload the file (PDF/DOCX/TXT) to Media
4. Save → afterChange hook fires ingestion in background; watch payload logs for `[ingest:N] DONE — N chunks`

Order of operations (prioritized for eval set passing):
1. Douay-Rheims Bible (`bible` format) — biggest, quickest validation
2. CCC (`ccc`)
3. Roman Catechism (`roman-catechism`)
4. Council of Trent canons (`council-canon`)
5. Vatican II documents (`encyclical-section`, one per document)
6. Encyclicals (`encyclical-section`, one per)
7. Summa I + III (`summa`)
8. Augustine + Chrysostom (`father-book-chapter`)

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
pnpm typecheck
pnpm lint
```
Expected: all green.

- [ ] **Step 5: Run eval set**

```bash
pnpm catechist:eval
```
Expected: ≥80% pass. Tune corpus / regex / re-rank weights if needed.

- [ ] **Step 6: Manual end-to-end smoke**

Sign up → verify email → sign in → ask 5 questions across the 4 user tiers. Verify:
- Streaming works
- Footnotes render
- Cards render (Scripture / Catechism / Source / Trace)
- Sidebar shows the conversation
- Sign out works
- Rate limit behaviour: set Settings.catechistRateLimit.dailyLimit=2 in studio; ask 3 questions; third should return 429 with the rate-limit message
- Refusal: ask something the corpus can't support (e.g., "What's the weather today?"); verify refusal renders without inventing an answer

- [ ] **Step 7: Commit final integration touches**

```bash
git add -p   # interactively stage only the header link + env example tweaks
git commit -m "feat(catechist): wire site-header link + document GOOGLE_AI_API_KEY"
```

- [ ] **Step 8: Tag the launch**

```bash
git tag -a catechist-v1.0 -m "Catechist v1.0 — graph-aware RAG + auth + generative UI"
```

---

## Open items (out of plan, into v1.1)

- Multimodal image-embedding ingestion (artwork retrieval)
- LLM-extracted concepts beyond curated 40
- Conversation export, sharing, bookmarking
- Voice input/output
- Cross-conversation search
- Rest of the Summa beyond Prima/Tertia Pars
- Per-conversation citation graph visualizer

These were explicitly deferred in the design spec §14.




