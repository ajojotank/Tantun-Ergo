# Catechist · v1.0 — design spec

> **Status:** approved by user, ready for implementation plan
> **Authored:** 2026-05-08
> **Target:** v1.0 ship in 3 days (~2026-05-11)
> **Predecessor:** [2026-05-04 Tantum Ergo v1.0 spec](2026-05-04-tantum-ergo-v1-design.md) — this document supersedes §4.4 (Catechist) and §6.1 (Catechist pipeline) of that spec, and amends the "no member accounts" stance for the Catechist surface only.

---

## 1. Vision and scope

### Mission

> *An interlocutor bound to citation. It quotes the Magisterium; it never invents.*

A signed-in conversational surface where Catholics (and seekers) ask doctrinal, scriptural, devotional, and theological questions and receive **footnoted, citation-bound answers** drawn from a curated corpus of magisterial and doctrinal sources. Multi-turn within a conversation. Generative inline cards (Scripture, Catechism, source previews, citation traces) make answers richer than plain text without compromising the citation contract.

### What v1.0 is

A **complete, polished Catechist** with: real auth (Members), a curated ~5,000-passage seed corpus across Scripture / Magisterium / Encyclicals / Fathers / Aquinas, a **graph-aware retrieval pipeline** (semantic search + citation expansion + authority and concept re-ranking), Gemini-generated answers streamed via Vercel AI SDK with inline rich components, a sidebar of past conversations, and a small evaluation set run before launch.

### What v1.0 is NOT (deferred to v1.1)

- Multimodal artwork retrieval (the embedding model is multimodal-capable; we just don't embed images yet)
- LLM-extracted concept expansion beyond the curated 40-concept seed
- The full Summa beyond Prima Pars + Tertia Pars
- Additional Church Fathers beyond Augustine + Chrysostom
- Conversation export, sharing, or bookmarking
- Saved-answer favorites
- Voice input/output
- Locales beyond `en_ZA`

### Audience

Four user tiers, all served by the same UI; depth of answer scales with depth of question:

1. **Curious adult / seeker** — non-Catholic or lapsed, exploring the faith
2. **Confirmation / RCIA candidate** — actively learning, wants citable answers
3. **Practicing Catholic, deepening** — wants substance on prayer, sacraments, moral life
4. **Theology student / catechist** — wants Aquinas-grade rigor with primary-source citations

---

## 2. UX

### 2.1 Layout

```
┌──────────────┬──────────────────────────────────────────┐
│              │                                          │
│  SIDEBAR     │  MAIN PANE                               │
│              │                                          │
│  + New       │  [italic question, indented, rubric ↳]   │
│              │                                          │
│  Today       │  ─────────────────────────                │
│   · Real     │                                          │
│     Presence │  [answer body in display-leaning prose,  │
│   · Trinity  │   with footnote superscripts and inline  │
│              │   rich cards: Scripture, Catechism, etc.] │
│  This week   │                                          │
│   · Confess. │  Footnotes (mono):                       │
│              │   ¹ John 6:53 (Douay-Rheims)             │
│  Earlier     │   ² Catechism of the Catholic Church     │
│   · ...      │     §1374                                │
│              │                                          │
│  [Sources]   │  [Ask another →]                         │
│  [Profile]   │                                          │
│  [Sign out]  │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Desktop (≥md):** sidebar fixed left, 280px, collapsible to 56px (icons only).
**Mobile (<md):** sidebar hidden, hamburger opens drawer (reuses existing `mobile-drawer.tsx` pattern).

### 2.2 Sidebar contents (top to bottom)

- **+ New inquiry** — clears main pane, focuses textarea, creates new conversation on first message
- **Conversation list** — grouped by recency: Today / This week / Earlier. Each item: first ~40 chars of the user's first question, italic, truncated. Click → loads that conversation in main pane.
- **Sources** (link) — opens a read-only browse view of the corpus (`/catechist/sources`) — list of all ingested Sources with title, author, year, type, paragraph count. Lets users see what the Catechist actually knows.
- **Profile** — user's name, link to `/catechist/account` (basic — display name, email, sign out)
- **Sign out** — logs out, returns to `/sign-in`

### 2.3 Main pane — the conversation

- **Header (sticky top, slim)** — conversation title (auto-generated from first question via Gemini Flash, editable inline), small "delete" icon (trash), rate-limit indicator (e.g. `47 / 50 inquiries today`)
- **Conversation body** — vertical scroll. Each Q&A pair:
  - **Question** — italic display type (Cormorant), indented, left-border in `rubric`, max-width prose (~720px)
  - **1px divider** in `parchment`
  - **Answer body** — display-leaning prose. Footnote superscripts after every cited claim. Inline rich cards (see §2.4) render between paragraphs.
  - **Footnotes** — mono type, listed at bottom of the answer block. Format: `¹ Catechism of the Catholic Church §1374` or `² John 6:53 (Douay-Rheims)`. Each is a link — clicking opens the source preview card inline.
- **Composer (sticky bottom)** — single-line growing textarea with display-italic placeholder ("*Ask another…*" if mid-conversation, "*Ask the Catechist…*" if new). Enter to submit (Shift+Enter for newline). Submit button magnetic on hover.
- **Streaming behavior** — answer streams token-by-token. Footnotes appear as the answer references them. Cards render as the model emits the corresponding tool call.

### 2.4 Generative inline cards (the four v1.0 components)

All cards stream in via Vercel AI SDK `streamUI` tool calls. Each card has a defined typed-tool signature.

| Card | When it renders | Contents |
|---|---|---|
| **Scripture** | Model cites a Bible passage | Verse text (Douay-Rheims), book/chapter/verse badge, translation note. "Show context" expander → 3 verses before/after. |
| **Catechism** | Model cites a CCC §nnnn or Roman Catechism paragraph | Full paragraph text, section heading breadcrumb (e.g. *Part Two · Section Two · Chapter One · Article 3 · §1374*), "Show §1373 / §1375" tiny prev/next links. |
| **Source preview** | Model cites any other doc (encyclical, council, Father, Aquinas) | Title, author, year, type badge, the quoted span in italics, "Open source" link → `/catechist/sources/[slug]#chunk-[id]` |
| **Citation trace** | User clicks a footnote OR the model decides the lineage matters | Inline expander showing 1-hop citation chain: e.g. *CCC §1374 cites John 6:53 cites (in Trent canon 1, On the Eucharist) the Real Presence of Christ*. Visualized as a small left-to-right chain with hover-to-preview. |

**Mobile cards:** full-width, less padding, "Show context" / "Show prev/next" become bottom-sheets.

### 2.5 Refusal behavior

When retrieval + generation cannot produce ≥1 valid citation:

- Answer body replaced with: *"I cannot answer this with confidence from the sources I've read. Here are the closest passages I found —"*
- Below: top-3 retrieval results rendered as **Source preview** cards
- No "answer" prose; no fabricated synthesis
- Refusal counts against rate limit but is logged separately (`tantum.catechist_refusals`) so we can see what kinds of questions the corpus doesn't cover and prioritize ingestion expansions in v1.1
- Refusal text uses `aria-live="polite"` so screen readers announce it

**Validation that triggers refusal:**
1. Model returns no `citations[]` in the structured output, OR
2. Any cited `chunkId` doesn't exist in `tantum.source_chunks`, OR
3. Any cited `quotedSpan` is not a substring of the actual chunk text (anti-hallucination check)

### 2.6 Loading + error states

- **Submitting** — composer shows a small "*The Catechist is reading…*" italic line below the textarea; textarea disabled until response complete or error
- **Network error mid-stream** — partial answer kept, error toast: "Connection interrupted. Try again?" with retry button
- **Server error** — full message: "*The Catechist could not respond just now.*" with retry. Logged to server.
- **Rate limit hit** — composer disabled; replaces placeholder with: "*You've reached today's inquiry limit. The Catechist returns at midnight.*"

---

## 3. Auth

### 3.1 Members collection (already fully configured)

The `Members` collection at [src/collections/Members.ts](../../../src/collections/Members.ts) is **already production-grade**: Payload `auth` block configured with 30-day cookie sessions, max-login-attempts 8 with 10-minute lockout, full **email verification** flow (with HTML template pointing to `/account/verify-email?token=…`), full **forgot-password** flow (template pointing to `/account/reset-password?token=…`), `displayName`, `avatar` (upload to Media), and `roles: ['admin' | 'instructor' | 'learner']` (default `['learner']`). Access control is already proper: Members read/update only themselves; Stewards admin all.

**No collection changes required for v1.0 Catechist.** The only optional addition is a `lastSeenAt` field updated server-side on each ask — useful for analytics, not load-bearing. Skip if it costs time.

**Email verification IS required** (this is a deliberate change from my earlier mid-conversation note — verification is already wired in the existing collection, so we use it; defending the corpus from sign-up abuse is worth the friction). Members must verify before `/api/catechist/ask` succeeds — middleware checks `req.user._verified`. Unverified Members hitting `/catechist` see a "Check your inbox" notice with a "resend verification" button.

### 3.2 Public auth pages

URLs are split: the Catechist's "front door" is `/sign-in` and `/sign-up`; the **post-email-link landing pages** match the URLs already baked into the existing email templates (`/account/verify-email` and `/account/reset-password`).

| route | purpose | content |
|---|---|---|
| `/sign-in` | Sign in | email + password form, "Forgot password" link → `/sign-in/forgot`, link to `/sign-up`. Editorial design: vellum bg, display-italic eyebrow ("*Return*"), sans body. On submit: POST to Payload's `/api/members/login`. |
| `/sign-up` | Create account | email + password + display name. Same visual language. On submit: POST to Payload's `/api/members` (create) → triggers verification email. UI shows "Check your inbox to verify your email" success state; user is **not** auto-signed-in (verification required first). |
| `/sign-in/forgot` | Request password reset | email field; POSTs to Payload's `/api/members/forgot-password` → triggers reset email. |
| `/account/reset-password?token=…` | Set new password (landing from email) | password + confirm; POST to Payload's `/api/members/reset-password`; on success redirect to `/sign-in` with success flash. |
| `/account/verify-email?token=…` | Email verification (landing from email) | Calls Payload's `/api/members/verify/[token]`; on success: auto-sign-in (token grants session) and redirect to `/catechist?welcome=1`. On failure (expired/used token): show "this verification link has expired" with "resend" button. |

**Welcome state on first sign-in (`?welcome=1`):**
A single seed conversation pre-populated in the sidebar titled *"What is Tantum Ergo?"* with a hand-authored short answer-with-citations explaining the Catechist's purpose, how it's bound to citation, and what to ask. Removable.

### 3.3 Auth gate behavior

- Visiting `/catechist` while signed-out → redirect to `/sign-in?next=/catechist`
- Visiting `/catechist` while signed-in but unverified → render an "*almost there — please verify your email*" notice with a "resend verification" button (no Catechist UI loaded)
- API routes under `/api/catechist/*` return 401 if no valid session, 403 if session valid but `_verified: false`
- The Catechist nav link in the site header shows "Catechist" always; clicking while signed-out routes through `/sign-in`

### 3.4 What stays open

The rest of the site (Atlas, Doctrine, Reading, Manifesto, Credits, home) remains fully open per the May-4 spec. Only `/catechist` and `/api/catechist/*` are gated.

---

## 4. The seed corpus

### 4.1 Sources at launch (~5,000 chunks total)

| Source | Authority tier | Locator format | Rights | Notes |
|---|---|---|---|---|
| Douay-Rheims Bible (full) | `scripture` | `John 6:53` | Public domain | The safe Catholic English. Books, chapters, verses parsed. |
| Catechism of the Council of Trent (Roman Catechism) | `catechism` | `Roman Catechism, Part II, Q. 7` | Public domain | Comprehensive doctrinal backbone. |
| Catechism of the Catholic Church | `catechism` | `CCC §1374` | Vatican English text, included with explicit Vatican credit + Credits-page note. **Content team verifies rights before public launch.** | Modern doctrinal expression. |
| Council of Trent — canons & decrees (Schroeder) | `council` | `Trent, Sess. XIII, Canon 1` | Public domain | Definitional doctrinal authority. |
| Vatican II — all 16 documents | `council` | `Lumen Gentium §16` | vatican.va; cited with credit | The 20th-century magisterial corpus. |
| Humanae Vitae (Paul VI) | `encyclical` | `Humanae Vitae §11` | vatican.va; cited with credit | Moral teaching on life. |
| Veritatis Splendor (JPII) | `encyclical` | `Veritatis Splendor §54` | vatican.va; cited with credit | Moral theology. |
| Fides et Ratio (JPII) | `encyclical` | `Fides et Ratio §16` | vatican.va; cited with credit | Faith and reason. |
| Deus Caritas Est (Benedict XVI) | `encyclical` | `Deus Caritas Est §7` | vatican.va; cited with credit | Love. |
| Lumen Fidei (Francis/Benedict) | `encyclical` | `Lumen Fidei §4` | vatican.va; cited with credit | Faith. |
| Augustine — Confessions (Pusey trans.) | `father` | `Confessions, Book VII, Ch. 10` | Public domain (Schaff NPNF) | |
| Augustine — City of God (selections) | `father` | `City of God, Book XIX, Ch. 17` | Public domain | |
| Augustine — De Trinitate (selections) | `father` | `De Trinitate, Book V, Ch. 8` | Public domain | |
| John Chrysostom — selected homilies | `father` | `Chrysostom, Hom. on John, 46` | Public domain (NPNF) | |
| Aquinas — Summa Theologica, Prima Pars | `theologian` | `Summa, I, Q. 32, a. 1` | Public domain (English Dominican translation) | God, Trinity, creation. |
| Aquinas — Summa Theologica, Tertia Pars | `theologian` | `Summa, III, Q. 75, a. 4` | Public domain | Christ + sacraments. |

**Acquisition** — text obtained from public-domain repositories (CCEL, Vatican, New Advent for Aquinas/Fathers). Each source ingested as a single PDF or DOCX upload via the Sources studio, preserving the original document identity.

### 4.2 Authority tiers (used by retrieval re-ranking)

```ts
type AuthorityTier =
  | 'scripture'   // weight 1.00 — Sacred Scripture, the highest
  | 'council'     // weight 0.95 — Ecumenical councils, definitional
  | 'catechism'   // weight 0.85 — Catechisms, authoritative doctrinal expression
  | 'encyclical'  // weight 0.75 — Papal teaching documents
  | 'father'      // weight 0.65 — Church Fathers
  | 'theologian'  // weight 0.55 — Doctors and theologians
  | 'other'       // weight 0.40 — Anything else (devotional, modern, etc.)
```

Weights are multipliers applied to vector similarity during re-ranking (see §6.4).

### 4.3 Concept ontology (curated seed, ~40 concepts)

Hand-authored at design time (in this spec, §4.4 below). Stored as a Payload `Concepts` collection so the content team can extend later. Each concept has: name, definition, parent concept (optional, for taxonomy), and synonyms (for embedding-time matching).

At ingestion, each chunk gets ~3–7 concept tags via Gemini Flash classification against the curated list. Stored in `tantum.source_chunk_concepts` (junction table).

### 4.4 Initial concept list

Authored here, seeded into the `Concepts` collection on first migration:

**Trinity / God**
- Trinity, Father (Person), Son (Person), Holy Spirit (Person), Divine Nature, Hypostatic Union

**Christology**
- Incarnation, Redemption, Resurrection, Real Presence, Two Natures of Christ

**Soteriology / Grace**
- Sanctifying Grace, Actual Grace, Prevenient Grace, Justification, Faith, Hope, Charity

**Sacraments**
- Sacrament (general), Baptism, Confirmation, Eucharist, Confession (Reconciliation), Anointing, Holy Orders, Matrimony

**Moral theology**
- Natural Law, Conscience, Mortal Sin, Venial Sin, Virtue (Cardinal), Virtue (Theological), Beatitudes

**Ecclesiology**
- Church (Mystical Body), Magisterium, Apostolic Succession, Papal Authority, Communion of Saints

**Eschatology**
- Heaven, Hell, Purgatory, Last Judgment, Particular Judgment

**Mariology**
- Mary (Theotokos), Immaculate Conception, Assumption, Perpetual Virginity

**Spirituality**
- Prayer, Liturgy, Lectio Divina, Devotion to the Saints

This list is editable; v1.1 will likely add ~20 more (eg. Predestination, Limbo, Indulgences, Apparitions). LLM-extracted concept expansion is also a v1.1 feature.

---

## 5. Data model

### 5.1 New Payload collections

#### `Sources` (Catechist corpus — extends the May-4 spec collection)

| field | type | notes |
|---|---|---|
| `title` | text | required, e.g. *Catechism of the Catholic Church* |
| `slug` | text | required, unique |
| `author` | text | *Catholic Church*, *Pope John Paul II*, *Augustine of Hippo*, etc. |
| `year` | number | year published / authored |
| `authorityTier` | select | scripture, council, catechism, encyclical, father, theologian, other |
| `locatorFormat` | select | `bible`, `ccc`, `roman-catechism`, `council-canon`, `encyclical-section`, `summa`, `father-book-chapter`, `generic` — drives the citation parser |
| `file` | upload | PDF or DOCX — rel to Media |
| `rightsNote` | textarea | "Public domain (NPNF)", "Vatican English text, used with credit", etc. — surfaced in Credits page |
| `ingestStatus` | select | pending, ingesting, ingested, error (read-only after upload) |
| `chunkCount` | number | computed, read-only |
| `lastIngestedAt` | date | computed, read-only |
| `errorMessage` | textarea | read-only, populated on error |
| `_isSample` | boolean | admin |

Studio sidebar action: **"Ingest"** button on a Source doc. Triggers Payload job (see §6.1).

#### `Concepts` (curated ontology)

| field | type | notes |
|---|---|---|
| `name` | text | required, e.g. *Real Presence* |
| `slug` | text | required, unique |
| `definition` | textarea | one-paragraph definition; used in classification prompt |
| `parent` | relationship | rel to `Concepts`, optional, builds the tree |
| `synonyms` | array | `[{phrase: text}]` — alternate phrasings used in classification ("eucharistic presence", "transubstantiation" etc.) |
| `category` | select | trinity-god, christology, soteriology, sacraments, moral, ecclesiology, eschatology, mariology, spirituality, other |

Seeded from §4.4 list on migration.

#### `CatechistConversations`

| field | type | notes |
|---|---|---|
| `member` | relationship | rel to Members, required, indexed |
| `title` | text | auto-generated from first question via Gemini Flash; editable |
| `messages` | array | `[{role: 'user'\|'assistant', content: text, citations: array, components: json, createdAt: date}]` |
| `createdAt` | date | auto |
| `updatedAt` | date | auto |
| `archived` | boolean | soft-delete flag (default false) |

**Access control:** Members can read/update/delete only their own conversations. Stewards can read all (for support/debugging).

**Indexing:** composite index on `(member, archived, updatedAt DESC)` for sidebar list performance.

### 5.2 Raw tables (Drizzle-managed, in `tantum` schema)

Following the May-4 spec convention, raw tables live in the `tantum` schema, *not* `payload`.

#### `tantum.source_chunks`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE tantum.source_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    integer NOT NULL REFERENCES payload.sources(id) ON DELETE CASCADE,
  chunk_index  integer NOT NULL,
  text         text NOT NULL,
  locator      text NOT NULL,           -- "John 6:53", "CCC §1374", "Summa I, Q. 32, a. 1"
  page_number  integer,
  embedding    vector(1536) NOT NULL,    -- gemini-embedding-2 @ 1536d
  authority_tier text NOT NULL,          -- denormalized from sources.authorityTier for fast filter
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX source_chunks_embedding_idx ON tantum.source_chunks
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX source_chunks_source_idx ON tantum.source_chunks (source_id);
CREATE INDEX source_chunks_authority_idx ON tantum.source_chunks (authority_tier);
```

#### `tantum.source_chunk_citations` (citation graph edges)

```sql
CREATE TABLE tantum.source_chunk_citations (
  id              bigserial PRIMARY KEY,
  from_chunk_id  uuid NOT NULL REFERENCES tantum.source_chunks(id) ON DELETE CASCADE,
  to_locator     text NOT NULL,         -- the cited locator, e.g. "John 6:53"
  to_chunk_id    uuid REFERENCES tantum.source_chunks(id) ON DELETE SET NULL,  -- resolved at ingestion or lazy
  raw_text       text NOT NULL          -- the citation as it appeared in source
);

CREATE INDEX source_chunk_citations_from_idx ON tantum.source_chunk_citations (from_chunk_id);
CREATE INDEX source_chunk_citations_to_chunk_idx ON tantum.source_chunk_citations (to_chunk_id);
CREATE INDEX source_chunk_citations_to_locator_idx ON tantum.source_chunk_citations (to_locator);
```

**Resolution:** on ingestion of any new source, after chunks are inserted, run a resolution pass: for each `source_chunk_citations` row where `to_chunk_id IS NULL`, attempt to resolve `to_locator` against `source_chunks.locator`. Citations to documents not yet ingested remain unresolved (`to_chunk_id IS NULL`); they get re-resolved on later ingestions.

#### `tantum.source_chunk_concepts` (concept tagging)

```sql
CREATE TABLE tantum.source_chunk_concepts (
  chunk_id     uuid NOT NULL REFERENCES tantum.source_chunks(id) ON DELETE CASCADE,
  concept_id   integer NOT NULL REFERENCES payload.concepts(id) ON DELETE CASCADE,
  confidence   real NOT NULL,            -- 0..1, from Gemini Flash classifier
  PRIMARY KEY (chunk_id, concept_id)
);

CREATE INDEX source_chunk_concepts_concept_idx ON tantum.source_chunk_concepts (concept_id);
```

#### `tantum.catechist_rate_limits` (per-user, replaces the per-IP `tantum.rate_limits` for Catechist)

```sql
CREATE TABLE tantum.catechist_rate_limits (
  id           bigserial PRIMARY KEY,
  member_id   integer NOT NULL REFERENCES payload.members(id) ON DELETE CASCADE,
  bucket       text NOT NULL,             -- "ask" (refusals counted separately)
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX catechist_rate_limits_lookup_idx
  ON tantum.catechist_rate_limits (member_id, bucket, created_at DESC);
```

**Cleanup:** Payload job every 30 min, `DELETE WHERE created_at < now() - interval '48 hours'`.

#### `tantum.catechist_refusals` (observability)

```sql
CREATE TABLE tantum.catechist_refusals (
  id              bigserial PRIMARY KEY,
  member_id      integer REFERENCES payload.members(id) ON DELETE SET NULL,
  question        text NOT NULL,
  retrieval_top3 jsonb NOT NULL,         -- the chunks shown as fallback
  reason          text NOT NULL,           -- 'no_citations', 'invalid_chunk_id', 'fabricated_quote'
  created_at      timestamptz DEFAULT now()
);
```

Used by the team to identify ingestion gaps; not surfaced to users.

### 5.3 Globals (additions to existing Settings)

**Settings (Payload Global) — extensions:**
- `catechistRateLimit` group:
  - `dailyLimit: number` — default 50 questions per Member per 24h
  - `refusalMessage: text` — default "*I cannot answer this with confidence from the sources I've read. Here are the closest passages I found —*"

---

## 6. Ingestion pipeline

### 6.1 Trigger

`afterChange` hook on `Sources` collection: when a Source's `file` is added or replaced, enqueue `payload_jobs.catechist-ingest-source` with `{ sourceId }`.

### 6.2 Job steps

```
Job: catechist-ingest-source(sourceId)
  1. Load Source from Payload, mark ingestStatus='ingesting'
  2. Download file from Media (S3); detect type (PDF / DOCX / TXT)
  3. Extract text:
       - PDF → pdf-parse
       - DOCX → mammoth
       - TXT  → readFile
  4. Chunk:
       - Use a locator-aware chunker per Source.locatorFormat:
           bible           → one chunk per verse (with 2-verse-context window in chunk text)
           ccc             → one chunk per § paragraph
           roman-catechism → one chunk per question/answer
           council-canon   → one chunk per canon
           encyclical-section → one chunk per § section
           summa           → one chunk per article (Q.n, a.n)
           father-book-chapter → 600-token semantic chunks within a chapter
           generic         → 600-token semantic chunks
       - Each chunk gets locator, page_number, chunk_index
  5. Embed (batch 100 at a time):
       - gemini-embedding-2, outputDimensionality=1536, taskType=RETRIEVAL_DOCUMENT
  6. Insert chunks into tantum.source_chunks (with denormalized authority_tier)
  7. Parse citations per Source.locatorFormat:
       - Regex patterns per format (see §6.3)
       - Insert into tantum.source_chunk_citations (to_chunk_id resolved if possible)
  8. Concept-tag (batch 50 chunks at a time):
       - Gemini Flash with structured output:
         { conceptIds: number[], confidences: number[] }
       - Prompt includes the concept list + definitions + chunk text
       - Insert into tantum.source_chunk_concepts
  9. Resolve previously-unresolved citations across all sources
       (update tantum.source_chunk_citations SET to_chunk_id=... WHERE to_locator matches new chunks)
 10. Set Source.ingestStatus='ingested', chunkCount, lastIngestedAt
     On error: ingestStatus='error', errorMessage=...
```

### 6.3 Citation parsers (regex-based)

Patterns (case-insensitive, with named capture groups):

```
Scripture       /\b(?<book>1?\s*[A-Z][a-z]+)\.?\s+(?<ch>\d+):(?<v>\d+)(?:[–-](?<v2>\d+))?\b/
CCC             /\b(?:CCC|Catechism)\s*§?\s*(?<para>\d{1,4})\b/
Trent canon     /\bTrent,?\s*Sess(?:ion)?\.?\s+(?<sess>[IVX]+),?\s*Can(?:on)?\.?\s+(?<canon>\d+)\b/
Encyclical §    /\b(?<doc>Humanae Vitae|Veritatis Splendor|Fides et Ratio|Deus Caritas Est|Lumen Fidei|Lumen Gentium|Dei Verbum|Sacrosanctum Concilium|Gaudium et Spes|Dignitatis Humanae|Unitatis Redintegratio|Nostra Aetate|Ad Gentes|Apostolicam Actuositatem|Optatam Totius|Perfectae Caritatis|Christus Dominus|Presbyterorum Ordinis|Inter Mirifica|Orientalium Ecclesiarum|Gravissimum Educationis)\s*§?\s*(?<sec>\d{1,3})\b/
Summa article   /\bSumma,?\s+(?<part>I{1,3}(?:-II)?),?\s*Q\.?\s*(?<q>\d+),?\s*a\.?\s*(?<art>\d+)\b/
Roman Catechism /\bRoman Catechism,?\s+(?<part>Part\s+[IVX]+),?\s+Q\.?\s+(?<q>\d+)\b/
```

Each match resolves to a canonical locator string (eg `John 6:53`, `CCC §1374`) which is stored in `to_locator` and matched against `source_chunks.locator`.

### 6.4 Edge cases

- **Citations to unloaded sources** — stored with `to_chunk_id = NULL`; later ingestions trigger a re-resolution pass
- **Ambiguous citations** (e.g. just "Ch. 7" with no doc) — dropped; not stored
- **Chunk too long for embedding** — pre-split at 8000 chars (Gemini token budget) with sentence-boundary preservation
- **Embedding API failure** — exponential backoff; after 3 retries, mark Source.ingestStatus='error' with message; ingestion can be resumed from last successful chunk_index

---

## 7. Retrieval pipeline (graph-aware)

### 7.1 The full flow per question

```
POST /api/catechist/ask
  body: { conversationId, question }

  1. Auth check: req.user (Member) must exist with _verified=true → else 401 (no session) or 403 (unverified)
  2. Rate limit check: count(*) from tantum.catechist_rate_limits
        WHERE member_id = $1 AND bucket='ask' AND created_at > now() - interval '24 hours'
        If >= settings.catechistRateLimit.dailyLimit → 429 with rate-limit message
  3. Load conversation (verify it belongs to this Member) or create new
  4. Build question-with-context: last 4 messages from conversation + new question
        (Gives the model conversational continuity for "tell me more about that")
  5. Embed the question:
        gemini-embedding-2, outputDimensionality=1536, taskType=RETRIEVAL_QUERY
  6. Vector search (semantic):
        SELECT id, source_id, text, locator, authority_tier,
               1 - (embedding <=> $1) AS similarity
        FROM tantum.source_chunks
        ORDER BY embedding <=> $1
        LIMIT 20
  7. Citation expansion (1 hop):
        For the top 10 of those results, pull cited chunks:
        SELECT to.* FROM tantum.source_chunk_citations c
        JOIN tantum.source_chunks to ON to.id = c.to_chunk_id
        WHERE c.from_chunk_id = ANY($top10_ids)
        Add to candidate pool, dedupe by chunk_id
  8. Concept-aware re-ranking:
        - Tag the question with concepts via Gemini Flash classifier (same as ingestion)
        - For each candidate chunk, compute:
            score = similarity
                  × authorityWeight(authority_tier)
                  × (1 + 0.3 * conceptOverlap(question_concepts, chunk_concepts))
        - Sort descending
  9. Take top 8 chunks
 10. Build prompt:
        - System: identity + citation contract + refusal rule
        - Context: top 8 chunks, each with [locator] tag and authority badge
        - History: last 4 messages
        - Question: the current question
 11. Call Gemini 2.5 Pro via @ai-sdk/google with streamUI:
        - Tools defined: scriptureCard, catechismCard, sourcePreviewCard, citationTraceCard
        - Structured output: { answer: string, citations: Array<{ chunkId, locator, quotedSpan }> }
        - Temperature: 0.3
        - Max tokens: 1500
 12. As the model emits tool calls, render the corresponding cards inline (Vercel AI SDK handles)
 13. As the model finishes:
        - Validate citations:
            (a) citations.length >= 1
            (b) every chunkId exists in source_chunks
            (c) every quotedSpan is a substring of the corresponding chunk.text
        - If any check fails → return refusal payload (with top-3 retrieval) + log to catechist_refusals
 14. Persist the user message + assistant message to CatechistConversations.messages
 15. Insert into tantum.catechist_rate_limits
 16. Update Member.lastSeenAt
 17. Return final structured response (or refusal)
```

### 7.2 System prompt (skeleton — to be tuned during build)

```
You are the Catechist of Tantum Ergo, a Catholic formation app.
You are bound to citation. Every claim in your answer MUST be supported by
one of the passages provided in <context>. You may quote, paraphrase, or
synthesize across passages, but every footnote MUST point to a real passage
in <context>, identified by its [chunkId].

If the provided passages are not sufficient to answer the question with
confidence, refuse: return citations:[]. Do NOT invent; do NOT speculate
beyond the passages.

Tone: warm, precise, pastoral when fitting; Aquinas-grade rigorous when the
question warrants. Adapt to the depth of the question. Italicize the question
when restating it.

When citing Scripture, call the scriptureCard tool inline.
When citing the Catechism, call the catechismCard tool inline.
When citing any other source, call the sourcePreviewCard tool inline.
When the citation lineage matters (e.g. a Council interpreting Scripture),
call the citationTraceCard tool inline.

Always end your answer with the footnotes block as plain text, mono.
```

### 7.3 Streaming response shape

The endpoint returns a Vercel AI SDK `streamText` / `streamUI` response. Frontend uses `useChat` (or equivalent) to consume the stream and render cards as they arrive.

---

## 8. API surface

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/catechist/conversations` | Member | Create new conversation; returns `{ id }` |
| GET  | `/api/catechist/conversations` | Member | List user's conversations (sidebar) |
| GET  | `/api/catechist/conversations/[id]` | Member (owner) | Load one conversation + messages |
| PATCH | `/api/catechist/conversations/[id]` | Member (owner) | Update title or archive |
| DELETE | `/api/catechist/conversations/[id]` | Member (owner) | Soft-delete (archived=true) |
| POST | `/api/catechist/ask` | Member | Streaming ask (the main endpoint, see §7.1) |
| GET  | `/api/catechist/sources` | Public | List all ingested Sources (for sidebar Sources view) |
| GET  | `/api/catechist/sources/[slug]` | Public | View one Source + its chunks (for citation deep-links) |

All `/api/catechist/*` rate-limited per Member except the two public Sources reads.

---

## 9. Frontend routes

| Route | Auth | Purpose |
|---|---|---|
| `/sign-in` | public | Sign in form |
| `/sign-up` | public | Create account form (triggers verification email) |
| `/sign-in/forgot` | public | Request password reset |
| `/account/reset-password` | public (token in URL) | Set new password (landing page from email) |
| `/account/verify-email` | public (token in URL) | Email verification landing page |
| `/catechist` | Member (verified) | The Catechist app (sidebar + main pane). Loads most-recent conversation or empty state. |
| `/catechist/c/[conversationId]` | Member (verified, owner) | Loads specific conversation. |
| `/catechist/sources` | public | Browse the corpus (read-only). |
| `/catechist/sources/[slug]` | public | One source's chunks; supports `#chunk-[id]` deep-link from citations. |
| `/catechist/account` | Member | Display name, email, avatar upload, sign out. |

---

## 10. Tech additions

| Need | Package | Notes |
|---|---|---|
| Streaming + generative UI | `ai` (Vercel AI SDK) | `streamUI`, typed tools for the four cards. |
| Gemini provider for AI SDK | `@ai-sdk/google` | Wraps `@google/genai`. |
| Gemini direct (embeddings, structured output) | `@google/genai` | Already on path per May-4 spec. |
| PDF text extract | `pdf-parse` | Per May-4 spec. |
| DOCX text extract | `mammoth` | Per May-4 spec. |
| Auth | Payload built-in on Members collection | No extra package. |
| pgvector + Drizzle | (already available) | Per May-4 spec. |

---

## 11. Environment additions

```
# Already in May-4 spec
GOOGLE_AI_API_KEY=...

# Catechist-specific (no new keys; auth is cookie-session via Payload)
PAYLOAD_SECRET=...   # required for member-auth signing; already present
```

---

## 12. Three-day execution sketch

(Not a plan — that's the next step. This is the order-of-operations to confirm the spec is buildable in scope.)

**Day 1 — Foundations**
- Public-facing auth pages: `/sign-in`, `/sign-up`, `/sign-in/forgot`, `/account/reset-password`, `/account/verify-email`. Members collection itself is already configured — these pages POST to existing Payload endpoints.
- Sources collection (new with the v1.0 fields above); Concepts collection (new); seed Concepts from §4.4
- Drizzle migration: `tantum.source_chunks`, `source_chunk_citations`, `source_chunk_concepts`, `catechist_rate_limits`, `catechist_refusals`
- Ingestion job: text extraction, chunking (per-format), embedding, insertion
- Citation parsers (regex per format)
- Begin ingesting the corpus (Bible first — quickest validation)

**Day 2 — Retrieval + API**
- Concept-tagging Gemini Flash pass (during ingestion); finish concept-tagging the corpus
- Citation resolution pass after each ingestion
- `/api/catechist/ask` end-to-end: auth, rate limit, embed-question, vector search, graph expand, re-rank, prompt build, Gemini Pro call with streamUI, citation validation, refusal path
- `CatechistConversations` collection + persistence on each ask
- Conversation list + load endpoints

**Day 3 — Frontend + polish**
- `/catechist` page: sidebar (conversation list, new, sources, profile), main pane (composer, conversation rendering, streaming), four card components
- `/catechist/sources` browse view + `/catechist/sources/[slug]` deep-link target
- Welcome conversation seed for first-time users
- Mobile drawer wiring
- Eval set: ~30 questions hand-authored across the four user tiers; run before launch; pass criteria = top-3 retrieval contains at least one expected source for ≥80% of questions
- Polish pass: motion, transitions, refusal UX, error states, rate-limit messaging

If Day 3 slips, the polish pass and eval set carry into Day 4 — but the system is functional by end of Day 3.

---

## 13. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Catechism (CCC) rights become an issue at public launch | Med | High | Flag prominently in Credits page; content team verifies before public release; if blocked, drop CCC and rely on Roman Catechism + encyclicals (still ~4500 chunks). |
| Gemini hallucinates a citation | Low (with structured output + validation) | High | Three-layer validation: chunkId exists, quotedSpan substring-match, citations array non-empty. Refusal is the default, not the exception. |
| Concept tagging is slow / expensive at ingestion | Med | Med | Batch 50 chunks per Gemini Flash call; ingestion runs as a background job, not blocking; budget ~$15 in API costs for the full 5,000-chunk seed. |
| Citation regex misses real citations | High | Low | Patterns target the canonical sources (Bible, CCC, Trent, encyclicals, Summa, Roman Catechism); we accept minor recall loss. v1.1 can add LLM-based citation extraction. |
| 3 days slips to 4 | Med | Low | Day 3 polish is the cushion. v1.0 launch can be Day 4 if necessary; the architectural commitments don't change. |
| Vercel AI SDK / Gemini integration friction | Med | Med | `@ai-sdk/google` is mature; if `streamUI` proves flaky with Gemini, fall back to `streamText` + client-side parsing of `<scripture>...</scripture>` tags into cards. Same UX. |
| Member sign-up enables abuse (free Gemini calls) | Med | Med | Daily rate limit (50/day) + email field (no verification yet, but a hurdle); v1.1 adds email verification. |
| Conversation state grows unbounded | Low (v1.0) | Low | No truncation in v1.0; v1.1 considers archiving / summarization for long conversations. |

---

## 14. Out of scope (deferred to v1.1)

- Multimodal artwork retrieval (images)
- LLM-extracted concepts beyond the curated 40
- Email verification on sign-up
- Conversation export, sharing, bookmarking, favorites
- Voice input/output
- Saved-answer quotes (`Quote of the day` — JPII spotlights, etc.)
- Cross-conversation search ("find that thing I asked about Trinity last month")
- Locales beyond `en_ZA`
- Rest of the Summa beyond Prima/Tertia Pars
- Additional Fathers (Aquinas-cited Fathers like Damascene, Bonaventure)
- Modern Catechetical companions (eg. Compendium, YouCat) — content team adds
- Per-conversation citation graph visualizer (could be cool — v1.2)

---

## 15. Out of this spec — into the implementation plan

Day-by-day execution with dependency graph, file-by-file todos, verification gates, and the eval set definition. That goes into `writing-plans` next.

---

## 16. Open questions resolved during brainstorm

- ~~Magisterium.com or build our own?~~ → **Build our own.** User concerned about doctrinal authority transfer + dependency risk; corpus + retrieval kept in-house.
- ~~Vector RAG or graph RAG?~~ → **Graph-aware vector RAG.** Vector kNN as base, citation graph for 1-hop expansion, authority + concept layered into re-ranking.
- ~~Concept ontology source?~~ → **Hand-curated 40-concept seed**, editable via Payload Concepts collection. LLM expansion in v1.1.
- ~~Auth?~~ → **Required, with email verification.** Members collection (already production-grade in the codebase) provides Payload-native auth, email-verification flow, and forgot-password flow out of the box. We just build the public-facing pages.
- ~~Multi-turn?~~ → **Yes.** Auth + sidebar make persistent multi-turn conversations the natural shape.
- ~~UI shape?~~ → **Sidebar + main pane + generative inline cards.** Vercel AI SDK `streamUI` for the cards. Four card types in v1.0.
- ~~Refusal posture on hot-button doctrine?~~ → **Quote the teaching plainly with citations; refuse only when corpus is silent.** Citation-bound interlocutor doesn't soften, doesn't refuse what it can support.
- ~~CCC rights?~~ → **Include with Vatican credit + Credits-page flag**; content team verifies before public launch.
- ~~Multimodal artwork in v1.0?~~ → **No.** Embedding model is multimodal; we just don't embed images at v1.0. Deferred.
- ~~LLM provider for answers?~~ → **Gemini 2.5 Pro** (Pro, not Flash, for theology reasoning quality).
- ~~LLM provider for embeddings + concept tagging?~~ → **gemini-embedding-2** (1536-d) + **Gemini 2.5 Flash** (cheap classifier).
- ~~Rate limit?~~ → **50 questions per Member per 24h** (configurable in Settings).

---

## 17. Open questions for implementation

(None blocking. Items the team will decide during or just after build.)

- Conversation title generation — at first ask or after first answer? (Likely after — Gemini has more context.)
- Welcome-conversation copy — needs final hand-authored version with real citations.
- Eval set authorship — who writes the 30 questions + expected sources? (Likely the user; suggested to draft together at start of Day 3.)
- Visual styling of the auth pages — match home/manifesto editorial language exactly, or distinct treatment? (Default: match.)
