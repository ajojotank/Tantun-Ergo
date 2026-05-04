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

CREATE TABLE IF NOT EXISTS tantum.rate_limits (
  id           bigserial PRIMARY KEY,
  bucket       text NOT NULL,
  ip_hash      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON tantum.rate_limits (bucket, ip_hash, created_at DESC);

CREATE TABLE IF NOT EXISTS tantum.source_chunks (
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
  ON tantum.source_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS source_chunks_source_idx
  ON tantum.source_chunks (source_id);

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
  payload.logger.info('Raw tables ensured in `tantum` schema: rate_limits, source_chunks, media_chunks (pgvector)')
}
