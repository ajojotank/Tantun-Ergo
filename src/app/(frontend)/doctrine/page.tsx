import { Suspense } from 'react';
import { getCourseList, getCourse, findUnitInCourse } from '@/lib/doctrine';
import { findMostRecentProgress, findProgressForMember } from '@/lib/doctrine-progress';
import { getMember } from '@/lib/auth';
import { CourseCard } from '@/app/(frontend)/components/doctrine/course-card';
import { ResumeBanner } from '@/app/(frontend)/components/doctrine/resume-banner';

export const dynamic = 'force-dynamic';

async function ResumeBannerSlot() {
  const member = await getMember();
  if (!member) return null;
  const recent = await findMostRecentProgress(String(member.id));
  if (!recent) return null;

  const [courseSlug, moduleSlug, unitSlug] = recent.unitPath.split('/');
  if (!courseSlug || !moduleSlug || !unitSlug) return null;

  const course = await getCourse(courseSlug);
  if (!course) return null;

  const found = findUnitInCourse(course, moduleSlug, unitSlug);
  if (!found) return null;

  return <ResumeBanner course={course} module={found.module} unit={found.unit} />;
}

export default async function DoctrineCataloguePage() {
  const courses = await getCourseList();
  const member = await getMember();

  // Compute per-course progress when signed in.
  const progressByCourseSlug = new Map<string, number>();
  if (member) {
    const all = await findProgressForMember(String(member.id));
    const completedByCourse = new Map<string, number>();
    for (const row of all) {
      if (!row.completedAt) continue;
      const slug = row.unitPath.split('/')[0];
      completedByCourse.set(slug, (completedByCourse.get(slug) ?? 0) + 1);
    }
    for (const c of courses) {
      const done = completedByCourse.get(c.slug) ?? 0;
      const pct = c.totalUnits > 0 ? Math.round((done / c.totalUnits) * 100) : 0;
      progressByCourseSlug.set(c.slug, pct);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
      <header className="mb-10 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Doctrine</p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          Take a course in the Catholic faith.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-ink/75">
          Read, watch, or listen — three lanes through every unit. Each course is built from short folios
          you can finish in an afternoon, with mastery checks to confirm what stuck.
        </p>
      </header>

      <Suspense fallback={null}>
        <div className="mb-10">
          <ResumeBannerSlot />
        </div>
      </Suspense>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            progressPercent={progressByCourseSlug.get(course.slug)}
          />
        ))}
      </section>
    </main>
  );
}
