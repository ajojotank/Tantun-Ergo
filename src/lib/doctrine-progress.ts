import 'server-only';
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import type { LmsProgress } from '@/payload-types';

export type DoctrineProgressRow = {
  id: string;
  unitPath: string;
  masteryAnswer: string | null;
  masteryCorrect: boolean;
  completedAt: string | null;
  lastVisitedAt: string | null;
};

function toRow(doc: LmsProgress): DoctrineProgressRow {
  return {
    id: String(doc.id),
    unitPath: doc.unitPath,
    masteryAnswer: doc.masteryAnswer ?? null,
    masteryCorrect: Boolean(doc.masteryCorrect),
    completedAt: doc.completedAt ?? null,
    lastVisitedAt: doc.lastVisitedAt ?? null,
  };
}

export async function findProgressForMember(memberId: string): Promise<DoctrineProgressRow[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: { member: { equals: memberId } } as Where,
    limit: 500,
    overrideAccess: true,
  });
  return result.docs.map(toRow);
}

export async function findProgressForUnit(
  memberId: string,
  unitPath: string,
): Promise<DoctrineProgressRow | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: {
      and: [
        { member: { equals: memberId } },
        { unitPath: { equals: unitPath } },
      ],
    } as Where,
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ? toRow(result.docs[0]) : null;
}

export async function findMostRecentProgress(memberId: string): Promise<DoctrineProgressRow | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: { member: { equals: memberId } } as Where,
    sort: '-lastVisitedAt',
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ? toRow(result.docs[0]) : null;
}

async function upsertProgress(
  memberId: string,
  unitPath: string,
  patch: Partial<Pick<LmsProgress, 'masteryAnswer' | 'masteryCorrect' | 'completedAt' | 'lastVisitedAt'>>,
): Promise<DoctrineProgressRow> {
  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: 'lmsProgress',
    where: {
      and: [{ member: { equals: memberId } }, { unitPath: { equals: unitPath } }],
    } as Where,
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'lmsProgress',
      id: existing.docs[0].id,
      data: patch,
      overrideAccess: true,
    });
    return toRow(updated);
  }

  const created = await payload.create({
    collection: 'lmsProgress',
    data: {
      member: Number(memberId),
      unitPath,
      ...patch,
    },
    overrideAccess: true,
  });
  return toRow(created);
}

export async function touchProgress(memberId: string, unitPath: string): Promise<void> {
  await upsertProgress(memberId, unitPath, { lastVisitedAt: new Date().toISOString() });
}

export async function markComplete(memberId: string, unitPath: string): Promise<void> {
  // Idempotent: do not overwrite an existing completedAt.
  const existing = await findProgressForUnit(memberId, unitPath);
  if (existing?.completedAt) {
    await upsertProgress(memberId, unitPath, { lastVisitedAt: new Date().toISOString() });
    return;
  }
  const now = new Date().toISOString();
  await upsertProgress(memberId, unitPath, { completedAt: now, lastVisitedAt: now });
}

export async function saveMasteryAnswer(
  memberId: string,
  unitPath: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  const patch: Partial<Pick<LmsProgress, 'masteryAnswer' | 'masteryCorrect' | 'completedAt' | 'lastVisitedAt'>> = {
    masteryAnswer: answer,
    masteryCorrect: isCorrect,
    lastVisitedAt: new Date().toISOString(),
  };
  if (isCorrect) {
    const existing = await findProgressForUnit(memberId, unitPath);
    if (!existing?.completedAt) patch.completedAt = new Date().toISOString();
  }
  await upsertProgress(memberId, unitPath, patch);
}
