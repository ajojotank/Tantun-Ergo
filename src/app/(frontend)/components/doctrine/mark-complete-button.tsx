'use client';

import { useState, useTransition } from 'react';
import { markCompleteAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
  variant?: 'inline' | 'footer';
};

export function MarkCompleteButton({ unitPath, isAlreadyComplete, variant = 'inline' }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(isAlreadyComplete);

  const onClick = () => {
    if (optimisticDone) return;
    setOptimisticDone(true);
    startTransition(async () => {
      try {
        await markCompleteAction(unitPath);
      } catch (err) {
        console.error('markCompleteAction failed', err);
        setOptimisticDone(false);
      }
    });
  };

  const label = optimisticDone ? '✓ Folio complete' : 'Mark folio complete';

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending || optimisticDone}
        className={`flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
          optimisticDone ? 'bg-gilt/15 text-ink/85' : 'bg-ink text-vellum hover:opacity-90'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || optimisticDone}
      className={`mx-auto block rounded-sm border px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
        optimisticDone
          ? 'border-gilt/40 bg-gilt/10 text-ink/85'
          : 'border-ink bg-ink text-vellum hover:opacity-90'
      }`}
    >
      {label}
    </button>
  );
}
