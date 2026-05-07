// src/lib/doctrine-progress.ts
//
// Server-only helpers for reading and upserting LmsProgress rows. The
// collection has no native (member,unit) composite uniqueness, so we
// emulate it here: find-then-update or create.
import 'server-only'

import { payload } from './payload'

import type { LmsProgress, Member } from '@/payload-types'

export async function findProgressForUnit(
  memberId: number | string,
  unitId: number | string,
): Promise<LmsProgress | null> {
  const p = await payload()
  const r = await p.find({
    collection: 'lms-progress',
    where: {
      and: [
        { member: { equals: memberId } },
        { unit: { equals: unitId } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  return (r.docs[0] as LmsProgress | undefined) ?? null
}

export async function findMostRecentProgress(
  memberId: number | string,
): Promise<LmsProgress | null> {
  const p = await payload()
  const r = await p.find({
    collection: 'lms-progress',
    where: { member: { equals: memberId } },
    sort: '-lastVisitedAt',
    limit: 1,
    depth: 3, // resolve unit → module → track for the resume banner
  })
  return (r.docs[0] as LmsProgress | undefined) ?? null
}

/**
 * Mark a unit as visited. Idempotent — creates a row on first call,
 * updates lastVisitedAt thereafter. Does NOT touch masteryAnswer.
 */
export async function touchProgress(
  member: Member,
  unitId: number | string,
): Promise<void> {
  const p = await payload()
  const existing = await findProgressForUnit(member.id, unitId)
  const now = new Date().toISOString()
  if (existing) {
    await p.update({
      collection: 'lms-progress',
      id: existing.id,
      data: { lastVisitedAt: now },
      overrideAccess: true,
    })
  } else {
    await p.create({
      collection: 'lms-progress',
      data: {
        member: member.id,
        unit: unitId as number,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  }
}

/**
 * Save a mastery answer. The caller has already validated (a) that the
 * member is signed in and (b) that the option text matches one of the
 * unit's options. We compute correctness server-side from the unit doc,
 * never trust the client.
 */
export async function saveMasteryAnswer(
  member: Member,
  unitId: number | string,
  answerText: string,
  isCorrect: boolean,
): Promise<void> {
  const p = await payload()
  const existing = await findProgressForUnit(member.id, unitId)
  const now = new Date().toISOString()
  if (existing) {
    await p.update({
      collection: 'lms-progress',
      id: existing.id,
      data: {
        masteryAnswer: answerText,
        masteryCorrect: isCorrect,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  } else {
    await p.create({
      collection: 'lms-progress',
      data: {
        member: member.id,
        unit: unitId as number,
        masteryAnswer: answerText,
        masteryCorrect: isCorrect,
        lastVisitedAt: now,
      },
      overrideAccess: true,
    })
  }
}
