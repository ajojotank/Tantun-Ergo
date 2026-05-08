import { describe, it, expect } from 'vitest'
import { parseCitations } from '../../src/catechist/citationParser'

describe('parseCitations', () => {
  it('parses Bible references', () => {
    const out = parseCitations('See John 6:53 and 1 Cor 11:23-26 for context.')
    expect(out).toEqual([
      { canonical: 'John 6:53', raw: 'John 6:53' },
      { canonical: '1 Cor 11:23', raw: '1 Cor 11:23-26' },
    ])
  })

  it('parses CCC paragraphs', () => {
    const out = parseCitations('Per CCC §1374 and Catechism 1376.')
    expect(out).toEqual([
      { canonical: 'CCC §1374', raw: 'CCC §1374' },
      { canonical: 'CCC §1376', raw: 'Catechism 1376' },
    ])
  })

  it('parses Trent canons', () => {
    const out = parseCitations('Cf. Trent, Sess. XIII, Can. 1.')
    expect(out).toEqual([
      { canonical: 'Trent, Sess. XIII, Can. 1', raw: 'Trent, Sess. XIII, Can. 1' },
    ])
  })

  it('parses encyclical sections', () => {
    const out = parseCitations('Veritatis Splendor §54 explains; Humanae Vitae § 11 also.')
    expect(out).toEqual([
      { canonical: 'Veritatis Splendor §54', raw: 'Veritatis Splendor §54' },
      { canonical: 'Humanae Vitae §11', raw: 'Humanae Vitae § 11' },
    ])
  })

  it('parses Summa articles', () => {
    const out = parseCitations('Summa I, Q. 32, a. 1; also Summa III, Q. 75, a. 4.')
    expect(out).toEqual([
      { canonical: 'Summa I, Q. 32, a. 1', raw: 'Summa I, Q. 32, a. 1' },
      { canonical: 'Summa III, Q. 75, a. 4', raw: 'Summa III, Q. 75, a. 4' },
    ])
  })

  it('parses Roman Catechism refs', () => {
    const out = parseCitations('Roman Catechism, Part II, Q. 7 says...')
    expect(out).toEqual([
      { canonical: 'Roman Catechism, Part II, Q. 7', raw: 'Roman Catechism, Part II, Q. 7' },
    ])
  })

  it('returns empty for text with no citations', () => {
    expect(parseCitations('Plain text with no references.')).toEqual([])
  })

  it('does not duplicate when the same ref appears twice', () => {
    const out = parseCitations('John 6:53 and again John 6:53 later.')
    expect(out).toHaveLength(1)
    expect(out[0].canonical).toBe('John 6:53')
  })
})
