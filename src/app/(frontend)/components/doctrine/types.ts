// src/app/(frontend)/components/doctrine/types.ts
//
// Wire shapes passed from doctrine server pages into the client unit player
// + plate components. Strictly serialisable. Mirrors the atlas/types.ts
// pattern — the server resolves Payload docs and serialises into these.

export type DoctrineTrackSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  coverPlate: { url: string; alt: string } | null
  order: number
  isSample: boolean
}

export type DoctrineModuleSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  trackSlug: string
  trackTitle: string
  order: number
  unitCount: number
  isSample: boolean
}

export type DoctrineUnitSummary = {
  id: string
  slug: string
  title: string
  moduleSlug: string
  moduleTitle: string
  trackSlug: string
  trackTitle: string
  order: number
  hasWatch: boolean
  hasListen: boolean
  isSample: boolean
}

export type DoctrineMasteryOption = {
  text: string
  isCorrect: boolean
  affirmation: string | null
}

export type DoctrineUnitFull = DoctrineUnitSummary & {
  introduction: unknown | null // Lexical JSON
  reading: unknown | null // Lexical JSON
  watchVideoUrl: string | null
  listenAudioUrl: string | null
  masteryPrompt: string | null
  masteryOptions: DoctrineMasteryOption[]
}

const ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
]

export function romanizeLower(n: number): string {
  return (ROMAN[n] ?? String(n)).toLowerCase()
}

export function romanize(n: number): string {
  return ROMAN[n] ?? String(n)
}
