import Link from 'next/link';
import { romanizeLower, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  unitIndexInCourse: number;
  totalUnits: number;
  progressPercent: number;
};

export function CourseChrome({ course, unitIndexInCourse, totalUnits, progressPercent }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-vellum/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          href={`/doctrine/${course.slug}`}
          className="flex items-center gap-2 text-sm font-medium text-ink/85 transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span>
          <span className="line-clamp-1 max-w-[40ch]">{course.title}</span>
        </Link>

        <span aria-hidden className="text-ink/25">·</span>

        <span className="hidden text-xs uppercase tracking-[0.18em] text-ink/55 sm:inline">
          Folio {romanizeLower(unitIndexInCourse + 1)} of {romanizeLower(totalUnits)}
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-ink/55">
            Progress {progressPercent}%
          </span>
          <div className="hidden h-[3px] w-32 bg-ink/10 sm:block">
            <div className="h-full bg-gilt" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}
