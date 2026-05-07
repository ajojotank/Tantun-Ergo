import { notFound } from 'next/navigation';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getCourse, firstUnitHref } from '@/lib/doctrine';
import { getMember } from '@/lib/auth';
import { findProgressForMember, findMostRecentProgress } from '@/lib/doctrine-progress';
import { CourseHero } from '@/app/(frontend)/components/doctrine/course-hero';
import { LearnPoints } from '@/app/(frontend)/components/doctrine/learn-points';
import { CourseCurriculum } from '@/app/(frontend)/components/doctrine/course-curriculum';

export const dynamic = 'force-dynamic';

type PageParams = { course: string };

export default async function CourseLandingPage({ params }: { params: Promise<PageParams> }) {
  const { course: courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const member = await getMember();

  let progressPercent: number | null = null;
  let completedUnitPaths = new Set<string>();
  let currentUnitPath: string | null = null;
  let ctaHref = firstUnitHref(course);
  let ctaLabel = 'Begin reading';

  if (member) {
    const all = await findProgressForMember(String(member.id));
    const courseRows = all.filter((r) => r.unitPath.startsWith(`${course.slug}/`));
    const completed = courseRows.filter((r) => r.completedAt);
    completedUnitPaths = new Set(completed.map((r) => r.unitPath));
    progressPercent = course.totalUnits > 0
      ? Math.round((completed.length / course.totalUnits) * 100)
      : 0;

    const recent = await findMostRecentProgress(String(member.id));
    if (recent && recent.unitPath.startsWith(`${course.slug}/`)) {
      currentUnitPath = recent.unitPath;
      const [, modSlug, unitSlug] = recent.unitPath.split('/');
      ctaHref = `/doctrine/${course.slug}/${modSlug}/${unitSlug}`;
      ctaLabel = 'Continue reading';
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
      <CourseHero
        course={course}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
        progressPercent={progressPercent}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-8 lg:sticky lg:top-20 lg:self-start">
          {course.longDescription ? (
            <div className="space-y-3">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">About this course</h2>
              <div className="prose prose-stone max-w-none text-base leading-relaxed text-ink/85">
                <RichText data={course.longDescription} />
              </div>
            </div>
          ) : null}

          <LearnPoints points={course.learnPoints} />
        </div>

        <CourseCurriculum
          course={course}
          completedUnitPaths={completedUnitPaths}
          currentUnitPath={currentUnitPath}
        />
      </div>
    </main>
  );
}
