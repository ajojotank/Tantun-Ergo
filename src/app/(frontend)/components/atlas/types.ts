// src/app/(frontend)/components/atlas/types.ts
//
// Wire shape passed from the server `/atlas` page into the client AtlasShell.
// Strictly serialisable (no Date objects, no rich-text trees beyond JSON).

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
  narrative?: unknown // Lexical JSON; rendered via a permissive walker
  sources: MiracleSource[]
  artwork: MiracleArtwork[]
  inPilgrimage: boolean
  pilgrimageOrder?: number | null
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

// Pin colour by type. Tokens match @theme entries in globals.css. Hex is for
// Mapbox marker SVGs, which can't read CSS variables.
export const PIN_HEX: Record<MiracleType, string> = {
  eucharistic: '#8c2a2a', // rubric
  marian: '#1f3358', // lapis
  healing: '#b08a3e', // gilt
  stigmata: '#5e1a1a', // rubric-deep
  incorruptible: '#6f7a3a', // incense
  other: '#1a1410', // ink
}

// "c. 700" vs "700" rendering.
export function formatYear(yearOccurred: number, dateApproximate: boolean): string {
  const sign = yearOccurred < 0 ? ' BC' : ''
  const abs = Math.abs(yearOccurred)
  return `${dateApproximate ? 'c. ' : ''}${abs}${sign}`
}
