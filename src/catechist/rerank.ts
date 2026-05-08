export type AuthorityTier =
  | 'scripture' | 'council' | 'catechism' | 'encyclical'
  | 'father' | 'theologian' | 'other'

const WEIGHTS: Record<AuthorityTier, number> = {
  scripture: 1.0,
  council: 0.95,
  catechism: 0.85,
  encyclical: 0.75,
  father: 0.65,
  theologian: 0.55,
  other: 0.4,
}

export function authorityWeight(tier: AuthorityTier): number {
  return WEIGHTS[tier] ?? 0.4
}

export function conceptOverlap(queryConcepts: number[], chunkConcepts: number[]): number {
  if (queryConcepts.length === 0) return 0
  const q = new Set(queryConcepts)
  const c = new Set(chunkConcepts)
  let inter = 0
  for (const id of q) if (c.has(id)) inter += 1
  const union = new Set([...q, ...c]).size
  if (union === 0) return 0
  return inter / union
}

export interface ScoreInput {
  similarity: number
  authorityTier: AuthorityTier
  queryConcepts: number[]
  chunkConcepts: number[]
}

export function scoreCandidate(input: ScoreInput): number {
  const overlap = conceptOverlap(input.queryConcepts, input.chunkConcepts)
  return input.similarity * authorityWeight(input.authorityTier) * (1 + 0.3 * overlap)
}
