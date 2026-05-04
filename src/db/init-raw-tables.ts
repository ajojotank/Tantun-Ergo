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
