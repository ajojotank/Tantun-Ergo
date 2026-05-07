'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMinutes, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  currentModuleSlug: string;
  currentUnitPath: string;
  completedUnitPaths: Set<string>;
};

function statusGlyph(state: 'done' | 'current' | 'todo') {
  if (state === 'done') return <span aria-label="Complete" className="text-gilt">✓</span>;
  if (state === 'current')
    return <span aria-label="In progress" className="text-gilt">⊙</span>;
  return <span aria-label="Not started" className="text-ink/30">○</span>;
}

export function CourseOutline({ course, currentModuleSlug, currentUnitPath, completedUnitPaths }: Props) {
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set([currentModuleSlug]),
  );

  const toggle = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <nav aria-label="Course outline" className="space-y-2 text-sm">
      <h2 className="px-3 pb-2 text-[11px] uppercase tracking-[0.22em] text-ink/55">
        Curriculum
      </h2>
      <ul className="space-y-1">
        {course.modules.map((m) => {
          const isExpanded = expandedSlugs.has(m.slug);
          return (
            <li key={m.slug}>
              <button
                type="button"
                onClick={() => toggle(m.slug)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-display text-base leading-tight text-ink hover:bg-ink/[0.03]"
                aria-expanded={isExpanded}
              >
                <span aria-hidden className="text-ink/45">{isExpanded ? '▼' : '▶'}</span>
                <span className="flex-1">
                  <span className="text-ink/45">Module {m.romanIndex} ·</span> {m.title}
                </span>
              </button>
              {isExpanded ? (
                <ul className="ml-3 space-y-px border-l border-ink/10 py-1">
                  {m.units.map((u) => {
                    const isCurrent = u.unitPath === currentUnitPath;
                    const isDone = completedUnitPaths.has(u.unitPath);
                    const state: 'done' | 'current' | 'todo' = isDone
                      ? 'done'
                      : isCurrent
                        ? 'current'
                        : 'todo';
                    const href = `/doctrine/${course.slug}/${m.slug}/${u.slug}`;
                    return (
                      <li key={u.slug}>
                        <Link
                          href={href}
                          className={`flex items-start gap-2 px-3 py-1.5 text-sm leading-snug transition-colors ${
                            isCurrent ? 'bg-gilt/[0.08] text-ink' : 'text-ink/75 hover:bg-ink/[0.03]'
                          }`}
                        >
                          <span className="w-3 flex-shrink-0">{statusGlyph(state)}</span>
                          <span className="flex-1">
                            <span className="font-display text-[15px] text-ink">folio {u.romanIndex}.</span>{' '}
                            {u.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                            ~{formatMinutes(u.estimatedMinutes)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
