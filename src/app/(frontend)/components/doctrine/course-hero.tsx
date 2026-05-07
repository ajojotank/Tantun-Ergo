import Image from 'next/image';
import Link from 'next/link';
import {
  formatInstructors,
  formatMinutes,
  type DoctrineCourseWire,
} from './types';

type Props = {
  course: DoctrineCourseWire;
  ctaHref: string;
  ctaLabel: string;
  progressPercent: number | null;
};

export function CourseHero({ course, ctaHref, ctaLabel, progressPercent }: Props) {
  return (
    <section className="grid gap-8 border-b border-ink/15 pb-10 lg:grid-cols-[2fr_3fr]">
      <div className="aspect-[16/10] w-full overflow-hidden bg-ink/5">
        {course.coverPlateUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={course.coverPlateUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col justify-center gap-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Doctrine course</p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{course.title}</h1>
        {course.tagline ? (
          <p className="font-display text-xl leading-snug text-ink/70">{course.tagline}</p>
        ) : null}
        <p className="text-sm uppercase tracking-[0.18em] text-ink/55">
          {[
            formatInstructors(course.instructors),
            `${course.modules.length} module${course.modules.length === 1 ? '' : 's'}`,
            `~${formatMinutes(course.totalEstimatedMinutes)}`,
            progressPercent !== null ? `${progressPercent}% complete` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        <div className="pt-2">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-sm border border-ink bg-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-vellum transition-opacity hover:opacity-90"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
