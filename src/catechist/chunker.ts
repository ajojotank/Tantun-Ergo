export type LocatorFormat =
  | 'bible' | 'ccc' | 'roman-catechism' | 'council-canon'
  | 'encyclical-section' | 'summa' | 'father-book-chapter' | 'generic'

export interface Chunk {
  text: string
  locator: string
  chunkIndex: number
  pageNumber?: number
}

export interface ChunkerOptions {
  sourceTitle: string
}

const APPROX_TOKEN_CHARS = 4
const TARGET_TOKENS = 600
const TARGET_CHARS = TARGET_TOKENS * APPROX_TOKEN_CHARS

// Bible books sorted longest-first so multi-word entries win the alternation
const BIBLE_BOOKS_SORTED = [
  'Song of Songs','1 Maccabees','2 Maccabees','1 Chronicles','2 Chronicles',
  '1 Corinthians','2 Corinthians','1 Thessalonians','2 Thessalonians',
  '1 Timothy','2 Timothy','1 Samuel','2 Samuel','1 Kings','2 Kings',
  '1 Peter','2 Peter','1 John','2 John','3 John',
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  'Ezra','Nehemiah','Tobit','Judith','Esther','Job','Psalms','Psalm','Proverbs',
  'Ecclesiastes','Wisdom','Sirach','Isaiah','Jeremiah','Lamentations','Baruch',
  'Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum',
  'Habakkuk','Zephaniah','Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts','Romans','Galatians','Ephesians',
  'Philippians','Colossians','Hebrews','James','Jude','Revelation',
  '1 Chr','2 Chr','1 Sam','2 Sam','1 Macc','2 Macc','1 Cor','2 Cor',
  '1 Thess','2 Thess','1 Tim','2 Tim','1 Pet','2 Pet',
  'Gen','Exod','Lev','Num','Deut','Josh','Judg','Neh','Tob','Jdt','Esth',
  'Ps','Prov','Eccl','Song','Wis','Sir','Isa','Jer','Lam','Bar','Ezek',
  'Dan','Hos','Obad','Mic','Nah','Hab','Zeph','Hag','Zech','Mal',
  'Matt','Mk','Lk','Jn','Rom','Gal','Eph','Phil','Col','Heb','Jas','Rev',
  'Phlm',
]

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const BIBLE_VERSE_RE = new RegExp(
  `(${BIBLE_BOOKS_SORTED.map(escapeRe).join('|')})\\s+(\\d+):(\\d+)`,
  'g',
)

function chunkBible(text: string): Array<{ locator: string; text: string }> {
  // Find all verse markers with their positions
  const markers: Array<{ locator: string; start: number; end: number }> = []
  for (const m of text.matchAll(BIBLE_VERSE_RE)) {
    const [, book, ch, v] = m
    markers.push({
      locator: `${book} ${ch}:${v}`,
      start: m.index!,
      end: m.index! + m[0].length,
    })
  }
  if (markers.length === 0) return []

  const out: Array<{ locator: string; text: string }> = []
  for (let i = 0; i < markers.length; i++) {
    const bodyStart = markers[i].end
    const bodyEnd = i + 1 < markers.length ? markers[i + 1].start : text.length
    const body = text.slice(bodyStart, bodyEnd).trim()
    out.push({
      locator: markers[i].locator,
      text: `${markers[i].locator} ${body}`.trim(),
    })
  }
  return out
}

function chunkCCC(text: string): Array<{ locator: string; text: string }> {
  // CCC paragraphs: lines starting with a 1-4 digit number followed by text
  const paraRe = /^\s*(\d{1,4})\s+([\s\S]*?)(?=^\s*\d{1,4}\s+|\s*$)/gm
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(paraRe)) {
    const body = m[2].trim()
    if (body) out.push({ locator: `CCC §${m[1]}`, text: body })
  }
  return out
}

function chunkRomanCatechism(text: string): Array<{ locator: string; text: string }> {
  const re = /Part\s+([IVX]+).*?Q(?:uestion)?\.?\s+(\d+)\.?\s+([\s\S]*?)(?=Part\s+[IVX]+.*?Q(?:uestion)?\.?\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, part, q, body] = m
    out.push({ locator: `Roman Catechism, Part ${part}, Q. ${q}`, text: body.trim() })
  }
  return out
}

function chunkCouncilCanon(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /Sess(?:ion)?\.?\s+([IVX]+).*?Can(?:on)?\.?\s+(\d+)\.?\s+([\s\S]*?)(?=Sess(?:ion)?\.?\s+[IVX]+|Can(?:on)?\.?\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, sess, canon, body] = m
    out.push({ locator: `${title}, Sess. ${sess}, Can. ${canon}`, text: body.trim() })
  }
  return out
}

function chunkEncyclicalSection(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /(?:^|\n)\s*(\d{1,3})\.\s+([\s\S]*?)(?=\n\s*\d{1,3}\.\s+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, sec, body] = m
    out.push({ locator: `${title} §${sec}`, text: body.trim() })
  }
  return out
}

function chunkSumma(text: string, partGuess: string): Array<{ locator: string; text: string }> {
  const part = partGuess.match(/I{1,3}(?:-II)?/)?.[0] ?? 'I'
  // We need to track the current Question number across Article matches
  const out: Array<{ locator: string; text: string }> = []

  // Find all Question and Article markers in order
  const qRe = /Question\s+(\d+)\./g
  const aRe = /Article\s+(\d+)\.\s+([\s\S]*?)(?=Article\s+\d+\.|Question\s+\d+\.|$)/g

  // Build a list of events: question changes and articles
  type Event = { type: 'q'; num: string; pos: number } | { type: 'a'; num: string; body: string; pos: number }
  const events: Event[] = []

  for (const m of text.matchAll(qRe)) {
    events.push({ type: 'q', num: m[1], pos: m.index! })
  }
  for (const m of text.matchAll(aRe)) {
    events.push({ type: 'a', num: m[1], body: m[2].trim(), pos: m.index! })
  }

  events.sort((a, b) => a.pos - b.pos)

  let currentQ = '1'
  for (const ev of events) {
    if (ev.type === 'q') {
      currentQ = ev.num
    } else {
      out.push({
        locator: `Summa ${part}, Q. ${currentQ}, a. ${ev.num}`,
        text: ev.body,
      })
    }
  }

  return out
}

function chunkFatherBookChapter(text: string, title: string): Array<{ locator: string; text: string }> {
  const re = /Book\s+([IVX]+),?\s+Chapter\s+(\d+)\.?\s+([\s\S]*?)(?=Book\s+[IVX]+|Chapter\s+\d+|$)/g
  const out: Array<{ locator: string; text: string }> = []
  for (const m of text.matchAll(re)) {
    const [, book, ch, body] = m
    out.push({ locator: `${title}, Book ${book}, Ch. ${ch}`, text: body.trim() })
  }
  if (out.length === 0) return chunkGeneric(text, title)
  return out
}

function chunkGeneric(text: string, title: string): Array<{ locator: string; text: string }> {
  const out: Array<{ locator: string; text: string }> = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let buf = ''
  let n = 0
  for (const s of sentences) {
    if (buf.length + s.length > TARGET_CHARS && buf.length > 0) {
      n += 1
      out.push({ locator: `${title}, chunk ${n}`, text: buf.trim() })
      buf = ''
    }
    buf += (buf ? ' ' : '') + s
  }
  if (buf.trim()) {
    n += 1
    out.push({ locator: `${title}, chunk ${n}`, text: buf.trim() })
  }
  return out
}

export function chunkText(
  text: string,
  format: LocatorFormat,
  opts: ChunkerOptions,
): Chunk[] {
  const dispatch: Record<LocatorFormat, () => Array<{ locator: string; text: string }>> = {
    bible: () => chunkBible(text),
    ccc: () => chunkCCC(text),
    'roman-catechism': () => chunkRomanCatechism(text),
    'council-canon': () => chunkCouncilCanon(text, opts.sourceTitle),
    'encyclical-section': () => chunkEncyclicalSection(text, opts.sourceTitle),
    summa: () => chunkSumma(text, opts.sourceTitle),
    'father-book-chapter': () => chunkFatherBookChapter(text, opts.sourceTitle),
    generic: () => chunkGeneric(text, opts.sourceTitle),
  }
  const raw = dispatch[format]()
  return raw.map((c, i) => ({ ...c, chunkIndex: i }))
}
