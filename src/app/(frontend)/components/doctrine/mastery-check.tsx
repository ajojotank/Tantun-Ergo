'use client';

import { useState, useTransition } from 'react';
import { saveMasteryAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';
import type { DoctrineMasteryCheckWire } from './types';

type Props = {
  check: DoctrineMasteryCheckWire;
  unitPath: string;
  initialAnswer: string | null;
  initialCorrect: boolean;
};

export function MasteryCheck({ check, unitPath, initialAnswer, initialCorrect }: Props) {
  const [selected, setSelected] = useState<string | null>(initialAnswer);
  const [showResult, setShowResult] = useState<boolean>(initialAnswer !== null);
  const [isCorrect, setIsCorrect] = useState<boolean>(initialCorrect);
  const [pending, startTransition] = useTransition();

  const submit = (answer: string) => {
    const option = check.options.find((o) => o.text === answer);
    if (!option) return;
    setSelected(answer);
    setShowResult(true);
    setIsCorrect(option.isCorrect);
    startTransition(async () => {
      try {
        await saveMasteryAction(unitPath, answer, option.isCorrect);
      } catch (err) {
        console.error('saveMasteryAction failed', err);
      }
    });
  };

  const correctOption = check.options.find((o) => o.isCorrect);
  const affirmation =
    showResult && isCorrect ? correctOption?.affirmation ?? 'Yes — well noted.' : null;

  return (
    <section className="space-y-4 rounded-md border border-ink/15 bg-vellum/40 p-5">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Mastery check</h2>
      <p className="font-display text-lg leading-snug text-ink">{check.prompt}</p>
      <ul className="space-y-2">
        {check.options.map((opt) => {
          const isSelected = selected === opt.text;
          const isThisCorrect = showResult && isSelected && opt.isCorrect;
          const isThisWrong = showResult && isSelected && !opt.isCorrect;
          return (
            <li key={opt.text}>
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(opt.text)}
                className={`w-full rounded-sm border px-4 py-3 text-left text-sm leading-snug transition-colors ${
                  isThisCorrect
                    ? 'border-gilt bg-gilt/[0.1] text-ink'
                    : isThisWrong
                      ? 'border-ink/35 bg-ink/[0.04] text-ink/65'
                      : isSelected
                        ? 'border-ink/35 bg-ink/[0.04] text-ink/85'
                        : 'border-ink/15 bg-vellum text-ink/85 hover:border-ink/35'
                }`}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>
      {affirmation ? (
        <p className="text-sm italic leading-relaxed text-gilt-deep">{affirmation}</p>
      ) : null}
      {showResult && !isCorrect ? (
        <p className="text-sm italic leading-relaxed text-ink/65">
          Re-read the folio and try again when ready.
        </p>
      ) : null}
    </section>
  );
}
