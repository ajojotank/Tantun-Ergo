'use server'

import { getMember } from '@/lib/auth'
import { saveMasteryAnswer } from '@/lib/doctrine-progress'
import { payload } from '@/lib/payload'

export type MasteryState = {
  status: 'idle' | 'saved' | 'error'
  affirmation: string | null
  isCorrect: boolean
  error: string | null
  /** Echo of the option text the user submitted, so the form can keep it selected after re-render. */
  selected: string | null
}

export const INITIAL_MASTERY: MasteryState = {
  status: 'idle',
  affirmation: null,
  isCorrect: false,
  error: null,
  selected: null,
}

export async function saveMasteryAction(
  _prev: MasteryState,
  formData: FormData,
): Promise<MasteryState> {
  const unitId = String(formData.get('unitId') ?? '')
  const optionText = String(formData.get('option') ?? '')

  if (!unitId || !optionText) {
    return { ...INITIAL_MASTERY, status: 'error', error: 'Missing data.' }
  }

  const member = await getMember()
  if (!member) {
    return {
      ...INITIAL_MASTERY,
      status: 'error',
      error: 'Sign in to save your answer.',
    }
  }

  // Refetch the unit doc and find the option by text. We trust the doc,
  // never the client — `isCorrect` is only set from the doc.
  const p = await payload()
  let unit
  try {
    unit = await p.findByID({
      collection: 'doctrine-units',
      id: unitId,
      depth: 0,
    })
  } catch {
    return { ...INITIAL_MASTERY, status: 'error', error: 'Unit not found.' }
  }

  const masteryRaw =
    unit && typeof unit.masteryCheck === 'object' && unit.masteryCheck !== null
      ? (unit.masteryCheck as Record<string, unknown>)
      : null
  const optionsRaw = Array.isArray(masteryRaw?.options) ? masteryRaw!.options : []
  const matched = optionsRaw.find((o) => {
    const oo = o as Record<string, unknown>
    return typeof oo.text === 'string' && oo.text === optionText
  }) as Record<string, unknown> | undefined

  if (!matched) {
    return {
      ...INITIAL_MASTERY,
      status: 'error',
      error: 'That option is no longer available.',
      selected: optionText,
    }
  }

  const isCorrect = Boolean(matched.isCorrect)
  const affirmation =
    typeof matched.affirmation === 'string' && matched.affirmation.trim()
      ? matched.affirmation
      : isCorrect
        ? 'Yes — kept faithfully.'
        : 'Worth turning back to the reading.'

  await saveMasteryAnswer(member, unitId, optionText, isCorrect)

  return {
    status: 'saved',
    affirmation,
    isCorrect,
    error: null,
    selected: optionText,
  }
}
