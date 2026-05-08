// src/db/init-raw-tables.ts
//
// Bootstraps app-level tables that aren't managed by Payload.
//
// IMPORTANT: these tables live in a separate `tantum` schema, NOT in the
// `payload` schema. Putting them under `payload` confuses Drizzle's dev-mode
// schema sync (Payload's adapter calls drizzle-kit push on boot, sees them as
// orphans, and prompts interactively whether they're renames of new Payload
// tables — which deadlocks any non-interactive process like `pnpm seed`).
//
// Keep this schema boundary tight:
//   - Payload manages everything in `payload.*` (collections, globals, _v, etc.)
//   - We manage everything in `tantum.*`  (rate_limits + pgvector chunks)
import type { Payload } from 'payload'

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

export async function initRawTables(payload: Payload) {
  const db = (payload.db as unknown as { drizzle: { execute: (sql: string) => Promise<unknown> } }).drizzle
  await db.execute(SQL)
  payload.logger.info('tantum schema ready: rate_limits, source_chunks (+citations/concepts), catechist_rate_limits, catechist_refusals, media_chunks (pgvector)')
}
