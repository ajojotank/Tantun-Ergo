import { describe, it, expect } from 'vitest'
import { chunkText, type LocatorFormat } from '../../src/catechist/chunker'

describe('chunkText', () => {
  it('chunks the Bible verse-by-verse with locators', () => {
    const text = `John 6:53 Then Jesus said to them: Amen, amen I say unto you...
John 6:54 He that eateth my flesh, and drinketh my blood, hath everlasting life...`
    const out = chunkText(text, 'bible', { sourceTitle: 'Douay-Rheims' })
    expect(out).toHaveLength(2)
    expect(out[0].locator).toBe('John 6:53')
    expect(out[1].locator).toBe('John 6:54')
    expect(out[0].text).toContain('Then Jesus said')
  })

  it('chunks CCC paragraph-by-paragraph', () => {
    const text = `1373 "Christ Jesus, who died, yes, who was raised from the dead..."
1374 The mode of Christ's presence under the Eucharistic species is unique...`
    const out = chunkText(text, 'ccc', { sourceTitle: 'CCC' })
    expect(out).toHaveLength(2)
    expect(out[0].locator).toBe('CCC §1373')
    expect(out[1].locator).toBe('CCC §1374')
  })

  it('chunks Summa article-by-article', () => {
    const text = `Question 32. The knowledge of the divine persons
Article 1. Whether the trinity of the divine persons can be known by natural reason?
I answer that, It is impossible to attain the knowledge of the Trinity by natural reason...
Article 2. Whether there are notional acts in God?
I answer that...`
    const out = chunkText(text, 'summa', { sourceTitle: 'Summa I' })
    expect(out.length).toBeGreaterThanOrEqual(2)
    expect(out[0].locator).toMatch(/Summa I, Q\. 32, a\. 1/)
    expect(out[1].locator).toMatch(/Summa I, Q\. 32, a\. 2/)
  })

  it('chunks generic text into ~600-token blocks', () => {
    const para = 'word '.repeat(800)
    const out = chunkText(para, 'generic', { sourceTitle: 'Generic Doc' })
    expect(out.length).toBeGreaterThanOrEqual(1)
    out.forEach((c, i) => {
      expect(c.locator).toBe(`Generic Doc, chunk ${i + 1}`)
      expect(c.text.length).toBeGreaterThan(0)
    })
  })

  it('returns chunk_index in order', () => {
    const text = `John 1:1 In the beginning was the Word.
John 1:2 The same was in the beginning with God.`
    const out = chunkText(text, 'bible', { sourceTitle: 'Douay-Rheims' })
    expect(out.map((c) => c.chunkIndex)).toEqual([0, 1])
  })
})
