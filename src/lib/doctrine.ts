import 'server-only';
import { getPayload } from 'payload';
import config from '@payload-config';
import type { DoctrineCourse } from '@/payload-types';
import { serialiseCourse, serialiseCourseSummary } from '@/app/(frontend)/components/doctrine/serialise';
import type {
  DoctrineCourseWire,
  DoctrineCourseSummaryWire,
  DoctrineModuleWire,
  DoctrineUnitWire,
} from '@/app/(frontend)/components/doctrine/types';

export async function getCourse(
  slug: string,
  opts: { includeDrafts?: boolean } = {},
): Promise<DoctrineCourseWire | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'doctrineCourses',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft: opts.includeDrafts ?? false,
    overrideAccess: opts.includeDrafts ?? false,
  });
  const doc = result.docs[0];
  if (!doc) return null;
  return serialiseCourse(doc as DoctrineCourse);
}

export async function getCourseList(): Promise<DoctrineCourseSummaryWire[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'doctrineCourses',
    sort: 'order',
    limit: 100,
    depth: 1,
  });
  return result.docs.map((doc) => serialiseCourseSummary(doc as DoctrineCourse));
}

export type FoundUnit = {
  module: DoctrineModuleWire;
  unit: DoctrineUnitWire;
  indexInCourse: number;
  totalUnits: number;
  prev: { unitPath: string } | null;
  next: { unitPath: string } | null;
};

export function findUnitInCourse(
  course: DoctrineCourseWire,
  modSlug: string,
  unitSlug: string,
): FoundUnit | null {
  const flat = flattenCourse(course);
  const idx = flat.findIndex(
    (entry) => entry.module.slug === modSlug && entry.unit.slug === unitSlug,
  );
  if (idx === -1) return null;

  return {
    module: flat[idx].module,
    unit: flat[idx].unit,
    indexInCourse: idx,
    totalUnits: flat.length,
    prev: idx > 0 ? { unitPath: flat[idx - 1].unit.unitPath } : null,
    next: idx < flat.length - 1 ? { unitPath: flat[idx + 1].unit.unitPath } : null,
  };
}

export type FlatUnitEntry = {
  module: DoctrineModuleWire;
  unit: DoctrineUnitWire;
};

export function flattenCourse(course: DoctrineCourseWire): FlatUnitEntry[] {
  const out: FlatUnitEntry[] = [];
  for (const m of course.modules) {
    for (const u of m.units) {
      out.push({ module: m, unit: u });
    }
  }
  return out;
}

export function firstUnitHref(course: DoctrineCourseWire): string {
  const first = course.modules[0]?.units[0];
  if (!first) return `/doctrine/${course.slug}`;
  return `/doctrine/${course.slug}/${course.modules[0].slug}/${first.slug}`;
}
