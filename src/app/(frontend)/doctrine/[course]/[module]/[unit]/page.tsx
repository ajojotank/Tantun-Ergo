import { notFound } from 'next/navigation';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getCourse, findUnitInCourse } from '@/lib/doctrine';
import { findProgressForMember, findProgressForUnit, touchProgress } from '@/lib/doctrine-progress';
import { requireMember } from '@/lib/auth';
import { CourseChrome } from '@/app/(frontend)/components/doctrine/course-chrome';
import { CourseOutline } from '@/app/(frontend)/components/doctrine/course-outline';
import { LaneSwitcher } from '@/app/(frontend)/components/doctrine/lane-switcher';
import { MasteryCheck } from '@/app/(frontend)/components/doctrine/mastery-check';
import { ResourcesBlock } from '@/app/(frontend)/components/doctrine/resources-block';
import { MarkCompleteButton } from '@/app/(frontend)/components/doctrine/mark-complete-button';
import { UnitFooterNav } from '@/app/(frontend)/components/doctrine/unit-footer-nav';

export const dynamic = 'force-dynamic';

type PageParams = { course: string; module: string; unit: string };

export default async function UnitPlayerPage({ params }: { params: Promise<PageParams> }) {
  const { course: courseSlug, module: moduleSlug, unit: unitSlug } = await params;

  const member = await requireMember(`/doctrine/${courseSlug}/${moduleSlug}/${unitSlug}`);
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const found = findUnitInCourse(course, moduleSlug, unitSlug);
  if (!found) notFound();
  const { module, unit, indexInCourse, totalUnits, prev, next } = found;

  await touchProgress(String(member.id), unit.unitPath);

  const all = await findProgressForMember(String(member.id));
  const courseRows = all.filter((r) => r.unitPath.startsWith(`${course.slug}/`));
  const completed = courseRows.filter((r) => r.completedAt);
  const completedUnitPaths = new Set(completed.map((r) => r.unitPath));
  const progressPercent = course.totalUnits > 0
    ? Math.round((completed.length / course.totalUnits) * 100)
    : 0;

  const thisProgress = await findProgressForUnit(String(member.id), unit.unitPath);
  const isAlreadyComplete = !!thisProgress?.completedAt;

  return (
    <>
      <CourseChrome
        course={course}
        unitIndexInCourse={indexInCourse}
        totalUnits={totalUnits}
        progressPercent={progressPercent}
      />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-10">
        <aside className="hidden lg:block lg:sticky lg:top-[68px] lg:self-start lg:max-h-[calc(100vh-68px)] lg:overflow-y-auto">
          <CourseOutline
            course={course}
            currentModuleSlug={module.slug}
            currentUnitPath={unit.unitPath}
            completedUnitPaths={completedUnitPaths}
          />
        </aside>

        <article className="space-y-10">
          <header className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55">
              Module {module.romanIndex} · folio {unit.romanIndex}
            </p>
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              {unit.title}
            </h1>
            {unit.introduction ? (
              <div className="prose prose-stone max-w-[65ch] text-base leading-relaxed text-ink/75">
                <RichText data={unit.introduction as never} />
              </div>
            ) : null}
          </header>

          <LaneSwitcher
            lanes={unit.lanes}
            unitPath={unit.unitPath}
            isAlreadyComplete={isAlreadyComplete}
          />

          {unit.masteryCheck ? (
            <MasteryCheck
              check={unit.masteryCheck}
              unitPath={unit.unitPath}
              initialAnswer={thisProgress?.masteryAnswer ?? null}
              initialCorrect={thisProgress?.masteryCorrect ?? false}
            />
          ) : null}

          {unit.resources.length > 0 ? <ResourcesBlock resources={unit.resources} /> : null}

          <div className="pt-4">
            <MarkCompleteButton unitPath={unit.unitPath} isAlreadyComplete={isAlreadyComplete} variant="inline" />
          </div>

          <UnitFooterNav
            unitPath={unit.unitPath}
            isAlreadyComplete={isAlreadyComplete}
            prev={prev}
            next={next}
          />
        </article>
      </main>
    </>
  );
}
