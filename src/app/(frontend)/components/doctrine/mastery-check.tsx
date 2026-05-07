'use client'

import type { DoctrineMasteryOption } from './types'

export function MasteryCheck({
  unitId: _unitId,
  prompt,
  options,
  previousAnswer: _previousAnswer,
}: {
  unitId: string
  prompt: string
  options: DoctrineMasteryOption[]
  previousAnswer: string | null
}) {
  // D3 replaces this stub with the real check + server action wiring.
  return (
    <section aria-labelledby="mastery-prompt" className="space-y-4">
      <h2
        id="mastery-prompt"
        className="font-display text-2xl italic leading-snug text-ink"
      >
        {prompt}
      </h2>
      <ul className="space-y-2">
        {options.map((o, i) => (
          <li
            key={i}
            className="rounded-xl border border-ink/15 bg-vellum-deep/40 px-4 py-3 font-display text-base italic text-ink"
          >
            {o.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
