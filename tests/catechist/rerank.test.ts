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
    expect(conceptOverlap([1, 2], [2, 3])).toBeCloseTo(1 / 3, 5)
  })
  it('returns 1 when fully overlapping', () => {
    expect(conceptOverlap([1, 2], [1, 2])).toBe(1)
  })
})

describe('scoreCandidate', () => {
  it('combines similarity, authority, and concept overlap', () => {
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
