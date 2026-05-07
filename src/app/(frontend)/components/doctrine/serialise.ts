import type {
  DoctrineCourse,
  Media,
  Member,
} from '@/payload-types';
import {
  romanizeLower,
  romanizeUpper,
  type DoctrineCourseSummaryWire,
  type DoctrineCourseWire,
  type DoctrineInstructorWire,
  type DoctrineLanesWire,
  type DoctrineMasteryCheckWire,
  type DoctrineModuleWire,
  type DoctrineResourceWire,
  type DoctrineUnitWire,
} from './types';

function isPopulatedMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'url' in value;
}

function mediaUrl(value: unknown): string | null {
  if (!isPopulatedMedia(value)) return null;
  return value.url ?? null;
}

function isPopulatedMember(value: unknown): value is Member {
  return typeof value === 'object' && value !== null && 'email' in value;
}

function serialiseInstructor(value: unknown): DoctrineInstructorWire | null {
  if (!isPopulatedMember(value)) return null;
  return {
    id: String(value.id),
    displayName: value.displayName ?? value.email,
    avatarUrl: mediaUrl(value.avatar),
  };
}

function serialiseResource(raw: NonNullable<NonNullable<DoctrineCourse['modules']>[number]['units']>[number]['resources']): DoctrineResourceWire[] {
  if (!raw) return [];
  const out: DoctrineResourceWire[] = [];
  for (const r of raw) {
    if (r.kind === 'download') {
      const href = mediaUrl(r.file);
      if (!href) continue;
      out.push({
        kind: 'download',
        label: r.label,
        description: r.description ?? null,
        href,
      });
    } else if (r.kind === 'link') {
      if (!r.url) continue;
      out.push({
        kind: 'link',
        label: r.label,
        description: r.description ?? null,
        href: r.url,
      });
    } else if (r.kind === 'citation') {
      if (!r.citation) continue;
      out.push({
        kind: 'citation',
        label: r.label,
        description: r.description ?? null,
        citation: r.citation,
        href: r.citationUrl ?? null,
      });
    }
  }
  return out;
}

function serialiseLanes(raw: NonNullable<NonNullable<DoctrineCourse['modules']>[number]['units']>[number]['lanes']): DoctrineLanesWire {
  // TODO: payload-types inlines the Lexical rich-text shape rather than using SerializedEditorState;
  // we cast here since the structures are compatible at runtime.
  const reading = (raw?.reading ?? null) as DoctrineLanesWire['reading'];
  const watchVideoUrl = mediaUrl(raw?.watchVideo);
  const listenAudioUrl = mediaUrl(raw?.listenAudio);
  return {
    reading,
    watchVideoUrl,
    listenAudioUrl,
    hasReading: !!reading,
    hasWatch: !!watchVideoUrl,
    hasListen: !!listenAudioUrl,
  };
}

function serialiseMasteryCheck(raw: NonNullable<NonNullable<DoctrineCourse['modules']>[number]['units']>[number]['masteryCheck']): DoctrineMasteryCheckWire | null {
  if (!raw?.prompt || !raw.options || raw.options.length === 0) return null;
  return {
    prompt: raw.prompt,
    options: raw.options.map((o) => ({
      text: o.text,
      isCorrect: Boolean(o.isCorrect),
      affirmation: o.affirmation ?? null,
    })),
  };
}

export function serialiseCourse(doc: DoctrineCourse): DoctrineCourseWire {
  const modules: DoctrineModuleWire[] = (doc.modules ?? []).map((m, mi) => {
    const units: DoctrineUnitWire[] = (m.units ?? []).map((u, ui) => ({
      title: u.title,
      slug: u.slug,
      unitPath: `${doc.slug}/${m.slug}/${u.slug}`,
      estimatedMinutes: u.estimatedMinutes ?? 5,
      // TODO: payload-types inlines the Lexical rich-text shape rather than using SerializedEditorState;
      // we cast here since the structures are compatible at runtime.
      introduction: (u.introduction ?? null) as DoctrineUnitWire['introduction'],
      lanes: serialiseLanes(u.lanes),
      resources: serialiseResource(u.resources),
      masteryCheck: serialiseMasteryCheck(u.masteryCheck),
      romanIndex: romanizeLower(ui + 1),
    }));
    return {
      title: m.title,
      slug: m.slug,
      summary: m.summary ?? '',
      romanIndex: romanizeUpper(mi + 1),
      units,
    };
  });

  const totalUnits = modules.reduce((sum, m) => sum + m.units.length, 0);
  const totalEstimatedMinutes = modules.reduce(
    (sum, m) => sum + m.units.reduce((s, u) => s + u.estimatedMinutes, 0),
    0,
  );

  const instructors: DoctrineInstructorWire[] = Array.isArray(doc.instructors)
    ? (doc.instructors.map(serialiseInstructor).filter(Boolean) as DoctrineInstructorWire[])
    : [];

  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    tagline: doc.tagline ?? '',
    summary: doc.summary ?? '',
    // TODO: payload-types inlines the Lexical rich-text shape rather than using SerializedEditorState;
    // we cast here since the structures are compatible at runtime.
    longDescription: (doc.longDescription ?? null) as DoctrineCourseWire['longDescription'],
    coverPlateUrl: mediaUrl(doc.coverPlate),
    instructors,
    learnPoints: (doc.learnPoints ?? []).map((lp) => lp.point).filter(Boolean),
    modules,
    totalUnits,
    totalEstimatedMinutes,
  };
}

export function serialiseCourseSummary(doc: DoctrineCourse): DoctrineCourseSummaryWire {
  const modulesRaw = doc.modules ?? [];
  const modulePreview = modulesRaw.slice(0, 2).map((m) => m.title).filter(Boolean);
  const totalUnits = modulesRaw.reduce((sum, m) => sum + (m.units?.length ?? 0), 0);
  const totalEstimatedMinutes = modulesRaw.reduce(
    (sum, m) => sum + (m.units ?? []).reduce((s, u) => s + (u.estimatedMinutes ?? 5), 0),
    0,
  );
  const instructors: DoctrineInstructorWire[] = Array.isArray(doc.instructors)
    ? (doc.instructors.map(serialiseInstructor).filter(Boolean) as DoctrineInstructorWire[])
    : [];

  return {
    id: String(doc.id),
    title: doc.title,
    slug: doc.slug,
    tagline: doc.tagline ?? '',
    summary: doc.summary ?? '',
    coverPlateUrl: mediaUrl(doc.coverPlate),
    instructors,
    modulePreview,
    totalModules: modulesRaw.length,
    totalUnits,
    totalEstimatedMinutes,
  };
}
