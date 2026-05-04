# Tantum Ergo · v1.0 polished shell — design spec

> **Status:** draft, awaiting user review
> **Authored:** 2026-05-04
> **Target:** v1.0 polished shell ready for content team by ~2026-05-10
> **Predecessor:** scaffolded boilerplate at `main` (Next 16 + Payload 3.84 + Supabase, holding page on `/`)

---

## 1. Vision and scope

### Vision (recap)

A **digital Sistine Chapel for Catholic formation**. Three pillars — a cartographic **Miracle Atlas**, a long-form **Doctrine LMS**, and a citation-bound **AI Catechist** — held inside one reverent, mobile-first, scroll-scrubbed surface. ZA-first audience (`en_ZA`).

### What v1.0 means here

A **technically complete, polished shell** that the (non-technical) content team can fill via Payload's studio. The mechanics work end-to-end. Filler content is placed *through the CMS* in every shape an editor will encounter, so the studio's UX and the public surface's structure are both legible at a glance.

**v1.0 explicitly excludes** authoritative content authoring, copy revision, ecclesial review, accessibility audit beyond WCAG 2.2 AA self-test, paid traffic-grade tile budgets, or member accounts. Those are content-team / post-launch concerns.

### Audience and access model

- **Fully open** — no member accounts, no login UI for end-users, no Stripe.
- The only authentication is for **Stewards** (CMS editors): admin / theologian / editor — already scaffolded.
- Catechist is rate-limited **per IP** (sliding window in a dedicated `rate_limits` raw table — see §5.3 — *not* `payload_kv`, which is Payload-internal and brittle to upgrade across) to control LLM cost and prevent scraping.
- LMS unit progress is stored client-side in `localStorage` (no server-side tracking).

---

## 2. Information architecture

```
/
├── /atlas          → globe + pilgrimage mode (the Miracle Atlas)
├── /doctrine       → track catalogue
│   └── /[track]    → track overview
│       └── /[module]
│           └── /[unit]   → unit player (folios, lanes, mastery check)
├── /catechist      → epistolary inquiry surface
├── /reading        → editorial articles (Pages collection, pageType=reading-article)
├── /manifesto      → vision/about (Pages, pageType=manifesto, single doc)
└── /credits        → sources + ecclesial review notes (Pages, pageType=credits, single doc)
```

**Top nav (desktop):** Atlas · Doctrine · Catechist · Reading · About&nbsp;⌄ (popover: Manifesto, Credits).
**Top nav (mobile):** logo + hamburger → full-screen drawer overlay with the same items, larger type, single column.

---

## 3. Design language

### Palette (already scaffolded)

`vellum` (#fbf6ea), `vellum-deep` (#f3eada), `parchment` (#ece0c4), `ink` (#1a1410), `ink-soft` (#4a3f33), `rubric` (#8c2a2a), `rubric-deep` (#5e1a1a), `gilt` (#b08a3e), `incense` (#6f7a3a), `lapis` (#1f3358).

Single accent (rubric). All warm. No pure black. Dark-mode honors `prefers-color-scheme` with a charcoal-and-vellum inversion.

### Typography (already scaffolded)

- **Display:** Cormorant Garamond — italic-leaning, classical. Used for headings, pull quotes, the LMS folio body, the Catechist's italicised question.
- **Sans:** Geist — for body, UI chrome, navigation, metadata.
- **Mono:** Geist Mono — for label-style metadata, citations, folios, plate captions.

Hierarchy primarily via **weight and tracking**, not just size. Display headers `tracking-tighter leading-none`; body `text-base leading-relaxed max-w-[65ch]`.

### Motion grammar

Locked: `MOTION_INTENSITY: 8`. Distribution:

| Surface | Motion |
|---|---|
| Page transitions | 280ms spring lift (fade + 8px upward translate) |
| Stagger reveals on scroll | First paint of each section, 4–8 elements max, 60ms stagger |
| Magnetic effect | Primary CTAs and pillar entry tiles only |
| Perpetual motion | One element per page max (already on `/`: rubric scroll bar) |
| Scroll-scrubbed sequences | Only the home manifesto + Atlas pilgrimage (capped at two cinematic moments site-wide) |
| Hover | `scale(0.98)` on `:active`, 200ms color shift on `:hover` |
| Mobile nav drawer | One curtain reveal — the only exception to the no-curtain page-transition rule |
| Reduced-motion | Scroll-scrubbing → static stills with fades. Perpetual motion stops. CTAs lose magnetism. |

All motion uses Framer Motion springs (`{stiffness: 110, damping: 22, mass: 0.5}`) — never linear easing. Animations bound to `transform` and `opacity` only (hardware-accelerated).

---

## 4. Page-by-page design

### 4.1 Home (`/`)

Editorial-led. **One** sustained scroll-scrubbed manifesto sequence. Plate-style entry tiles for each pillar.

**Sections in order:**

1. **Hero (typographic, no scroll-scrub)** — eyebrow, display headline, subhead, two magnetic CTAs (`Begin pilgrimage` → `/atlas`, `Read the manifesto` → `/manifesto`). Asymmetric 7/12 split with right-side oculus plate.
2. **Manifesto sequence** (the cinematic moment) — a sticky-scroll section, ~5 frames of image-sequence, each captioned. Sourced from a `manifestoSequence` global (Payload). Scroll progress drives frame swap via Framer's `useScroll`. Mobile: vertical sequence with fades between frames, no scrub.
3. **Three pillars as plates** — three rectangular plates (4:5 aspect), each with eyebrow ("Plate I · Cartography"), pillar name in display, one-line intent, magnetic on hover. CSS Grid `2fr 1fr 1fr` (asymmetric).
4. **Editorial primer band** — a single horizontally scrolling band of `/reading` article previews (3–6 cards) pulled from Pages collection where `pageType=reading-article`. Empty state: "Reading room opens soon."
5. **Footer** — global footer (see §6.4).

### 4.2 Atlas (`/atlas`)

Hero pillar. Two modes — **Explore** (default) and **Pilgrimage** — toggled by a CTA.

**Explore mode:**
- Mapbox GL JS globe view, full-bleed.
- Pins for every miracle. Pin colour reflects `type` (Eucharistic = rubric, Marian = lapis, Healing = gilt, Other = ink).
- Click pin → side drawer (right on desktop, bottom-sheet on mobile) with miracle detail (summary, narrative, sources, artwork carousel).
- Bottom timeline scrub bar — drag a handle to filter pins by year. The globe re-renders only pins active at that year.
- Filter chips above timeline: type, ecclesial status.

**Pilgrimage mode:**
- Triggered by the `Begin pilgrimage` CTA on home or atlas.
- A vertical scroll-storytelling experience. One miracle per chapter. The map auto-pans/zooms as the user scrolls. Captions and source citations slide in from the side.
- The miracles included in the pilgrimage are those flagged `inPilgrimage: true`, ordered by `pilgrimageOrder`.
- **Mobile:** pilgrimage mode only. The free-globe explore experience is desktop-only (≥`md`). On mobile, the page renders the pilgrimage as the default; a "View all miracles" CTA at the end of the pilgrimage routes to `/atlas/list` (the keyboard-accessible list view, see §6.4) which doubles as the mobile catalogue.

### 4.3 Doctrine (`/doctrine` and nested)

Breviary visuals, course-platform bones.

- `/doctrine` — track catalogue. List of tracks as plates. Each plate: numeral, title, summary, module count, cover image, "begin reading" CTA.
- `/doctrine/[track]` — track overview. Cover plate at top, list of modules below as folio entries. Reading position restored from `localStorage`.
- `/doctrine/[track]/[module]` — module overview. Same shape, with units listed.
- `/doctrine/[track]/[module]/[unit]` — unit player. The breviary surface:
  - Top: track › module breadcrumb in italic display.
  - Body: the **primary lane** content (default = reading; see lanes below).
  - Lane switcher: "Read · Watch · Listen" tabs in the gutter. **Reading is required** on every unit; **Watch and Listen are optional** — if a lane has no media uploaded, its tab is hidden (not greyed). A unit with only Reading shows no tab strip at all.
  - Mastery check at the end: a single multiple-choice question, gentle ("Do you remember?"), with a one-line affirmation/correction on submit. Self-graded, stored in `localStorage`.
  - Footer: "Folio iii. of vii." in mono, "Turn page" CTA → next unit (or next module).

### 4.4 Catechist (`/catechist`)

Epistolary spiritual-direction format. Single page, no chat history, no bubbles.

**Layout:**
- Centred, max-width prose (~720px).
- A single `<form>` with one `<textarea>`-as-input field. Display-italic placeholder: "Ask the Catechist…"
- Submit → answer renders below the question.
- The user's question is rendered first in italic display, indented, with a left-border in rubric — like a quotation in a letter.
- A 1px divider.
- The answer in body type, with footnote superscripts after each cited passage. Footnotes listed in mono at the bottom of the answer block, with the source title and locator (e.g. `Catechism §1374`).
- "Ask another" CTA below the footnotes — clears and re-focuses the textarea, but the previous Q&A scrolls up (it's not persisted, just visible until the user navigates away or refreshes).
- If multimodal retrieval surfaces relevant artwork, it appears as an inline plate above the answer body, captioned with attribution. (Reliquary images carry alt-text and attribution already.)

**Refusal behaviour:**
- If structured output returns no `citations`, the system replies with: *"I cannot answer this with confidence from the sources I've ingested. Here are the closest passages I found —"* followed by the top-3 retrieval results without an answer summary.

### 4.5 Reading (`/reading`)

Editorial articles. Pulls from Pages collection where `pageType=reading-article`.

- `/reading` — index. Articles listed as folio entries, newest first.
- `/reading/[slug]` — article view. Single column, generous max-width, hero image plate at top, body in display-leaning rich text. Footnotes if present.

### 4.6 Manifesto (`/manifesto`)

Single Pages doc with `pageType=manifesto`. Long-form vision essay. Used by the homepage CTA. Has its own scroll-scrubbed image-sequence section if the doc supplies a `sequence` block — otherwise falls back to plain editorial.

### 4.7 Credits (`/credits`)

Single Pages doc with `pageType=credits`. Lists ecclesial reviewers, source corpora ingested into the Catechist, image attributions, and any imprimatur/nihil obstat acknowledgements. Critical for trust on a Catholic project.

---

## 5. Data model

### 5.1 Existing collections (already scaffolded — extended below)

#### Users (Stewards) — unchanged
admin / theologian / editor roles.

#### Media (Reliquary) — extended
Add fields:
- `_isSample` (boolean, admin-only, badge in studio)
- `imageEmbedding` (vector, populated by ingestion job for multimodal search — managed in raw chunks table, not Payload field)

#### Pages — extended
Add fields:
- `pageType` (select: `home-block | manifesto | credits | reading-article | generic`)
- `_isSample` (boolean)
- For `pageType: reading-article`: `excerpt` (textarea), `publishedAt` (date)

### 5.2 New collections

#### Miracles
| field | type | notes |
|---|---|---|
| `title` | text | required |
| `slug` | text | required, unique, indexed, sidebar |
| `type` | select | Eucharistic, Marian, Healing, Stigmata, Incorruptible, Other |
| `ecclesialStatus` | select | Approved, Recognised, Worthy of belief, Under investigation, Not constatat |
| `locationName` | text | "Lanciano, Italy" |
| `coordinates` | point | lat/lng — pin position |
| `yearOccurred` | number | year only |
| `dateApproximate` | boolean | renders "c. 700" if true |
| `approvalDate` | date | optional |
| `approvingAuthority` | text | "Bishop of Tours, 1574" |
| `summary` | textarea | 1–2 sentences, used in pin tooltip |
| `narrative` | richText | Lexical |
| `sources` | array | `{label, url, attribution}` |
| `artwork` | upload (multi) | rel to Media |
| `inPilgrimage` | boolean | sidebar |
| `pilgrimageOrder` | number | conditional on `inPilgrimage` |
| `_isSample` | boolean | admin |

Drafts + autosave + scheduled publish enabled (mirror Pages). Live preview at `/atlas?focus={slug}`.

#### DoctrineTracks
| field | type | notes |
|---|---|---|
| `title` | text | required |
| `slug` | text | required, unique |
| `summary` | textarea | |
| `order` | number | sidebar |
| `coverPlate` | upload | rel to Media |
| `_isSample` | boolean | admin |

#### DoctrineModules
| field | type | notes |
|---|---|---|
| `track` | relationship | rel to DoctrineTracks, required |
| `title` | text | required |
| `slug` | text | required, unique-within-track |
| `summary` | textarea | |
| `order` | number | sidebar |
| `_isSample` | boolean | admin |

#### DoctrineUnits
| field | type | notes |
|---|---|---|
| `module` | relationship | rel to DoctrineModules, required |
| `title` | text | required |
| `slug` | text | required, unique-within-module |
| `order` | number | sidebar |
| `introduction` | richText | short, top of unit |
| `lanes.reading` | richText | required, primary lane |
| `lanes.watchVideo` | upload | rel to Media (video) |
| `lanes.listenAudio` | upload | rel to Media (audio) |
| `masteryCheck` | group | `{prompt, options[]}` — see below |
| `_isSample` | boolean | admin |

`masteryCheck.options[]`: `{text, isCorrect, affirmation}` — affirmation is the line shown on selecting (correct or otherwise).

Drafts + autosave on units; live preview at `/doctrine/[track]/[module]/[unit]?preview=true`.

#### Sources (Catechist corpus)
| field | type | notes |
|---|---|---|
| `title` | text | required, e.g. "Catechism of the Catholic Church" |
| `author` | text | "Catholic Church", "Pope John Paul II" |
| `year` | number | |
| `type` | select | Scripture, Catechism, Encyclical, Council, Other |
| `file` | upload | rel to Media (PDF/DOCX) |
| `ingestStatus` | select | pending, ingesting, ingested, error (read-only after upload) |
| `chunkCount` | number | computed, read-only |
| `lastIngestedAt` | date | computed, read-only |
| `errorMessage` | textarea | read-only, populated on error |
| `_isSample` | boolean | admin |

Studio sidebar action: "Ingest" button on a Source doc. Triggers Payload job.

### 5.3 Raw tables (managed outside Payload)

These are managed via Drizzle migrations, *not* Payload collections. They live in a separate **`tantum`** schema (not `payload`) so Payload's dev-mode schema sync (which scans `payload.*`) doesn't see them as orphans and prompt about renames. Payload's `payload_kv` is intentionally avoided — it's Payload-internal and not a stable public API.

#### `tantum.rate_limits`

```sql
CREATE TABLE tantum.rate_limits (
  id           bigserial PRIMARY KEY,
  bucket       text NOT NULL,            -- e.g. "catechist:ask"
  ip_hash      text NOT NULL,            -- SHA-256 of IP + a server-side salt
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rate_limits_lookup_idx
  ON tantum.rate_limits (bucket, ip_hash, created_at DESC);

-- Periodic cleanup (Payload job, runs every 10 minutes):
--   DELETE FROM tantum.rate_limits
--   WHERE created_at < now() - interval '2 hours';
```

A request is allowed iff `count(*)` for `(bucket, ip_hash)` in the last `requestsPerHour` window is below the configured limit (default 20/hr from Settings global).

#### `tantum.source_chunks`
Holds the embedded text chunks.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE tantum.source_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id    integer NOT NULL REFERENCES payload.sources(id) ON DELETE CASCADE,
  chunk_index  integer NOT NULL,
  text         text NOT NULL,
  locator      text NOT NULL,           -- "Catechism §1374" or "John 6:53"
  page_number  integer,
  embedding    vector(1536) NOT NULL,    -- gemini-embedding-2 @ 768d
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX source_chunks_embedding_idx ON tantum.source_chunks
  USING hnsw (embedding vector_cosine_ops);
CREATE INDEX source_chunks_source_idx ON tantum.source_chunks (source_id);
```

#### `tantum.media_chunks` (for multimodal artwork search)
```sql
CREATE TABLE tantum.media_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id     integer NOT NULL REFERENCES payload.media(id) ON DELETE CASCADE,
  embedding    vector(1536) NOT NULL,
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX media_chunks_embedding_idx ON tantum.media_chunks
  USING hnsw (embedding vector_cosine_ops);
```

### 5.4 Globals

#### Settings (Payload Global)
- `siteTitle` — default "Tantum Ergo"
- `siteTagline` — default "A digital Sistine Chapel for Catholic formation."
- `footerCopy` — richText
- `socials` — array `{platform, url}`
- `mapboxStyle` — text — Mapbox style URL (so content team can re-skin the map)
- `catechistRateLimit` — group `{requestsPerHour, refusalMessage}`

#### ManifestoSequence (Payload Global)
- `frames` — array of `{image (rel to Media), caption (richText), eyebrow (text)}`
- Rendered by the home page's scroll-scrubbed sequence section.

---

## 6. Cross-cutting

### 6.1 Catechist pipeline (end-to-end)

```
[Studio: upload Source PDF]
  → afterChange hook → enqueue payload_jobs.ingest-source
[Job runner]
  → text extract (pdf-parse for PDF, mammoth for DOCX)
  → chunk (semantic chunker, ~500-800 tokens per chunk, with locator extraction)
  → embed batch (gemini-embedding-2, outputDimensionality=1536, multimodal)
  → insert into tantum.source_chunks
  → set Source.ingestStatus=ingested, chunkCount, lastIngestedAt

[End user POSTs to /api/catechist/ask]
  → Rate limit check (payload_kv, sliding window per IP)
  → Embed question (gemini-embedding-2)
  → kNN over source_chunks (top 8) + media_chunks (top 4 if image relevant)
  → Build prompt with retrieved chunks + system prompt (cached via Gemini context cache)
  → Gemini 2.5 Flash with responseSchema:
     { answer: string, citations: Array<{ chunkId, locator, quotedSpan }> }
  → Validate: citations[] non-empty AND every citation maps to an actual chunk
  → If valid: stream/return answer + citations
  → If invalid: return refusal with top-3 retrieval results
```

The frontend renders `answer` and `citations[]` from the same JSON object. There is no path to render `answer` without `citations[]` — the component throws if `citations.length === 0`.

### 6.2 Filler-content marking convention

- Every collection includes `_isSample: boolean` (defaults `false`).
- Studio: a sidebar field with a `[Sample]` badge. Lists in the studio show samples with a faint badge.
- Frontend: when rendering a sample doc, a small `[Sample]` chip appears in the UI (configurable to hide post-launch via a Settings flag).
- Sample names use deliberately fictional placeholders: "Saint Placeholder of Sample-Town," "Fr. Lorem of Ipsum Abbey," coordinates set to neutral locations (Greenwich, etc.). This makes confusion between filler and authentic impossible for the content team.

### 6.3 Performance budget

- LCP < 2.5s on mid-range mobile (Pixel 6a-class) over 4G.
- INP < 200ms.
- CLS < 0.05.
- All scroll-scrubbed sequences cap at 60fps; gracefully degrade to static stills if `requestAnimationFrame` budget exceeded.
- Mapbox tile cap: free tier (50k loads/mo) sufficient for v1.0; usage monitoring to be added in v1.1.
- Image policy: every Reliquary upload has 4 sizes (thumbnail 480, card 960, hero 1920, sequence 1440); Next.js `<Image>` chooses by viewport. AVIF + WebP both served.

### 6.4 Accessibility (target WCAG 2.2 AA)

- All scroll-scrubbed sequences have `prefers-reduced-motion` static fallbacks.
- Catechist refusal language is screen-reader-priority (`aria-live=polite`).
- Mapbox interactive globe has a parallel keyboard-accessible "List of miracles" view at `/atlas/list`.
- LMS lane switcher is a real `<tablist>` with `aria-controls`.
- Colour contrast: ink-on-vellum is 16.8:1 (passes AAA). Rubric-on-vellum is 4.6:1 (passes AA for body, AA-large for headings).

### 6.5 Tech additions to existing stack

| Need | Package | Notes |
|---|---|---|
| Map | `mapbox-gl` + `react-map-gl` | Globe view |
| Multimodal AI | `@google/genai` | Single SDK. **`gemini-embedding-2`** is natively 3072-d and accepts text, image, video, audio, PDF in a unified embedding space. Supports Matryoshka truncation (128–3072, with 768 / 1536 / 3072 recommended). We configure `outputDimensionality: 1536` for a good quality/cost balance — fits pgvector HNSW index comfortably. Configure once in the embedding helper. |
| pgvector | Drizzle migration + raw client queries | Payload doesn't manage these tables |
| PDF text extract | `pdf-parse` | For Source ingestion job |
| DOCX text extract | `mammoth` | For Source ingestion job |
| Audio waveform | `wavesurfer.js` | LMS audio lane |
| S3-compat storage | `@payloadcms/storage-s3` | Pointed at Supabase Storage for prod |
| Rate limiting | Custom — leverages `payload_kv` | Sliding-window per-IP |

### 6.6 Environment additions

```
GOOGLE_AI_API_KEY=...                 # user has it
MAPBOX_ACCESS_TOKEN=...               # user has it
MAPBOX_STYLE_URL=mapbox://styles/...  # optional, falls back to default style
SUPABASE_STORAGE_BUCKET=tantum-reliquary  # for prod media persistence
SUPABASE_S3_ACCESS_KEY=...            # generated via Supabase Storage settings
SUPABASE_S3_SECRET_KEY=...
```

---

## 7. Filler-content seed plan

A tiny but credible corpus for the demo:

- **Miracles:** ~10 sample miracles, all labelled `[Sample]`. Mix of types and ecclesial statuses. 3–4 marked `inPilgrimage`.
- **DoctrineTracks/Modules/Units:** 1 sample track ("The Trinity"), 2 modules, 2–3 units per module. Each unit has reading + a stub mastery check. 1 unit gets a placeholder video and audio.
- **Sources:** the **Douay-Rheims Bible** (full text, public domain) and a **public-domain partial Catechism corpus** for the demo. Real Catechism upload deferred to content team for rights verification.
- **Reading articles:** 2–3 sample articles in Pages.
- **Manifesto, Credits:** seeded with placeholder body but real structure.

---

## 8. Out of scope (deferred)

- Member accounts, user-side auth, profiles, bookmarks.
- Subscription / payment integration.
- LMS course completion certificates.
- Catechist conversation memory across sessions.
- Real-time collaboration in the studio.
- Mobile apps (iOS/Android).
- Localisation beyond `en_ZA` (the i18n boundaries exist; second-locale activation is post-v1.0).
- Search bar over the whole site (Atlas/Doctrine each have internal filters; global search is v1.1).
- Push notifications / newsletters.
- LMS progress export/import code (Wordle-style portable string for cross-device sync without an account) — v1.1 enhancement raised in review.

---

## 9. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Catechist hallucinates despite structured output | Med | High | Refusal path is the *default* — if `citations[]` is empty the answer never renders. Validate every citation `chunkId` exists in `source_chunks`. |
| Mapbox cost spike from public traffic | Low (v1.0) | Med | Cap to free tier; add usage telemetry hook in v1.1. |
| Scroll-scrubbed sequences eat frames on low-end mobile | Med | Med | Use IntersectionObserver gating; cap to 6 frames per sequence; `prefers-reduced-motion` shortcuts. |
| pgvector + Payload integration friction | Med | Med | Manage chunks via Drizzle migrations + raw queries; Payload only orchestrates via the job queue. Keep the boundary tight. |
| End-of-week target slips | High | Low | Implementation plan (next step) decomposes into per-day milestones. If slip, the priority order is: foundation → Atlas → LMS → Catechist; Catechist can ship "ingestion-only" if needed and the answer endpoint follows in v1.1. |
| Catechism rights for production | Med | High (legal) | Flag in Credits page now. Content team to obtain explicit permission before public launch. |
| Mobile-first experience for free-globe Atlas | Med | Med | Mobile collapses to pilgrimage-only; free globe is desktop-only. Documented in the Atlas section. |

---

## 10. Out of this spec — into the implementation plan

Day-by-day execution sequence, dependency graph, milestones, and verification gates. That goes into `writing-plans` next.

---

## 11. Open questions resolved during brainstorm

- ~~Three pillars in one spec or split?~~ → **One spec.**
- ~~Member accounts?~~ → **No, fully open.**
- ~~Atlas as globe or scrolltelling?~~ → **Both, mode-toggled.**
- ~~LMS as course platform or sacred reading?~~ → **Hybrid — breviary visuals over course bones.**
- ~~Catechist as chat?~~ → **Epistolary spiritual direction.**
- ~~LLM provider?~~ → **Gemini 2.5 Flash.**
- ~~Vector DB?~~ → **pgvector on the same Supabase.**
- ~~Embeddings?~~ → **gemini-embedding-2 (multimodal).**
- ~~Multimodal artwork search wired in for v1.0?~~ → **Yes.**
- ~~Filler corpus?~~ → **Douay-Rheims Bible + public-domain Catechism partial. Real CCC upload by content team.**
- ~~Homepage tone?~~ → **Editorial + one sustained scroll-scrubbed manifesto moment.**
- ~~Map library?~~ → **Mapbox GL JS.**
- ~~Video?~~ → **Native HTML5; no Mux for v1.0.**
- ~~Production media storage?~~ → **Supabase Storage via S3 adapter.**

## 12. Open questions for the user

None blocking. Items the content team must resolve before public launch:

- Catechism (Vatican English) explicit rights / educational-use permission.
- Mapbox commercial tier if public traffic exceeds 50k loads/mo.
- Bible translation choice for production (Douay-Rheims vs RSV-CE vs NABRE).
- Imprimatur / Nihil obstat for any catechetical content authored on the platform.
