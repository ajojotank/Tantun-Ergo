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

async function rawDb(payload: Payload): Promise<{
  execute: (q: { sql: string; params?: unknown[] }) => Promise<unknown>;
  query: (q: { sql: string; params?: unknown[] }) => Promise<{ rows: Array<Record<string, unknown>> }>
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = payload.db as any
  return {
    execute: async ({ sql, params }) => adapter.pool.query(sql, params ?? []),
    query: async ({ sql, params }) => adapter.pool.query(sql, params ?? []),
  }
}

/**
 * Ingest already-extracted text for a Source. Used by:
 *   - ingestSource() (file path) — after PDF/DOCX extraction
 *   - scripts/seed-test-source.ts — bypasses file upload entirely
 *
 * Runs the full pipeline: chunk → embed → insert → citations → concepts →
 * resolve previously-unresolved citations → mark Source.ingested.
 *
 * Marks Source.ingestStatus to 'ingesting' on entry and 'ingested' on
 * success / 'error' with errorMessage on failure (and rethrows).
 */
export async function ingestRawText(
  payload: Payload,
  sourceId: number,
  text: string,
): Promise<void> {
  const source = await payload.findByID({ collection: 'sources', id: sourceId })

  await payload.update({
    collection: 'sources',
    id: sourceId,
    data: { ingestStatus: 'ingesting', errorMessage: null },
  })

  const db = await rawDb(payload)

  try {
    // 1. Chunk
    const chunks = chunkText(text, source.locatorFormat as LocatorFormat, {
      sourceTitle: source.title,
    })
    if (chunks.length === 0) throw new Error('Chunker returned 0 chunks')

    // 2. Embed (batched)
    const allEmbeddings: number[][] = []
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH)
      const vecs = await embed(batch.map((c) => c.text), 'RETRIEVAL_DOCUMENT')
      allEmbeddings.push(...vecs)
      payload.logger.info(
        `[ingest:${sourceId}] embedded ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}`,
      )
    }

    // 3. Insert chunks
    const inserted: InsertedChunk[] = []
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      const vec = `[${allEmbeddings[i].join(',')}]`
      const r = await db.query({
        sql: `INSERT INTO tantum.source_chunks (source_id, chunk_index, text, locator, page_number, embedding, authority_tier)
              VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
              RETURNING id, text, locator`,
        params: [
          sourceId,
          c.chunkIndex,
          c.text,
          c.locator,
          c.pageNumber ?? null,
          vec,
          source.authorityTier,
        ],
      })
      const row = r.rows[0]
      inserted.push({
        id: row.id as string,
        text: row.text as string,
        locator: row.locator as string,
      })
    }
    payload.logger.info(`[ingest:${sourceId}] inserted ${inserted.length} chunks`)

    // 4. Citation parsing
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

    // 5. Concept tagging (batched)
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
        payload.logger.info(
          `[ingest:${sourceId}] tagged ${Math.min(i + TAG_BATCH, inserted.length)}/${inserted.length}`,
        )
      }
    }

    // 6. Resolve previously-unresolved citations against the new chunks
    await db.execute({
      sql: `UPDATE tantum.source_chunk_citations c
            SET to_chunk_id = sc.id
            FROM tantum.source_chunks sc
            WHERE c.to_chunk_id IS NULL
              AND c.to_locator = sc.locator`,
    })

    // 7. Mark done
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

/**
 * Ingest a Source by downloading its uploaded file (PDF / DOCX / TXT),
 * extracting text, then handing off to ingestRawText for the embed +
 * persist pipeline.
 */
export async function ingestSource(payload: Payload, sourceId: number): Promise<void> {
  const source = await payload.findByID({ collection: 'sources', id: sourceId })
  if (!source.file) throw new Error(`Source ${sourceId} has no file`)

  const mediaId = typeof source.file === 'object' ? source.file.id : source.file
  const media = await payload.findByID({ collection: 'media', id: mediaId as number })
  const fileUrl = media.url
  if (!fileUrl) throw new Error('Media has no URL')

  const res = await fetch(fileUrl)
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())

  const format = detectFormat(media.filename ?? 'unknown')
  const { text } = await extractText(buf, format)

  await ingestRawText(payload, sourceId, text)
}
