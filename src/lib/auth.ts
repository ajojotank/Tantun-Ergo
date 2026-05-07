// src/lib/auth.ts
//
// Server-only auth helpers for end-user (Member) sessions. The studio
// (Users collection) is unaffected — this layer only reads/writes the
// payload-token cookie set by /api/members/login.
import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from './payload'

import type { Member } from '@/payload-types'

/**
 * Returns the current Member if the request carries a valid payload-token
 * cookie issued by /api/members/login. Returns null otherwise. Never throws.
 *
 * Note: payload.auth() returns whichever auth collection's user is in the
 * cookie — could be Members OR Users (stewards). We narrow to Members here;
 * a steward signed in to /admin will read as null from this function (which
 * is what we want — stewards aren't end-users of the LMS).
 */
export async function getMember(): Promise<Member | null> {
  try {
    const p = await payload()
    const result = await p.auth({ headers: await headers() })
    if (!result?.user) return null
    if (result.user.collection !== 'members') return null
    return result.user as Member
  } catch {
    // payload.auth throws on malformed JWTs / expired tokens. Treat any
    // failure as "no session" and let the caller redirect to signin.
    return null
  }
}

/**
 * Server-component helper: read the current Member or redirect to sign-in
 * with `?next=` set to the caller's path. Use at the top of any page that
 * requires authentication.
 */
export async function requireMember(currentPath: string): Promise<Member> {
  const member = await getMember()
  if (member) return member
  const next = encodeURIComponent(currentPath)
  redirect(`/account/signin?next=${next}`)
}

/**
 * Display name fallback — used by the header dropdown. Mirrors the
 * collection's admin.useAsTitle, but explicit so the frontend doesn't
 * have to know the field's defaulting rule.
 */
export function memberDisplayName(member: Member): string {
  if (member.displayName?.trim()) return member.displayName
  return member.email.split('@')[0] ?? member.email
}
