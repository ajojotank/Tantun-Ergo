'use client'

import { motion } from 'framer-motion'
import { useActionState, useState } from 'react'

import {
  INITIAL_MASTERY,
  saveMasteryAction,
  type MasteryState,
} from '../../doctrine/[track]/[module]/[unit]/actions'
import type { DoctrineMasteryOption } from './types'

export function MasteryCheck({
  unitId,
  prompt,
  options,
  previousAnswer,
}: {
  unitId: string
  prompt: string
  options: DoctrineMasteryOption[]
  previousAnswer: string | null
}) {
  // Seed the local state with the previous answer so the user sees their
  // prior response on revisit. The server action confirms this and may
  // overwrite the affirmation/correctness on submit.
  const [selected, setSelected] = useState<string | null>(previousAnswer)
  const [state, action, pending] = useActionState<MasteryState, FormData>(
    saveMasteryAction,
    INITIAL_MASTERY,
  )

  // The currently shown affirmation: prefer the freshest server response,
  // fall back to the prior answer's affirmation looked up from `options`.
  const priorAffirmation =
    previousAnswer != null
      ? options.find((o) => o.text === previousAnswer)?.affirmation ?? null
      : null
  const affirmation = state.affirmation ?? priorAffirmation
  const isCorrect =
    state.status === 'saved'
      ? state.isCorrect
      : previousAnswer != null
        ? Boolean(options.find((o) => o.text === previousAnswer)?.isCorrect)
        : false
  const showAffirmation = Boolean(affirmation) && (selected != null)

  return (
    <section aria-labelledby="mastery-prompt" className="space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-rubric">
        Mastery · Do you remember?
      </p>
      <h2
        id="mastery-prompt"
        className="font-display text-2xl italic leading-snug text-ink md:text-3xl"
      >
        {prompt}
      </h2>
      <form action={action} className="space-y-3">
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="option" value={selected ?? ''} />
        <ul className="space-y-2">
          {options.map((o, i) => {
            const checked = selected === o.text
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setSelected(o.text)}
                  aria-pressed={checked}
                  className={`block w-full rounded-xl border px-4 py-3 text-left font-display text-base italic transition-colors ${
                    checked
                      ? 'border-ink bg-vellum-deep text-ink'
                      : 'border-ink/15 bg-vellum-deep/40 text-ink-soft hover:border-ink/30 hover:text-ink'
                  }`}
                >
                  {o.text}
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="submit"
          disabled={!selected || pending}
          className="rounded-full bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Saving…' : selected === previousAnswer ? 'Saved' : 'Submit'}
        </button>
      </form>
      {showAffirmation ? (
        <motion.p
          key={affirmation /* re-animate on change */}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22, mass: 0.5 }}
          className={`font-display text-lg italic leading-relaxed ${
            isCorrect ? 'text-incense' : 'text-rubric-deep'
          }`}
          aria-live="polite"
        >
          {affirmation}
        </motion.p>
      ) : null}
      {state.error ? (
        <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
      ) : null}
    </section>
  )
}
