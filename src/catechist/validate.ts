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
