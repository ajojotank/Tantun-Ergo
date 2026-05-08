export interface ParsedCitation {
  canonical: string
  raw: string
}

const BIBLE_BOOKS = [
  'Genesis','Gen','Exodus','Exod','Leviticus','Lev','Numbers','Num','Deuteronomy','Deut',
  'Joshua','Josh','Judges','Judg','Ruth','1 Samuel','1 Sam','2 Samuel','2 Sam',
  '1 Kings','2 Kings','1 Chronicles','1 Chr','2 Chronicles','2 Chr','Ezra','Nehemiah','Neh',
  'Tobit','Tob','Judith','Jdt','Esther','Esth','1 Maccabees','1 Macc','2 Maccabees','2 Macc',
  'Job','Psalms','Psalm','Ps','Proverbs','Prov','Ecclesiastes','Eccl','Song of Songs','Song',
  'Wisdom','Wis','Sirach','Sir','Isaiah','Isa','Jeremiah','Jer','Lamentations','Lam',
  'Baruch','Bar','Ezekiel','Ezek','Daniel','Dan','Hosea','Hos','Joel','Amos','Obadiah','Obad',
  'Jonah','Micah','Mic','Nahum','Nah','Habakkuk','Hab','Zephaniah','Zeph','Haggai','Hag',
  'Zechariah','Zech','Malachi','Mal',
  'Matthew','Matt','Mark','Mk','Luke','Lk','John','Jn','Acts',
  'Romans','Rom','1 Corinthians','1 Cor','2 Corinthians','2 Cor','Galatians','Gal',
  'Ephesians','Eph','Philippians','Phil','Colossians','Col',
  '1 Thessalonians','1 Thess','2 Thessalonians','2 Thess',
  '1 Timothy','1 Tim','2 Timothy','2 Tim','Titus','Philemon','Phlm',
  'Hebrews','Heb','James','Jas','1 Peter','1 Pet','2 Peter','2 Pet',
  '1 John','2 John','3 John','Jude','Revelation','Rev',
]

const ENCYCLICAL_NAMES = [
  'Humanae Vitae','Veritatis Splendor','Fides et Ratio','Deus Caritas Est','Lumen Fidei',
  'Lumen Gentium','Dei Verbum','Sacrosanctum Concilium','Gaudium et Spes',
  'Dignitatis Humanae','Unitatis Redintegratio','Nostra Aetate','Ad Gentes',
  'Apostolicam Actuositatem','Optatam Totius','Perfectae Caritatis','Christus Dominus',
  'Presbyterorum Ordinis','Inter Mirifica','Orientalium Ecclesiarum','Gravissimum Educationis',
]

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Sort by descending length so multi-word entries match before their sub-strings
const sortedBooks = [...BIBLE_BOOKS].sort((a, b) => b.length - a.length)
const sortedEncyclicals = [...ENCYCLICAL_NAMES].sort((a, b) => b.length - a.length)

const BIBLE_RE = new RegExp(
  String.raw`(?<book>${sortedBooks.map(escapeRe).join('|')})\.?\s+(?<ch>\d+):(?<v>\d+)(?:[–\-](?<v2>\d+))?`,
  'g',
)
const CCC_RE = /\b(?:CCC|Catechism)\s*§?\s*(?<para>\d{1,4})\b/g
const TRENT_RE = /\bTrent,?\s*Sess(?:ion)?\.?\s+(?<sess>[IVX]+),?\s*Can(?:on)?\.?\s+(?<canon>\d+)\b/g
const ENC_RE = new RegExp(
  String.raw`(?<doc>${sortedEncyclicals.map(escapeRe).join('|')})\s*§\s*(?<sec>\d{1,3})`,
  'g',
)
const SUMMA_RE = /\bSumma,?\s+(?<part>I{1,3}(?:-II)?),?\s*Q\.?\s*(?<q>\d+),?\s*a\.?\s*(?<art>\d+)\b/g
const ROMAN_CAT_RE = /\bRoman Catechism,?\s+Part\s+(?<part>[IVX]+),?\s+Q\.?\s+(?<q>\d+)\b/g

export function parseCitations(text: string): ParsedCitation[] {
  const out: ParsedCitation[] = []
  const seen = new Set<string>()

  const push = (canonical: string, raw: string) => {
    if (seen.has(canonical)) return
    seen.add(canonical)
    out.push({ canonical, raw })
  }

  for (const m of text.matchAll(BIBLE_RE)) {
    const { book, ch, v } = m.groups!
    push(`${book} ${ch}:${v}`, m[0])
  }
  for (const m of text.matchAll(CCC_RE)) {
    push(`CCC §${m.groups!.para}`, m[0])
  }
  for (const m of text.matchAll(TRENT_RE)) {
    const { sess, canon } = m.groups!
    push(`Trent, Sess. ${sess}, Can. ${canon}`, m[0])
  }
  for (const m of text.matchAll(ENC_RE)) {
    const { doc, sec } = m.groups!
    push(`${doc} §${sec}`, m[0])
  }
  for (const m of text.matchAll(SUMMA_RE)) {
    const { part, q, art } = m.groups!
    push(`Summa ${part}, Q. ${q}, a. ${art}`, m[0])
  }
  for (const m of text.matchAll(ROMAN_CAT_RE)) {
    const { part, q } = m.groups!
    push(`Roman Catechism, Part ${part}, Q. ${q}`, m[0])
  }

  return out
}
