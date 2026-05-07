import Link from 'next/link';
import {
  formatInstructors,
  type DoctrineCourseWire,
  type DoctrineModuleWire,
  type DoctrineUnitWire,
} from './types';

type Props = {
  course: DoctrineCourseWire;
  module: DoctrineModuleWire;
  unit: DoctrineUnitWire;
};

export function ResumeBanner({ course, module, unit }: Props) {
  const href = `/doctrine/${course.slug}/${module.slug}/${unit.slug}`;
  return (
    <Link
      href={href}
      className="block rounded-md border border-gilt/40 bg-gilt/[0.06] px-5 py-4 transition-colors hover:bg-gilt/[0.1]"
    >
      <span className="block text-[11px] uppercase tracking-[0.18em] text-gilt/80">
        Continue where you left off
      </span>
      <span className="mt-1 block font-display text-lg leading-tight text-ink">
        {course.title} — {module.title}: <em className="not-italic font-normal">{unit.title}</em>
      </span>
      {course.instructors.length > 0 ? (
        <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-ink/55">
          {formatInstructors(course.instructors)}
        </span>
      ) : null}
    </Link>
  );
}
