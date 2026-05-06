// src/app/(frontend)/components/atlas/types.ts
//
// Wire shapes passed from server pages into the client AtlasShell + Pilgrimage
// components. Strictly serialisable.

export type MiracleType =
  | 'eucharistic'
  | 'marian'
  | 'healing'
  | 'stigmata'
  | 'incorruptible'
  | 'other'

export type EcclesialStatus =
  | 'approved'
  | 'recognised'
  | 'worthy-of-belief'
  | 'under-investigation'
  | 'not-constatat'

export type MiracleArtwork = {
  id: string
  url: string
  alt: string
  caption?: string | null
  attribution?: string | null
}

export type MiracleSource = {
  label: string
  url?: string | null
  attribution?: string | null
}

export type MiracleVideo = {
  url: string
  label?: string | null
  attribution?: string | null
}

export type MiracleSummary = {
  id: string
  slug: string
  title: string
  type: MiracleType
  ecclesialStatus: EcclesialStatus
  locationName: string
  coordinates: [number, number] // [lng, lat]
  yearOccurred: number
  dateApproximate: boolean
  approvalDate?: string | null
  approvingAuthority?: string | null
  summary: string
  narrative?: unknown // Lexical JSON
  sources: MiracleSource[]
  artwork: MiracleArtwork[]
  videos: MiracleVideo[]
  isSample: boolean
}

export type PilgrimageRouteStop = {
  miracle: MiracleSummary
  chapterNote?: string | null // optional override of the miracle's default summary
}

export type PilgrimageSummary = {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  intro?: string | null
  coverImage?: { url: string; alt: string } | null
  route: PilgrimageRouteStop[]
  isSample: boolean
}

export const TYPE_LABEL: Record<MiracleType, string> = {
  eucharistic: 'Eucharistic',
  marian: 'Marian',
  healing: 'Healing',
  stigmata: 'Stigmata',
  incorruptible: 'Incorruptible',
  other: 'Other',
}

export const STATUS_LABEL: Record<EcclesialStatus, string> = {
  approved: 'Approved',
  recognised: 'Recognised',
  'worthy-of-belief': 'Worthy of belief',
  'under-investigation': 'Under investigation',
  'not-constatat': 'Not constatat',
}

export const PIN_HEX: Record<MiracleType, string> = {
  eucharistic: '#8c2a2a',
  marian: '#1f3358',
  healing: '#b08a3e',
  stigmata: '#5e1a1a',
  incorruptible: '#6f7a3a',
  other: '#1a1410',
}

export function formatYear(yearOccurred: number, dateApproximate: boolean): string {
  const sign = yearOccurred < 0 ? ' BC' : ''
  const abs = Math.abs(yearOccurred)
  return `${dateApproximate ? 'c. ' : ''}${abs}${sign}`
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

// Roman numeral for chapter labels. Falls back to arabic for n > 12 — content
// team won't curate longer pilgrimages in v1; extend ROMAN if they do.
export function romanize(n: number): string {
  return ROMAN[n] ?? String(n)
}
