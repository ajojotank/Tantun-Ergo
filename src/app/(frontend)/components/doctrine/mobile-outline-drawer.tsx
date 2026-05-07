'use client';

import { useState } from 'react';
import { CourseOutline } from './course-outline';
import type { DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  currentModuleSlug: string;
  currentUnitPath: string;
  completedUnitPaths: string[];
};

export function MobileOutlineDrawer({
  course,
  currentModuleSlug,
  currentUnitPath,
  completedUnitPaths,
}: Props) {
  const [open, setOpen] = useState(false);
  const completedSet = new Set(completedUnitPaths);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open course outline"
        className="rounded-sm border border-ink/15 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink/85 lg:hidden"
      >
        ☰ Outline
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="ml-auto h-full w-full max-w-md overflow-y-auto bg-vellum p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-4 text-sm uppercase tracking-[0.18em] text-ink/65"
            >
              ✕ Close
            </button>
            <CourseOutline
              course={course}
              currentModuleSlug={currentModuleSlug}
              currentUnitPath={currentUnitPath}
              completedUnitPaths={completedSet}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
