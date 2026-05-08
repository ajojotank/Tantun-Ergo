import 'server-only'
import type { Payload } from 'payload'

export interface RateLimitResult {
  allowed: boolean
  used: number
  limit: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pool(payload: Payload): any { return (payload.db as any).pool }

export async function checkAndConsume(
  payload: Payload,
  memberId: number,
  bucket = 'ask',
): Promise<RateLimitResult> {
  const settings = await payload.findGlobal({ slug: 'settings' }).catch(() => null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const limit: number = (settings as any)?.catechistRateLimit?.dailyLimit ?? 50

  const countRes = await pool(payload).query(
    `SELECT count(*)::int AS used
       FROM tantum.catechist_rate_limits
      WHERE member_id = $1 AND bucket = $2 AND created_at > now() - interval '24 hours'`,
    [memberId, bucket],
  )
  const used: number = countRes.rows[0]?.used ?? 0
  if (used >= limit) return { allowed: false, used, limit }

  await pool(payload).query(
    `INSERT INTO tantum.catechist_rate_limits (member_id, bucket) VALUES ($1, $2)`,
    [memberId, bucket],
  )

  return { allowed: true, used: used + 1, limit }
}

export async function checkOnly(
  payload: Payload,
  memberId: number,
  bucket = 'ask',
): Promise<RateLimitResult> {
  const settings = await payload.findGlobal({ slug: 'settings' }).catch(() => null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const limit: number = (settings as any)?.catechistRateLimit?.dailyLimit ?? 50
  const r = await pool(payload).query(
    `SELECT count(*)::int AS used FROM tantum.catechist_rate_limits
      WHERE member_id = $1 AND bucket = $2 AND created_at > now() - interval '24 hours'`,
    [memberId, bucket],
  )
  const used: number = r.rows[0]?.used ?? 0
  return { allowed: used < limit, used, limit }
}
