import type { Payload } from 'payload'
import { embedOne } from './embedding'
import { tagChunks, type ConceptDef } from './conceptTagger'
import { scoreCandidate, type AuthorityTier } from './rerank'

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
