'use client';

import { useEffect, useRef } from 'react';
import { markCompleteAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
};

export function AutoCompleteSentinel({ unitPath, isAlreadyComplete }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isAlreadyComplete) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            markCompleteAction(unitPath).catch((err) => {
              console.error('autoComplete failed', err);
              firedRef.current = false;
            });
            obs.disconnect();
          }
        }
      },
      { threshold: 1.0, rootMargin: '0px 0px -10% 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [unitPath, isAlreadyComplete]);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
