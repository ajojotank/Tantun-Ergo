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
