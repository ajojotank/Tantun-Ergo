'use server';

import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/auth';
import {
  markComplete as markCompleteLib,
  saveMasteryAnswer as saveMasteryLib,
} from '@/lib/doctrine-progress';

export async function markCompleteAction(unitPath: string): Promise<void> {
  const [course, module, unit] = unitPath.split('/');
  const currentPath = `/doctrine/${course}/${module}/${unit}`;
  const member = await requireMember(currentPath);
  await markCompleteLib(String(member.id), unitPath);
  revalidatePath(currentPath);
  revalidatePath(`/doctrine/${course}`);
}

export async function saveMasteryAction(
  unitPath: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  const [course, module, unit] = unitPath.split('/');
  const currentPath = `/doctrine/${course}/${module}/${unit}`;
  const member = await requireMember(currentPath);
  await saveMasteryLib(String(member.id), unitPath, answer, isCorrect);
  revalidatePath(currentPath);
  revalidatePath(`/doctrine/${course}`);
}
