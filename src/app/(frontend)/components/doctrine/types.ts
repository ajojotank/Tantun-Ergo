import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

export type DoctrineResourceWire =
  | { kind: 'download'; label: string; description: string | null; href: string }
  | { kind: 'link'; label: string; description: string | null; href: string }
  | { kind: 'citation'; label: string; description: string | null; citation: string; href: string | null };

export type DoctrineMasteryOptionWire = {
  text: string;
  isCorrect: boolean;
  affirmation: string | null;
};

export type DoctrineMasteryCheckWire = {
  prompt: string;
  options: DoctrineMasteryOptionWire[];
};

export type DoctrineLanesWire = {
  reading: SerializedEditorState | null;
  watchVideoUrl: string | null;
  listenAudioUrl: string | null;
  hasReading: boolean;
  hasWatch: boolean;
  hasListen: boolean;
};

export type DoctrineUnitWire = {
  title: string;
  slug: string;
  unitPath: string;
  estimatedMinutes: number;
  introduction: SerializedEditorState | null;
  lanes: DoctrineLanesWire;
  resources: DoctrineResourceWire[];
  masteryCheck: DoctrineMasteryCheckWire | null;
  romanIndex: string;
};

export type DoctrineModuleWire = {
  title: string;
  slug: string;
  summary: string;
  romanIndex: string;
  units: DoctrineUnitWire[];
};

export type DoctrineInstructorWire = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type DoctrineCourseWire = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  longDescription: SerializedEditorState | null;
  coverPlateUrl: string | null;
  instructors: DoctrineInstructorWire[];
  learnPoints: string[];
  modules: DoctrineModuleWire[];
  totalUnits: number;
  totalEstimatedMinutes: number;
};

export type DoctrineCourseSummaryWire = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  coverPlateUrl: string | null;
  instructors: DoctrineInstructorWire[];
  modulePreview: string[];
  totalModules: number;
  totalUnits: number;
  totalEstimatedMinutes: number;
};

const UPPER_ROMAN = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

const LOWER_ROMAN = UPPER_ROMAN.map((s) => s.toLowerCase());

export function romanizeUpper(n: number): string {
  return UPPER_ROMAN[n] ?? String(n);
}

export function romanizeLower(n: number): string {
  return LOWER_ROMAN[n] ?? String(n);
}

export function formatInstructors(instructors: DoctrineInstructorWire[]): string {
  if (instructors.length === 0) return '';
  if (instructors.length === 1) return instructors[0].displayName;
  if (instructors.length === 2) {
    return `${instructors[0].displayName} & ${instructors[1].displayName}`;
  }
  return `${instructors[0].displayName} and ${instructors.length - 1} others`;
}

export function formatMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

