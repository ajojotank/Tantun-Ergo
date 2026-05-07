import Link from 'next/link';
import Image from 'next/image';
import {
  formatInstructors,
  formatMinutes,
  type DoctrineCourseSummaryWire,
} from './types';

type Props = {
  course: DoctrineCourseSummaryWire;
  progressPercent?: number;        // 0-100, undefined when not signed in
  resumeHref?: string;              // overrides default href when continuing
};

export function CourseCard({ course, progressPercent, resumeHref }: Props) {
  const href = resumeHref ?? `/doctrine/${course.slug}`;
  const isResuming = typeof progressPercent === 'number' && progressPercent > 0;
  const ctaLabel = isResuming ? 'Continue' : 'Begin reading';
  const instructorLine = formatInstructors(course.instructors);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-md border border-ink/15 bg-vellum/60 transition-colors hover:border-ink/30"
    >
      {course.coverPlateUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink/5">
          <Image
            src={course.coverPlateUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] w-full bg-ink/5" />
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1">
          <h3 className="font-display text-2xl leading-tight text-ink">{course.title}</h3>
          {course.tagline ? (
            <p className="text-sm leading-snug text-ink/70">{course.tagline}</p>
          ) : null}
        </div>

        <p className="text-xs uppercase tracking-[0.18em] text-ink/55">
          {[
            instructorLine,
            `${course.totalModules} module${course.totalModules === 1 ? '' : 's'}`,
            `~${formatMinutes(course.totalEstimatedMinutes)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {course.modulePreview.length > 0 ? (
          <ul className="text-sm leading-snug text-ink/65">
            {course.modulePreview.map((m, i) => (
              <li key={i} className="line-clamp-1">{m}</li>
            ))}
          </ul>
        ) : null}

        {typeof progressPercent === 'number' ? (
          <div className="mt-auto space-y-1">
            <div className="h-[3px] w-full bg-ink/10">
              <div
                className="h-full bg-gilt"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink/55">
              {progressPercent}% complete
            </span>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium text-ink underline-offset-4 group-hover:underline">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
