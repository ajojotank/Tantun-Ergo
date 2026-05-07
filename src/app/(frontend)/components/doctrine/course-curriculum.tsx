import Link from 'next/link';
import { formatMinutes, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  completedUnitPaths: Set<string>;
  currentUnitPath: string | null;
};

function statusGlyph(state: 'done' | 'current' | 'todo') {
  if (state === 'done') return <span aria-label="Complete" className="text-gilt">✓</span>;
  if (state === 'current')
    return <span aria-label="In progress" className="text-gilt">⊙</span>;
  return <span aria-label="Not started" className="text-ink/30">○</span>;
}

function laneGlyphs(unit: { lanes: { hasReading: boolean; hasWatch: boolean; hasListen: boolean } }) {
  const items: string[] = [];
  if (unit.lanes.hasReading) items.push('R');
  if (unit.lanes.hasWatch) items.push('W');
  if (unit.lanes.hasListen) items.push('L');
  if (items.length === 0) return null;
  return (
    <span className="text-[10px] uppercase tracking-[0.22em] text-ink/45">{items.join(' · ')}</span>
  );
}

export function CourseCurriculum({ course, completedUnitPaths, currentUnitPath }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Curriculum</h2>
      <div className="space-y-6">
        {course.modules.map((m) => (
          <div key={m.slug} id={`module-${m.slug}`} className="space-y-2 scroll-mt-20">
            <h3 className="font-display text-xl leading-tight text-ink">
              <span className="text-ink/40">Module {m.romanIndex} ·</span> {m.title}
            </h3>
            {m.summary ? (
              <p className="text-sm leading-snug text-ink/65">{m.summary}</p>
            ) : null}
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {m.units.map((u) => {
                const href = `/doctrine/${course.slug}/${m.slug}/${u.slug}`;
                const isDone = completedUnitPaths.has(u.unitPath);
                const isCurrent = currentUnitPath === u.unitPath;
                const state: 'done' | 'current' | 'todo' = isDone
                  ? 'done'
                  : isCurrent
                    ? 'current'
                    : 'todo';
                return (
                  <li key={u.slug}>
                    <Link
                      href={href}
                      className="flex items-center gap-4 px-1 py-3 text-sm leading-snug transition-colors hover:bg-ink/[0.03]"
                    >
                      <span className="w-4 flex-shrink-0">{statusGlyph(state)}</span>
                      <span className="flex-1 text-ink/85">
                        <span className="font-display text-base text-ink">
                          folio {u.romanIndex}.
                        </span>{' '}
                        {u.title}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-ink/45">
                        ~{formatMinutes(u.estimatedMinutes)}
                      </span>
                      {laneGlyphs(u)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
