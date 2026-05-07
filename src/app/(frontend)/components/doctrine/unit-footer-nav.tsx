import Link from 'next/link';
import { MarkCompleteButton } from './mark-complete-button';

type NavTarget = { unitPath: string } | null;

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
  prev: NavTarget;
  next: NavTarget;
};

function targetHref(t: NavTarget): string | null {
  if (!t) return null;
  const [course, module, unit] = t.unitPath.split('/');
  return `/doctrine/${course}/${module}/${unit}`;
}

export function UnitFooterNav({ unitPath, isAlreadyComplete, prev, next }: Props) {
  const prevHref = targetHref(prev);
  const nextHref = targetHref(next);

  return (
    <nav
      aria-label="Folio navigation"
      className="grid grid-cols-3 gap-px border border-ink/15 bg-ink/15"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex items-center justify-center gap-2 bg-vellum px-4 py-3 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink/[0.03]"
        >
          <span aria-hidden>←</span> Prev
        </Link>
      ) : (
        <span className="flex items-center justify-center gap-2 bg-vellum/60 px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink/35">
          ← Prev
        </span>
      )}

      <MarkCompleteButton
        unitPath={unitPath}
        isAlreadyComplete={isAlreadyComplete}
        variant="footer"
      />

      {nextHref ? (
        <Link
          href={nextHref}
          className="flex items-center justify-center gap-2 bg-vellum px-4 py-3 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink/[0.03]"
        >
          Next <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className="flex items-center justify-center gap-2 bg-vellum/60 px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink/35">
          Next →
        </span>
      )}
    </nav>
  );
}
