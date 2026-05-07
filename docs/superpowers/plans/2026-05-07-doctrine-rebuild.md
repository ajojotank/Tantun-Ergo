# Doctrine LMS Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Doctrine pillar as a Udemy-coded course platform — collapse the three-collection model (Tracks/Modules/Units) into a single nested `DoctrineCourses` collection, ship role-based access control on the studio, and rebuild all three doctrine surfaces (catalogue, course landing, unit player) to feel like a real LMS.

**Architecture:** Six phases. Phase A pivots the schema (Members.roles, DoctrineCourses with arrays, LmsProgress with unitPath, helpers + types + serialiser, bootstrap-admin script). Phase B re-seeds with bundled rich media (3 courses × 2 modules × 3 units, audio + video + PDFs). Phase C rebuilds the catalogue and course landing page. Phase D rebuilds the unit player (sticky chrome, collapsible sidebar, mark-complete server action with three triggers, resources block). Phase E layers full role-scoped access control + studio sidebar hiding + auto-attribution hook. Phase F deletes the old collections, routes, components, and DB tables, then runs the verification gate.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Payload CMS v3.84 (drafts + auth + access control + array fields), Postgres via Supabase pooler, Framer Motion v12, pnpm.

**Verification model:** No unit-test framework — gate is `pnpm typecheck && pnpm lint && pnpm build` after each task. ONE commit per task unless the task explicitly says otherwise. Final verification gate (Task F5) includes manual click-through with three roles per spec §11.

**Spec:** `docs/superpowers/specs/2026-05-07-doctrine-lms-rebuild-design.md`. Read it before starting. This plan implements that spec verbatim.

**Don't break:** Atlas pillar, Members/auth flows (apart from new `roles` field), pillar pages (`/`, `/reading`, `/manifesto`, `/credits`), site chrome, Catechist stub.

**Branch:** all work continues on `feat/foundation`. Push after each task.

---

## File map

```
NEW FILES — Phase A (schema + roles + helpers)
  src/collections/DoctrineCourses.ts                       (replaces three old collections)
  src/scripts/promote-admin.ts                              (CLI: pnpm admin:promote <email>)
  src/lib/doctrine.ts                                       (new — getCourse, findUnitInCourse, flattenCourse)

MODIFIED FILES — Phase A
  src/collections/Members.ts                                (add roles field)
  src/collections/LmsProgress.ts                            (drop unit relationship, add unitPath + completedAt)
  src/payload.config.ts                                     (register DoctrineCourses)
  src/payload-types.ts                                      (regenerated)
  package.json                                              (add admin:promote script)
  src/app/(frontend)/components/doctrine/types.ts           (rewrite for new wire shapes)
  src/app/(frontend)/components/doctrine/serialise.ts       (rewrite — single serialiseCourse fn)
  src/lib/doctrine-progress.ts                              (rewrite for unitPath keying + markComplete)

NEW FILES — Phase B (seed)
  src/scripts/seed-assets/LICENSES.md
  src/scripts/seed-assets/chant.mp3                         (~500KB, public-domain)
  src/scripts/seed-assets/catechesis.mp4                    (~3MB, public-domain)
  src/scripts/seed-assets/ccc-excerpt.pdf                   (~50KB, generated one-pager)
  src/scripts/seed-assets/prayer-card.pdf                   (~30KB, generated handout)

MODIFIED FILES — Phase B
  src/scripts/seed-doctrine.ts                              (rewrite — single-document writes per course)
  .gitattributes                                            (mark seed-assets as binary if needed)

NEW FILES — Phase C (catalogue + course landing)
  src/app/(frontend)/components/doctrine/course-card.tsx    (catalogue card)
  src/app/(frontend)/components/doctrine/course-hero.tsx    (landing hero)
  src/app/(frontend)/components/doctrine/course-curriculum.tsx (landing outline)
  src/app/(frontend)/components/doctrine/learn-points.tsx
  src/app/(frontend)/doctrine/[course]/page.tsx             (Udemy-style landing — replaces [track]/page.tsx)
  src/app/(frontend)/doctrine/[course]/[module]/page.tsx    (301 redirect)

MODIFIED FILES — Phase C
  src/app/(frontend)/doctrine/page.tsx                      (catalogue redesign)
  src/app/(frontend)/components/doctrine/resume-banner.tsx  (works against new types)

NEW FILES — Phase D (unit player rebuild)
  src/app/(frontend)/components/doctrine/course-chrome.tsx
  src/app/(frontend)/components/doctrine/course-outline.tsx (collapsible-by-module)
  src/app/(frontend)/components/doctrine/mark-complete-button.tsx
  src/app/(frontend)/components/doctrine/resources-block.tsx
  src/app/(frontend)/components/doctrine/unit-footer-nav.tsx
  src/app/(frontend)/components/doctrine/auto-complete-sentinel.tsx
  src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx
  src/app/(frontend)/doctrine/[course]/[module]/[unit]/actions.ts

MODIFIED FILES — Phase D
  src/app/(frontend)/components/doctrine/unit-player.tsx    (rebuild: drop editorial header, add chrome)
  src/app/(frontend)/components/doctrine/lane-switcher.tsx  (light tweak — wire types update)
  src/app/(frontend)/components/doctrine/mastery-check.tsx  (wire to mark-complete on correct)
  src/app/(frontend)/components/doctrine/progress-meter.tsx (sidebar variant prop)

MODIFIED FILES — Phase E (access control)
  src/collections/DoctrineCourses.ts                        (full access matrix + auto-attribute hook)
  src/collections/LmsProgress.ts                            (read access: own rows for learner, all for admin; admin.hidden)
  src/collections/Miracles.ts                               (admin.hidden for non-admins)
  src/collections/Pilgrimages.ts                            (admin.hidden for non-admins)
  src/collections/Members.ts                                (admin.hidden for non-admins; roles update access already from Phase A)
  src/collections/Media.ts                                  (read: public; mutate: admin or instructor)

DELETED FILES — Phase F (cleanup)
  src/collections/DoctrineTracks.ts
  src/collections/DoctrineModules.ts
  src/collections/DoctrineUnits.ts
  src/app/(frontend)/doctrine/[track]/                       (entire folder, recursively)
  src/app/(frontend)/components/doctrine/module-folio.tsx
  src/app/(frontend)/components/doctrine/unit-folio.tsx
  src/app/(frontend)/components/doctrine/track-plate.tsx     (replaced by course-card.tsx)
  src/app/(frontend)/components/doctrine/doctrine-outline.tsx (replaced by course-outline.tsx)
  src/app/(frontend)/components/doctrine/mobile-outline.tsx  (folded into course-outline.tsx)
  src/lib/doctrine-outline.ts                                (replaced by src/lib/doctrine.ts)

DROPPED DB TABLES — Phase F
  tantum.doctrine_tracks
  tantum.doctrine_modules
  tantum.doctrine_units
  (lms_progress is recreated, not dropped — see Task A4)
```

---

## Wire shapes (locked here for cross-task consistency)

These types live in `src/app/(frontend)/components/doctrine/types.ts` after Task A6. All later tasks reference them by name; do not invent variants.

```typescript
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
  unitPath: string;            // {courseSlug}/{moduleSlug}/{unitSlug}
  estimatedMinutes: number;
  introduction: SerializedEditorState | null;
  lanes: DoctrineLanesWire;
  resources: DoctrineResourceWire[];
  masteryCheck: DoctrineMasteryCheckWire | null;
  romanIndex: string;          // i, ii, iii, ...
};

export type DoctrineModuleWire = {
  title: string;
  slug: string;
  summary: string;
  romanIndex: string;          // I, II, III, ...
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
  modulePreview: string[];     // first 1–2 module titles
  totalModules: number;
  totalUnits: number;
  totalEstimatedMinutes: number;
};
```

---

## Phase A — Schema pivot + roles + helpers

### Task A1: Add `roles` field to Members + bootstrap-admin CLI

**Files:**
- Modify: `src/collections/Members.ts`
- Create: `src/scripts/promote-admin.ts`
- Modify: `package.json`

- [ ] **Step 1: Read the current Members collection.**

Run: `cat src/collections/Members.ts`. Confirm it exports a `CollectionConfig` with `slug: 'members'`, `auth: true`, and fields `[email, displayName, avatar]` (Payload's auth provides `email` + `password` automatically).

- [ ] **Step 2: Add the `roles` field to Members.**

Edit `src/collections/Members.ts`. Find the `fields` array. Append this entry to the array (placement doesn't matter, but put it after `avatar` for readability):

```typescript
{
  name: 'roles',
  type: 'select',
  hasMany: true,
  required: true,
  defaultValue: ['learner'],
  options: [
    { label: 'Admin', value: 'admin' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Learner', value: 'learner' },
  ],
  saveToJWT: true,
  access: {
    update: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  },
  admin: {
    description: 'Admins have full studio access. Instructors can author DoctrineCourses they own. Learners read the public site only.',
  },
},
```

- [ ] **Step 3: Regenerate Payload types.**

Run: `pnpm generate:types`.
Expected: `src/payload-types.ts` updated; new field `roles?: ('admin' | 'instructor' | 'learner')[] | null` (or required) on the `Member` type.

- [ ] **Step 4: Create the bootstrap-admin script.**

Create `src/scripts/promote-admin.ts`:

```typescript
import { getPayload } from 'payload';
import config from '@payload-config';
import { config as loadEnv } from 'dotenv';

loadEnv();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: pnpm admin:promote <email>');
    process.exit(1);
  }

  const payload = await getPayload({ config });

  const found = await payload.find({
    collection: 'members',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });

  if (found.docs.length === 0) {
    console.error(`No member found with email: ${email}`);
    process.exit(1);
  }

  const member = found.docs[0];
  const currentRoles = (member.roles ?? []) as string[];

  if (currentRoles.includes('admin')) {
    console.log(`${email} is already an admin (roles: ${currentRoles.join(', ')}). No-op.`);
    process.exit(0);
  }

  const nextRoles = Array.from(new Set([...currentRoles, 'admin']));

  await payload.update({
    collection: 'members',
    id: member.id,
    data: { roles: nextRoles as ('admin' | 'instructor' | 'learner')[] },
    overrideAccess: true,
  });

  console.log(`✓ Promoted ${email} to admin. Roles: ${nextRoles.join(', ')}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 5: Add the `admin:promote` script to package.json.**

Edit `package.json`. Find the `scripts` block. Add this line after `"seed:doctrine"`:

```json
"admin:promote": "tsx src/scripts/promote-admin.ts",
```

- [ ] **Step 6: Verify typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`.
Expected: both green. If `roles` field complains about union narrowing on `Member`, the regenerated `payload-types.ts` may need a re-gen — re-run Step 3.

- [ ] **Step 7: Commit.**

```bash
git add src/collections/Members.ts src/scripts/promote-admin.ts package.json src/payload-types.ts
git commit -m "feat(auth): add Members.roles field + admin-promote CLI"
```

---

### Task A2: Create the DoctrineCourses collection skeleton (basic access)

**Files:**
- Create: `src/collections/DoctrineCourses.ts`
- Modify: `src/payload.config.ts`

This task lays the schema with admin-only write access (per-role access matrix lands in Phase E, after the frontend depends on the data shape).

- [ ] **Step 1: Create `src/collections/DoctrineCourses.ts`.**

```typescript
import type { CollectionConfig, Validate } from 'payload';

const validateModuleSlug: Validate<string> = (value, { siblingData, data }) => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Slug must be lowercase alphanumeric with hyphens';

  const allModules = (data as { modules?: Array<{ slug?: string }> })?.modules ?? [];
  const duplicates = allModules.filter((m) => m?.slug === value).length;
  if (duplicates > 1) return `Module slug "${value}" is already used in this course`;

  return true;
};

const validateUnitSlug: Validate<string> = (value, { siblingData, data, path }) => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Slug must be lowercase alphanumeric with hyphens';

  // path is something like "modules.0.units.2.slug" — find the parent modules array index
  const pathParts = path?.split('.') ?? [];
  const moduleIdx = pathParts[1] ? parseInt(pathParts[1], 10) : NaN;
  if (Number.isNaN(moduleIdx)) return true;

  const allModules = (data as { modules?: Array<{ units?: Array<{ slug?: string }> }> })?.modules ?? [];
  const parentModule = allModules[moduleIdx];
  const allUnits = parentModule?.units ?? [];
  const duplicates = allUnits.filter((u) => u?.slug === value).length;
  if (duplicates > 1) return `Unit slug "${value}" is already used in this module`;

  return true;
};

export const DoctrineCourses: CollectionConfig = {
  slug: 'doctrineCourses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'instructors', 'order', '_status'],
    group: 'Doctrine',
  },
  versions: {
    drafts: true,
  },
  access: {
    // Phase E will replace these with the full per-role matrix.
    read: () => true,
    create: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    update: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL slug. Lowercase, hyphenated.' },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: { description: 'Hero subtitle on the course landing page.' },
    },
    {
      name: 'summary',
      type: 'text',
      admin: { description: 'One-line description shown on the catalogue card.' },
    },
    {
      name: 'longDescription',
      type: 'richText',
      admin: { description: 'Body prose on the course landing page.' },
    },
    {
      name: 'coverPlate',
      type: 'upload',
      relationTo: 'media',
      admin: { description: '16:10 cover art for catalogue + landing.' },
    },
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      filterOptions: () => ({ roles: { contains: 'instructor' } }),
      admin: {
        description: 'Members with the "instructor" role who author this course.',
      },
    },
    {
      name: 'learnPoints',
      type: 'array',
      labels: { singular: 'Learn Point', plural: "What You'll Learn" },
      fields: [{ name: 'point', type: 'text', required: true }],
      admin: { description: 'Bulleted "What you\'ll learn" list on the landing page.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order in the catalogue (lower first).' },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this course as seeded sample data.',
      },
    },
    {
      name: 'modules',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Module', plural: 'Modules' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, validate: validateModuleSlug },
        { name: 'summary', type: 'text' },
        {
          name: 'units',
          type: 'array',
          minRows: 1,
          labels: { singular: 'Unit', plural: 'Units' },
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'slug', type: 'text', required: true, validate: validateUnitSlug },
            {
              name: 'estimatedMinutes',
              type: 'number',
              required: true,
              defaultValue: 5,
              admin: { description: 'Estimated reading/watching time in minutes.' },
            },
            { name: 'introduction', type: 'richText' },
            {
              name: 'lanes',
              type: 'group',
              fields: [
                { name: 'reading', type: 'richText' },
                { name: 'watchVideo', type: 'upload', relationTo: 'media' },
                { name: 'listenAudio', type: 'upload', relationTo: 'media' },
              ],
            },
            {
              name: 'resources',
              type: 'array',
              labels: { singular: 'Resource', plural: 'References' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'description', type: 'text' },
                {
                  name: 'kind',
                  type: 'select',
                  required: true,
                  defaultValue: 'link',
                  options: [
                    { label: 'Download', value: 'download' },
                    { label: 'Link', value: 'link' },
                    { label: 'Citation', value: 'citation' },
                  ],
                },
                {
                  name: 'file',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { condition: (_data, sibling) => sibling?.kind === 'download' },
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: { condition: (_data, sibling) => sibling?.kind === 'link' },
                },
                {
                  name: 'citation',
                  type: 'text',
                  admin: { condition: (_data, sibling) => sibling?.kind === 'citation' },
                },
                {
                  name: 'citationUrl',
                  type: 'text',
                  admin: {
                    condition: (_data, sibling) => sibling?.kind === 'citation',
                    description: 'Optional URL to make the citation clickable.',
                  },
                },
              ],
            },
            {
              name: 'masteryCheck',
              type: 'group',
              fields: [
                { name: 'prompt', type: 'text' },
                {
                  name: 'options',
                  type: 'array',
                  fields: [
                    { name: 'text', type: 'text', required: true },
                    { name: 'isCorrect', type: 'checkbox', defaultValue: false },
                    { name: 'affirmation', type: 'text' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: Register DoctrineCourses in payload.config.ts.**

Edit `src/payload.config.ts`. Find the `collections` array. Add:

```typescript
import { DoctrineCourses } from '@/collections/DoctrineCourses';
```

at the top with the other collection imports, and add `DoctrineCourses` to the `collections` array. Keep `DoctrineTracks`, `DoctrineModules`, `DoctrineUnits` registered for now — they get deleted in Phase F after the new pages depend on the new collection.

- [ ] **Step 3: Regenerate types.**

Run: `pnpm generate:types`.
Expected: `DoctrineCourse` type appears in `src/payload-types.ts`.

- [ ] **Step 4: Generate a Drizzle migration to create the new tables.**

Run: `pnpm payload migrate:create doctrine_courses_init`.
Expected: a new file in `src/migrations/` named `<timestamp>_doctrine_courses_init.ts`. Inspect it briefly — it should `CREATE TABLE` for `doctrine_courses`, `doctrine_courses_modules`, `doctrine_courses_modules_units`, `doctrine_courses_modules_units_resources`, etc. (Payload generates one table per array level.) Do not edit the migration.

- [ ] **Step 5: Apply the migration.**

Run: `pnpm payload migrate`.
Expected: migration applies cleanly. New tables exist in the `tantum` schema (per project gotcha).

- [ ] **Step 6: Verify typecheck + lint + build.**

Run: `pnpm typecheck && pnpm lint && pnpm build`.
Expected: all green. If build fails on missing `DoctrineCourse` references in old code — those don't exist yet (the old code references `DoctrineUnit` etc.). Build should still pass.

- [ ] **Step 7: Commit.**

```bash
git add src/collections/DoctrineCourses.ts src/payload.config.ts src/payload-types.ts src/migrations/
git commit -m "feat(doctrine): DoctrineCourses collection (nested modules + units + resources)"
```

---

### Task A3: Modify LmsProgress for unitPath keying

**Files:**
- Modify: `src/collections/LmsProgress.ts`

LmsProgress currently keys on `unit: relationship → DoctrineUnits`. Per spec §4.3 we drop that field, add `unitPath: text` + `completedAt: date`, and add a unique compound index on `(member, unitPath)`. Test data is dropped via Drizzle migration.

- [ ] **Step 1: Read the current collection.**

Run: `cat src/collections/LmsProgress.ts`. Note the existing field names so the migration diff is clean.

- [ ] **Step 2: Rewrite `src/collections/LmsProgress.ts`.**

Replace the file's contents with:

```typescript
import type { CollectionConfig } from 'payload';

export const LmsProgress: CollectionConfig = {
  slug: 'lmsProgress',
  admin: {
    useAsTitle: 'unitPath',
    defaultColumns: ['member', 'unitPath', 'completedAt', 'lastVisitedAt'],
    group: 'Doctrine',
  },
  // Phase E will replace these with the full matrix.
  access: {
    read: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    create: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    update: ({ req }) => req.user?.roles?.includes('admin') ?? false,
    delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  },
  fields: [
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      index: true,
    },
    {
      name: 'unitPath',
      type: 'text',
      required: true,
      index: true,
      admin: { description: '{courseSlug}/{moduleSlug}/{unitSlug}' },
    },
    {
      name: 'masteryAnswer',
      type: 'text',
      admin: { description: 'The text of the option the member selected.' },
    },
    { name: 'masteryCorrect', type: 'checkbox' },
    {
      name: 'completedAt',
      type: 'date',
      admin: { description: 'Set on first mark-complete event; idempotent thereafter.' },
    },
    { name: 'lastVisitedAt', type: 'date' },
  ],
  indexes: [
    {
      fields: ['member', 'unitPath'],
      unique: true,
    },
  ],
};
```

- [ ] **Step 3: Generate the migration.**

Run: `pnpm payload migrate:create lms_progress_unitpath`.
Expected: a new migration file. Inspect it — it should DROP the old `unit_id` column and ADD `unit_path`, `completed_at`, plus the unique index. Test data already in `lms_progress` is incompatible; the migration may include a `DELETE FROM lms_progress` step or the column drop will cascade through any FKs. If Drizzle wants you to confirm data loss, that's expected — proceed.

- [ ] **Step 4: Apply the migration.**

Run: `pnpm payload migrate`.
Expected: migration applies. Old `lms_progress.unit_id` column gone, new columns + unique index in place.

- [ ] **Step 5: Regenerate types.**

Run: `pnpm generate:types`.
Expected: `LmsProgress` type updated — `unit` relationship gone, `unitPath: string`, `completedAt: string | null` (Payload renders dates as ISO strings on output).

- [ ] **Step 6: Verify typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`.
Expected: typecheck FAILS on `src/lib/doctrine-progress.ts` and `src/app/(frontend)/doctrine/[track]/...` because they reference the removed `unit` relationship. **This is expected** — Task A4 fixes `doctrine-progress.ts`, and Phase F deletes the old route files. For now, the build is in a known-broken state. Build will not pass either.

- [ ] **Step 7: Commit anyway with a marker.**

```bash
git add src/collections/LmsProgress.ts src/migrations/ src/payload-types.ts
git commit -m "feat(doctrine): LmsProgress keys on unitPath + completedAt (build broken until A4)"
```

The next task fixes the build.

---

### Task A4: Rewrite doctrine-progress lib for unitPath

**Files:**
- Modify: `src/lib/doctrine-progress.ts`

- [ ] **Step 1: Read the current lib.**

Run: `cat src/lib/doctrine-progress.ts`. Note the exports — likely `findProgressForUnit(memberId, unitId)`, `findMostRecentProgress(memberId)`, `touchProgress(memberId, unitId)`, `saveMasteryAnswer(...)`. We're keeping the same function shapes but switching the `unitId` parameter to `unitPath`, and adding `markComplete`.

- [ ] **Step 2: Replace `src/lib/doctrine-progress.ts`.**

```typescript
import 'server-only';
import { getPayload, type Where } from 'payload';
import config from '@payload-config';
import type { LmsProgress } from '@/payload-types';

export type DoctrineProgressRow = {
  id: string;
  unitPath: string;
  masteryAnswer: string | null;
  masteryCorrect: boolean;
  completedAt: string | null;
  lastVisitedAt: string | null;
};

function toRow(doc: LmsProgress): DoctrineProgressRow {
  return {
    id: String(doc.id),
    unitPath: doc.unitPath,
    masteryAnswer: doc.masteryAnswer ?? null,
    masteryCorrect: Boolean(doc.masteryCorrect),
    completedAt: doc.completedAt ?? null,
    lastVisitedAt: doc.lastVisitedAt ?? null,
  };
}

export async function findProgressForMember(memberId: string): Promise<DoctrineProgressRow[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: { member: { equals: memberId } } as Where,
    limit: 500,
    overrideAccess: true,
  });
  return result.docs.map(toRow);
}

export async function findProgressForUnit(
  memberId: string,
  unitPath: string,
): Promise<DoctrineProgressRow | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: {
      and: [
        { member: { equals: memberId } },
        { unitPath: { equals: unitPath } },
      ],
    } as Where,
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ? toRow(result.docs[0]) : null;
}

export async function findMostRecentProgress(memberId: string): Promise<DoctrineProgressRow | null> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'lmsProgress',
    where: { member: { equals: memberId } } as Where,
    sort: '-lastVisitedAt',
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ? toRow(result.docs[0]) : null;
}

async function upsertProgress(
  memberId: string,
  unitPath: string,
  patch: Partial<Pick<LmsProgress, 'masteryAnswer' | 'masteryCorrect' | 'completedAt' | 'lastVisitedAt'>>,
): Promise<DoctrineProgressRow> {
  const payload = await getPayload({ config });
  const existing = await payload.find({
    collection: 'lmsProgress',
    where: {
      and: [{ member: { equals: memberId } }, { unitPath: { equals: unitPath } }],
    } as Where,
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs[0]) {
    const updated = await payload.update({
      collection: 'lmsProgress',
      id: existing.docs[0].id,
      data: patch,
      overrideAccess: true,
    });
    return toRow(updated);
  }

  const created = await payload.create({
    collection: 'lmsProgress',
    data: {
      member: memberId,
      unitPath,
      ...patch,
    },
    overrideAccess: true,
  });
  return toRow(created);
}

export async function touchProgress(memberId: string, unitPath: string): Promise<void> {
  await upsertProgress(memberId, unitPath, { lastVisitedAt: new Date().toISOString() });
}

export async function markComplete(memberId: string, unitPath: string): Promise<void> {
  // Idempotent: do not overwrite an existing completedAt.
  const existing = await findProgressForUnit(memberId, unitPath);
  if (existing?.completedAt) {
    await upsertProgress(memberId, unitPath, { lastVisitedAt: new Date().toISOString() });
    return;
  }
  const now = new Date().toISOString();
  await upsertProgress(memberId, unitPath, { completedAt: now, lastVisitedAt: now });
}

export async function saveMasteryAnswer(
  memberId: string,
  unitPath: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  const patch: Partial<Pick<LmsProgress, 'masteryAnswer' | 'masteryCorrect' | 'completedAt' | 'lastVisitedAt'>> = {
    masteryAnswer: answer,
    masteryCorrect: isCorrect,
    lastVisitedAt: new Date().toISOString(),
  };
  if (isCorrect) {
    const existing = await findProgressForUnit(memberId, unitPath);
    if (!existing?.completedAt) patch.completedAt = new Date().toISOString();
  }
  await upsertProgress(memberId, unitPath, patch);
}
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: still FAILS, but now only on the old route files in `src/app/(frontend)/doctrine/[track]/...` (these are deleted in Phase F). The lib itself should typecheck cleanly.

- [ ] **Step 4: Commit.**

```bash
git add src/lib/doctrine-progress.ts
git commit -m "feat(doctrine): rewrite doctrine-progress for unitPath + markComplete"
```

---

### Task A5: New helpers — src/lib/doctrine.ts

**Files:**
- Create: `src/lib/doctrine.ts`

These helpers fetch and walk the new `DoctrineCourses` documents. They depend on the wire shapes locked above; the serializer (Task A6) produces these shapes.

- [ ] **Step 1: Create `src/lib/doctrine.ts`.**

```typescript
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
  indexInCourse: number;       // 0-based across the whole course
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
```

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: TS errors on missing `serialiseCourse` / `serialiseCourseSummary` / wire-shape types — these land in Task A6. Carry forward. Other errors should be unchanged.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/doctrine.ts
git commit -m "feat(doctrine): course/unit walker helpers (depends on A6 serialiser)"
```

---

### Task A6: Rewrite wire shapes + serialiser

**Files:**
- Modify: `src/app/(frontend)/components/doctrine/types.ts`
- Modify: `src/app/(frontend)/components/doctrine/serialise.ts`

- [ ] **Step 1: Replace `src/app/(frontend)/components/doctrine/types.ts`.**

Use the wire shapes locked at the top of this plan (the entire `Wire shapes` block). Plus add the romanize helpers from the existing file:

```typescript
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
```

- [ ] **Step 2: Replace `src/app/(frontend)/components/doctrine/serialise.ts`.**

```typescript
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
  const reading = raw?.reading ?? null;
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
      introduction: u.introduction ?? null,
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
    longDescription: doc.longDescription ?? null,
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
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: still FAILS on the old route files in `src/app/(frontend)/doctrine/[track]/...` (deleted in Phase F). The new lib + serialiser should typecheck.

- [ ] **Step 4: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/types.ts src/app/(frontend)/components/doctrine/serialise.ts
git commit -m "feat(doctrine): wire shapes + serialiser for nested course model"
```

---

## Phase B — Seed (rich media)

### Task B1: Source bundled seed assets

**Files:**
- Create: `src/scripts/seed-assets/LICENSES.md`
- Create: `src/scripts/seed-assets/chant.mp3`
- Create: `src/scripts/seed-assets/catechesis.mp4`
- Create: `src/scripts/seed-assets/ccc-excerpt.pdf`
- Create: `src/scripts/seed-assets/prayer-card.pdf`

This task is partly manual (downloading public-domain media) and partly mechanical (writing the LICENSES file).

- [ ] **Step 1: Create the directory.**

```bash
mkdir -p src/scripts/seed-assets
```

- [ ] **Step 2: Source the audio file.**

Download a short Gregorian chant or sacred-music recording from Wikimedia Commons that is in the **public domain** (not just CC-BY). Recommended candidates:
- `https://commons.wikimedia.org/wiki/File:Salve_Regina.ogg` (convert to MP3)
- `https://commons.wikimedia.org/wiki/File:Pange_Lingua_(Gregorian_chant).ogg`
- Any chant tagged "PD-old" or "PD-self".

Convert to MP3 if needed (via `ffmpeg -i input.ogg -b:a 128k chant.mp3`). Target ~30–60 seconds, ≤500KB. Save as `src/scripts/seed-assets/chant.mp3`.

If you can't access Wikimedia, an acceptable fallback is `https://archive.org/details/...` searched for "gregorian chant public domain". Do NOT use any file licensed CC-BY-NC, CC-BY-SA, or "all rights reserved."

- [ ] **Step 3: Source the video file.**

Find a short (~30–60s) public-domain Catholic-themed video clip. Candidates:
- archive.org has many old Catholic newsreels in the public domain
- Wikimedia Commons "Category:Catholic_Church_videos" filtered to PD
- A short clip of a Vatican procession or basilica interior

Trim to ≤30 seconds at 480p with `ffmpeg -i input.mp4 -t 30 -vf scale=854:480 -b:v 800k catechesis.mp4`. Target ≤3MB. Save as `src/scripts/seed-assets/catechesis.mp4`.

If sourcing is genuinely blocked, generate a 30-second slideshow MP4 from public-domain Catholic art (Caravaggio, Giotto) using ffmpeg's `concat` filter. Acceptable fallback.

- [ ] **Step 4: Create the CCC excerpt PDF.**

Create a one-page PDF containing a public-domain excerpt of the Catechism of the Catholic Church (the CCC text itself is copyrighted by the Vatican but allowed for educational use; for the seed asset, use a paragraph that's also reproduced in countless free Catholic resources — e.g. CCC §1324 on the Eucharist).

Easiest path: use any PDF tool (e.g. `pandoc -o ccc-excerpt.pdf - <<EOF`) to render a short markdown to PDF. Content:

```markdown
# Catechism of the Catholic Church — §1324

The Eucharist is "the source and summit of the Christian life."
"The other sacraments, and indeed all ecclesiastical ministries
and works of the apostolate, are bound up with the Eucharist
and are oriented toward it. For in the blessed Eucharist is
contained the whole spiritual good of the Church, namely Christ
himself, our Pasch."

— *Lumen Gentium* 11; cf. *Presbyterorum Ordinis* 5.

Source: Catechism of the Catholic Church, Second Edition, ©Libreria
Editrice Vaticana. Excerpt reproduced for educational use within
Tantum Ergo seed data.
```

Save as `src/scripts/seed-assets/ccc-excerpt.pdf`. Target ≤50KB.

- [ ] **Step 5: Create the prayer-card PDF.**

Same approach. Content:

```markdown
# Anima Christi

Soul of Christ, sanctify me.
Body of Christ, save me.
Blood of Christ, inebriate me.
Water from the side of Christ, wash me.
Passion of Christ, strengthen me.
O good Jesus, hear me.
Within Thy wounds hide me.
Permit me not to be separated from Thee.
From the malicious enemy defend me.
In the hour of my death call me.
And bid me come to Thee,
That with Thy Saints I may praise Thee
For ever and ever. Amen.

— Attributed to Pope John XXII (c. 1330). Public domain.
```

Save as `src/scripts/seed-assets/prayer-card.pdf`. Target ≤30KB.

- [ ] **Step 6: Write the LICENSES file.**

Create `src/scripts/seed-assets/LICENSES.md`:

```markdown
# Seed asset licenses

All assets in this directory are bundled into the repo for use by the
`pnpm seed:doctrine` script. They populate sample courses so a developer
can experience the full Doctrine LMS feature set end-to-end.

## chant.mp3
- **Source:** [exact Wikimedia Commons URL or archive.org URL]
- **License:** Public Domain
- **Author:** [original chant composer if known, else "Anonymous Gregorian"]
- **Use:** sample course audio lane content

## catechesis.mp4
- **Source:** [exact URL]
- **License:** Public Domain
- **Author:** [if known]
- **Use:** sample course video lane content

## ccc-excerpt.pdf
- **Source:** Hand-rendered from CCC §1324 text
- **License:** Excerpt of CCC text reproduced for educational use under
  fair-use / Vatican educational-use allowance.
- **Use:** sample course downloadable resource

## prayer-card.pdf
- **Source:** Hand-rendered from "Anima Christi" prayer
- **License:** Public Domain (prayer attributed to Pope John XXII, c. 1330)
- **Use:** sample course downloadable resource
```

Replace `[exact URL]` placeholders with the actual sources you used.

- [ ] **Step 7: Commit.**

```bash
git add src/scripts/seed-assets/
git commit -m "chore(seed): bundle public-domain media assets for doctrine seed"
```

---

### Task B2: Rewrite seed-doctrine.ts for nested courses + media

**Files:**
- Modify: `src/scripts/seed-doctrine.ts`

The new seed writes one `DoctrineCourses` document per course, uploads the four media assets (idempotently), and attaches them to lane fields and resources. Three courses × 2 modules × 3 units = 18 units total, matching the prior seed's content scope.

- [ ] **Step 1: Read the current seed.**

Run: `cat src/scripts/seed-doctrine.ts | head -80`. Note the existing course content (Eucharist, Mariology, Liturgical Year). The new seed reuses those titles + module titles + unit titles + reading-lane prose verbatim.

- [ ] **Step 2: Replace `src/scripts/seed-doctrine.ts` with the new shape.**

This is a long file. Write it as:

```typescript
import { getPayload } from 'payload';
import config from '@payload-config';
import { config as loadEnv } from 'dotenv';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Media } from '@/payload-types';

loadEnv();

type SeedMediaSpec = {
  filename: string;
  altText: string;
  mimeType: string;
};

type SeedResourceSpec =
  | { kind: 'download'; label: string; description: string; mediaKey: string }
  | { kind: 'link'; label: string; description: string; url: string }
  | { kind: 'citation'; label: string; description: string; citation: string; citationUrl?: string };

type SeedUnitSpec = {
  title: string;
  slug: string;
  estimatedMinutes: number;
  introduction: SerializedRichText;
  reading: SerializedRichText;
  watchVideoMediaKey?: string;
  listenAudioMediaKey?: string;
  resources: SeedResourceSpec[];
  masteryCheck?: {
    prompt: string;
    options: { text: string; isCorrect: boolean; affirmation?: string }[];
  };
};

type SeedModuleSpec = {
  title: string;
  slug: string;
  summary: string;
  units: SeedUnitSpec[];
};

type SeedCourseSpec = {
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  longDescription: SerializedRichText;
  coverPlateMediaKey?: string;
  learnPoints: string[];
  order: number;
  modules: SeedModuleSpec[];
};

// Lexical's serialized format. Keep it minimal — just paragraph + text nodes.
type SerializedRichText = {
  root: {
    type: 'root';
    format: '';
    indent: 0;
    version: 1;
    children: Array<{
      type: 'paragraph';
      format: '';
      indent: 0;
      version: 1;
      direction: 'ltr';
      textFormat: 0;
      textStyle: '';
      children: Array<{
        type: 'text';
        format: 0;
        style: '';
        mode: 'normal';
        text: string;
        version: 1;
        detail: 0;
      }>;
    }>;
    direction: 'ltr';
  };
};

function p(text: string): SerializedRichText {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              format: 0,
              style: '',
              mode: 'normal',
              text,
              version: 1,
              detail: 0,
            },
          ],
        },
      ],
    },
  };
}

const MEDIA_SPECS: Record<string, SeedMediaSpec> = {
  chant: {
    filename: 'chant.mp3',
    altText: 'Sample Gregorian chant audio',
    mimeType: 'audio/mpeg',
  },
  catechesis: {
    filename: 'catechesis.mp4',
    altText: 'Sample Catholic catechesis video',
    mimeType: 'video/mp4',
  },
  cccExcerpt: {
    filename: 'ccc-excerpt.pdf',
    altText: 'Catechism of the Catholic Church §1324 excerpt',
    mimeType: 'application/pdf',
  },
  prayerCard: {
    filename: 'prayer-card.pdf',
    altText: 'Anima Christi prayer card',
    mimeType: 'application/pdf',
  },
};

async function uploadMediaIfMissing(
  payload: Awaited<ReturnType<typeof getPayload>>,
  spec: SeedMediaSpec,
): Promise<Media> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: spec.filename } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) return existing.docs[0] as Media;

  const filePath = resolve(process.cwd(), 'src/scripts/seed-assets', spec.filename);
  const fileBuffer = await readFile(filePath);

  const created = await payload.create({
    collection: 'media',
    data: { alt: spec.altText },
    file: {
      data: fileBuffer,
      mimetype: spec.mimeType,
      name: spec.filename,
      size: fileBuffer.byteLength,
    },
    overrideAccess: true,
  });
  return created as Media;
}

const COURSE_SPECS: SeedCourseSpec[] = [
  {
    title: 'The Most Holy Eucharist',
    slug: 'eucharist',
    tagline: 'Source and summit of the Christian life.',
    summary: 'Three modules tracing what the Eucharist is, what it does, and how the Church has handed it down.',
    longDescription: p(
      'This course offers a careful introduction to the Eucharist as the centre of Catholic life — what the Church believes about the Real Presence, how the Mass enacts the once-for-all sacrifice of Calvary, and how the centuries of theological reflection have deepened our understanding without changing the substance of the mystery. Each unit pairs a short reading with a brief mastery check, and most carry recorded chant and supplementary readings for prayerful study.',
    ),
    coverPlateMediaKey: undefined, // optional
    learnPoints: [
      'Distinguish transubstantiation from consubstantiation and symbolic readings.',
      'Trace the Eucharistic prayer from its Jewish berakah roots to the Roman Canon.',
      'Articulate why the Church understands the Mass as a true sacrifice.',
      'Recognise the four ends of the Mass: adoration, thanksgiving, propitiation, petition.',
      'Explain the development of Eucharistic adoration outside Mass.',
      'Identify key magisterial documents from Lateran IV through Sacramentum Caritatis.',
    ],
    order: 0,
    modules: [
      {
        title: 'What the Eucharist Is',
        slug: 'what-it-is',
        summary: 'Real presence, transubstantiation, and the sacramental sign.',
        units: [
          {
            title: 'The Real Presence',
            slug: 'real-presence',
            estimatedMinutes: 8,
            introduction: p(
              'The Catholic Church teaches that in the Eucharist, Jesus Christ is truly, really, and substantially present under the appearances of bread and wine.',
            ),
            reading: p(
              'From the earliest centuries the Church has held that the bread and wine of the Eucharist, after the consecration, are no longer bread and wine but the Body and Blood of Jesus Christ. This is not a metaphor or mere symbol — it is a substantial change. St. Justin Martyr around AD 150 already speaks of this teaching as common Christian belief: "Not as common bread or common drink do we receive these, but… we have been taught that the food which is blessed by the prayer of His word… is the flesh and blood of that Jesus who was made flesh." The doctrine is not a medieval invention; it is the apostolic faith.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'Catechism §1374',
                description: 'On the Real Presence as "the most exalted of the sacraments"',
                citation: 'CCC §1374',
                citationUrl: 'https://www.vatican.va/archive/ENG0015/__P40.HTM',
              },
              {
                kind: 'link',
                label: 'Sacramentum Caritatis',
                description: 'Pope Benedict XVI on the sacrament of charity',
                url: 'https://www.vatican.va/content/benedict-xvi/en/apost_exhortations/documents/hf_ben-xvi_exh_20070222_sacramentum-caritatis.html',
              },
              {
                kind: 'download',
                label: 'CCC §1324 — A Foundational Excerpt',
                description: 'Printable one-page reflection on the Eucharist as source and summit',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'Which best describes the Catholic teaching on the Eucharist?',
              options: [
                { text: 'A symbolic reminder of the Last Supper', isCorrect: false },
                {
                  text: 'A substantial change of bread and wine into the Body and Blood of Christ',
                  isCorrect: true,
                  affirmation: 'Yes — this is the doctrine of transubstantiation.',
                },
                { text: 'A subjective spiritual experience of grace', isCorrect: false },
              ],
            },
          },
          {
            title: 'Transubstantiation',
            slug: 'transubstantiation',
            estimatedMinutes: 10,
            introduction: p(
              'The Council of Trent gave the technical term — but the reality it describes is older than the word.',
            ),
            reading: p(
              'The word "transubstantiation" was coined in the high middle ages, gathering and clarifying centuries of teaching about how the bread and wine become the Body and Blood of Christ. The substance — what something most fundamentally is — changes, while the accidents (appearance, taste, weight) remain those of bread and wine. The Council of Trent (1551) defined this dogmatically: "by the consecration of the bread and wine, a conversion is made of the whole substance of the bread into the substance of the Body of Christ Our Lord, and of the whole substance of the wine into the substance of His Blood; which conversion is, by the holy Catholic Church, suitably and properly called transubstantiation."',
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'citation',
                label: 'Council of Trent, Session 13',
                description: 'On the Real Presence and Transubstantiation, 1551',
                citation: 'Trent, Sess. 13, ch. 4',
              },
              {
                kind: 'link',
                label: 'Mysterium Fidei',
                description: 'Paul VI on the mystery of faith',
                url: 'https://www.vatican.va/content/paul-vi/en/encyclicals/documents/hf_p-vi_enc_03091965_mysterium.html',
              },
            ],
            masteryCheck: {
              prompt: 'In transubstantiation, what changes?',
              options: [
                { text: 'The accidents (appearance, taste)', isCorrect: false },
                {
                  text: 'The substance — what the bread and wine most fundamentally are',
                  isCorrect: true,
                  affirmation: 'Yes — substance changes; accidents remain.',
                },
                { text: 'Both substance and accidents', isCorrect: false },
              ],
            },
          },
          {
            title: 'The Sacramental Sign',
            slug: 'sacramental-sign',
            estimatedMinutes: 6,
            introduction: p(
              'The Eucharist is a sign that effects what it signifies — the Church\'s phrase for true sacramentality.',
            ),
            reading: p(
              'Sacraments are signs, but unlike ordinary signs they accomplish what they point to. A wedding ring is a sign of marriage; the Eucharist is the marriage of Christ and his Church, made present and operative. The bread and wine remain perceptible — that is the sign — but what they are has changed. The signs of bread and wine were not arbitrarily chosen: they signify nourishment and joy, the body sustained and the heart gladdened. The Eucharist nourishes the supernatural life and gladdens the soul not figuratively but in fact.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1131',
                description: 'On sacraments as efficacious signs',
                citation: 'CCC §1131',
              },
            ],
          },
        ],
      },
      {
        title: 'What the Eucharist Does',
        slug: 'what-it-does',
        summary: 'Sacrifice, communion, and the Church\'s memorial.',
        units: [
          {
            title: 'A True Sacrifice',
            slug: 'true-sacrifice',
            estimatedMinutes: 9,
            introduction: p(
              'The Mass is not a new sacrifice — it is the one sacrifice of Calvary made present.',
            ),
            reading: p(
              'The Letter to the Hebrews insists Christ "offered for all time a single sacrifice for sins." The Catholic Church does not contradict this — she affirms it. The Mass does not add to Calvary; it makes Calvary present in time. The same priest (Christ), the same victim (Christ), the same offering — only the manner differs. At Calvary the offering was bloody; in the Mass it is unbloody, sacramental, by the words and signs of the Eucharist. This is why the Church can call the Mass a true sacrifice without compromising the once-for-all character of the Cross.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'Hebrews 10:12',
                description: 'On the once-for-all sacrifice of Christ',
                citation: 'Heb 10:12',
              },
              {
                kind: 'download',
                label: 'Anima Christi',
                description: 'Traditional prayer of preparation and thanksgiving for Holy Communion',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'How is the Mass related to the sacrifice of Calvary?',
              options: [
                { text: 'It is a separate, new sacrifice', isCorrect: false },
                {
                  text: 'It is the same sacrifice of Calvary made present sacramentally',
                  isCorrect: true,
                  affirmation: 'Yes — same priest, same victim, different manner.',
                },
                { text: 'It is only a memorial banquet, not a sacrifice', isCorrect: false },
              ],
            },
          },
          {
            title: 'Holy Communion',
            slug: 'holy-communion',
            estimatedMinutes: 7,
            introduction: p(
              'To receive the Eucharist is to be drawn into the life of the Trinity itself.',
            ),
            reading: p(
              'St. Thomas Aquinas calls the Eucharist "the sacrament of charity." To receive worthily — that is, in a state of grace and with right intention — is to receive Christ himself, and through Christ to be drawn into the life of the Trinity. The fruits the tradition names are forgiveness of venial sin, strengthening against future sin, deepening of charity, growth in union with Christ, and pledge of future glory. This is not a list of separate gifts: they are facets of one gift, which is communion with the living God.',
            ),
            resources: [
              {
                kind: 'link',
                label: 'Ecclesia de Eucharistia',
                description: 'St. John Paul II on the Eucharist as the heart of the Church',
                url: 'https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_20030417_ecclesia_eucharistia.html',
              },
            ],
          },
          {
            title: 'The Memorial of the Lord',
            slug: 'memorial',
            estimatedMinutes: 6,
            introduction: p(
              'The Greek word "anamnesis" carries weight no English word quite captures.',
            ),
            reading: p(
              'When Jesus said "Do this in memory of me," the Greek word translated as "memory" is anamnesis. It does not mean "remember" the way we remember a dead friend — a backwards mental reaching. Anamnesis means making-present, drawing the past event into now. The Passover Seder is anamnesis: every generation says, "When the Lord brought us out of Egypt." Christ\'s words at the Last Supper take that biblical pattern and bring it to its fulfilment. The Mass is anamnesis of Calvary: not a recollection but a real making-present.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1363',
                description: 'On anamnesis and the Eucharistic memorial',
                citation: 'CCC §1363',
              },
            ],
          },
        ],
      },
    ],
  },

  // The remaining two courses are abbreviated for brevity in this plan.
  // The implementer fills them in following the same pattern, taking the
  // titles, module names, unit names, and reading text VERBATIM from the
  // current src/scripts/seed-doctrine.ts (in the Mariology and Liturgical
  // Year tracks). Each course gets its own learnPoints (4-6),
  // estimatedMinutes per unit (5-12 range), at least one media-rich unit,
  // and a mix of resource kinds.
  // ... (Mariology course goes here — same shape as Eucharist above)
  // ... (Liturgical Year course goes here)
];

async function seedCourse(
  payload: Awaited<ReturnType<typeof getPayload>>,
  spec: SeedCourseSpec,
  mediaMap: Map<string, Media>,
): Promise<void> {
  const existing = await payload.find({
    collection: 'doctrineCourses',
    where: { slug: { equals: spec.slug } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    console.log(`  ↺ skipping ${spec.slug} (already seeded)`);
    return;
  }

  const modules = spec.modules.map((m) => ({
    title: m.title,
    slug: m.slug,
    summary: m.summary,
    units: m.units.map((u) => {
      const watchMediaId = u.watchVideoMediaKey ? mediaMap.get(u.watchVideoMediaKey)?.id : undefined;
      const listenMediaId = u.listenAudioMediaKey ? mediaMap.get(u.listenAudioMediaKey)?.id : undefined;
      return {
        title: u.title,
        slug: u.slug,
        estimatedMinutes: u.estimatedMinutes,
        introduction: u.introduction,
        lanes: {
          reading: u.reading,
          watchVideo: watchMediaId,
          listenAudio: listenMediaId,
        },
        resources: u.resources.map((r) => {
          if (r.kind === 'download') {
            return {
              kind: 'download' as const,
              label: r.label,
              description: r.description,
              file: mediaMap.get(r.mediaKey)?.id,
            };
          }
          if (r.kind === 'link') {
            return {
              kind: 'link' as const,
              label: r.label,
              description: r.description,
              url: r.url,
            };
          }
          return {
            kind: 'citation' as const,
            label: r.label,
            description: r.description,
            citation: r.citation,
            citationUrl: r.citationUrl,
          };
        }),
        masteryCheck: u.masteryCheck
          ? {
              prompt: u.masteryCheck.prompt,
              options: u.masteryCheck.options,
            }
          : undefined,
      };
    }),
  }));

  await payload.create({
    collection: 'doctrineCourses',
    data: {
      title: spec.title,
      slug: spec.slug,
      tagline: spec.tagline,
      summary: spec.summary,
      longDescription: spec.longDescription,
      coverPlate: spec.coverPlateMediaKey ? mediaMap.get(spec.coverPlateMediaKey)?.id : undefined,
      learnPoints: spec.learnPoints.map((point) => ({ point })),
      order: spec.order,
      _isSample: true,
      _status: 'published',
      modules,
    },
    overrideAccess: true,
  });

  console.log(`  ✓ created ${spec.slug}`);
}

async function main() {
  const payload = await getPayload({ config });

  console.log('Uploading seed media…');
  const mediaMap = new Map<string, Media>();
  for (const [key, spec] of Object.entries(MEDIA_SPECS)) {
    const m = await uploadMediaIfMissing(payload, spec);
    mediaMap.set(key, m);
    console.log(`  ✓ ${key} → ${m.filename}`);
  }

  console.log('Seeding courses…');
  for (const spec of COURSE_SPECS) {
    await seedCourse(payload, spec, mediaMap);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Fill in the Mariology and Liturgical Year courses.**

Open the previous `seed-doctrine.ts` (via `git show HEAD~10:src/scripts/seed-doctrine.ts` or look at recent history). Copy the Mariology track's 2 modules × 3 units titles + introductions + readings, and the Liturgical Year track's 2 modules × 3 units. Format them as `SeedCourseSpec` entries appended to `COURSE_SPECS`.

Each new course needs:
- 4–6 `learnPoints` (write fresh — these didn't exist before)
- `estimatedMinutes` per unit (use 5–12m, sensible for the reading length)
- At least one unit with `listenAudioMediaKey: 'chant'` and one with `watchVideoMediaKey: 'catechesis'` (rotate so all lanes get exercised across the seed)
- 2–4 `resources` per unit, mixing kinds — every course has at least one `download`, one `link`, one `citation`
- Each unit has a `masteryCheck` with 3 options (1 correct)

This step is mechanical but bulky. Allocate a half-day. The verbatim source text is in the prior commit history.

- [ ] **Step 4: Run the seed against a clean DB.**

```bash
pnpm seed:doctrine
```

Expected:
```
Uploading seed media…
  ✓ chant → chant.mp3
  ✓ catechesis → catechesis.mp4
  ✓ cccExcerpt → ccc-excerpt.pdf
  ✓ prayerCard → prayer-card.pdf
Seeding courses…
  ✓ created eucharist
  ✓ created mariology
  ✓ created liturgical-year
Done.
```

If a unique-index error fires, you have stale data — drop the `doctrine_courses` rows manually via SQL and retry.

- [ ] **Step 5: Run the seed a second time to verify idempotency.**

```bash
pnpm seed:doctrine
```

Expected: all four media uploads skipped (filenames match), all three courses report `↺ skipping`.

- [ ] **Step 6: Verify typecheck + build.**

Run: `pnpm typecheck && pnpm build`.
Expected: typecheck still fails on old route files (deleted in Phase F). Build will not pass yet. Commit anyway.

- [ ] **Step 7: Commit.**

```bash
git add src/scripts/seed-doctrine.ts
git commit -m "feat(doctrine): rewrite seed for nested courses + bundled rich media"
```

---

## Phase C — Catalogue + course landing

### Task C1: Course card component (catalogue)

**Files:**
- Create: `src/app/(frontend)/components/doctrine/course-card.tsx`

- [ ] **Step 1: Create the file.**

```tsx
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
```

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: `course-card.tsx` typechecks. Old route errors persist.

- [ ] **Step 3: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/course-card.tsx
git commit -m "feat(doctrine): CourseCard for catalogue grid"
```

---

### Task C2: Catalogue page redesign

**Files:**
- Modify: `src/app/(frontend)/doctrine/page.tsx`
- Modify: `src/app/(frontend)/components/doctrine/resume-banner.tsx`

- [ ] **Step 1: Update ResumeBanner for the new wire shape.**

Read the current `resume-banner.tsx`. It currently takes a track + module + unit object. Update it to take the new `DoctrineCourseWire` + `DoctrineUnitWire`:

```tsx
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
```

- [ ] **Step 2: Replace `src/app/(frontend)/doctrine/page.tsx`.**

```tsx
import { Suspense } from 'react';
import { getCourseList, getCourse } from '@/lib/doctrine';
import { findMostRecentProgress } from '@/lib/doctrine-progress';
import { findUnitInCourse } from '@/lib/doctrine';
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
  let progressByCourseSlug = new Map<string, number>();
  if (member) {
    const { findProgressForMember } = await import('@/lib/doctrine-progress');
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
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: catalogue typechecks. Errors only on old `[track]` route files (Phase F).

- [ ] **Step 4: Smoke test in dev.**

```bash
pnpm dev
```

Visit `http://localhost:3000/doctrine`. Expected: three course cards in a 3-column grid, with cover plates rendered (or empty placeholders), instructor / module-count / minutes meta line, and module previews. Resume banner appears only if signed in with progress.

Stop the dev server.

- [ ] **Step 5: Commit.**

```bash
git add src/app/(frontend)/doctrine/page.tsx src/app/(frontend)/components/doctrine/resume-banner.tsx
git commit -m "feat(doctrine): catalogue redesign with denser cards + new resume banner"
```

---

### Task C3: Course landing page

**Files:**
- Create: `src/app/(frontend)/doctrine/[course]/page.tsx`
- Create: `src/app/(frontend)/components/doctrine/course-hero.tsx`
- Create: `src/app/(frontend)/components/doctrine/course-curriculum.tsx`
- Create: `src/app/(frontend)/components/doctrine/learn-points.tsx`

This task creates the new `[course]` route folder. Until Phase F deletes the old `[track]` folder, both exist in parallel — the new course page is the canonical one because the new collection has different slugs.

- [ ] **Step 1: Create the directory.**

```bash
mkdir -p "src/app/(frontend)/doctrine/[course]/[module]/[unit]"
```

- [ ] **Step 2: Create `course-hero.tsx`.**

```tsx
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
```

- [ ] **Step 3: Create `learn-points.tsx`.**

```tsx
type Props = { points: string[] };

export function LearnPoints({ points }: Props) {
  if (points.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">What you'll learn</h2>
      <ul className="space-y-2 text-sm leading-relaxed text-ink/85">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="mt-[0.4em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gilt" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Create `course-curriculum.tsx`.**

```tsx
import Link from 'next/link';
import { formatMinutes, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  completedUnitPaths: Set<string>;
  currentUnitPath: string | null;
};

function statusGlyph(state: 'done' | 'current' | 'todo') {
  if (state === 'done') return <span aria-label="Complete" className="text-gilt">✓</span>;
  if (state === 'current')
    return <span aria-label="In progress" className="text-gilt">⊙</span>;
  return <span aria-label="Not started" className="text-ink/30">○</span>;
}

function laneGlyphs(unit: { lanes: { hasReading: boolean; hasWatch: boolean; hasListen: boolean } }) {
  const items: string[] = [];
  if (unit.lanes.hasReading) items.push('R');
  if (unit.lanes.hasWatch) items.push('W');
  if (unit.lanes.hasListen) items.push('L');
  if (items.length === 0) return null;
  return (
    <span className="text-[10px] uppercase tracking-[0.22em] text-ink/45">{items.join(' · ')}</span>
  );
}

export function CourseCurriculum({ course, completedUnitPaths, currentUnitPath }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Curriculum</h2>
      <div className="space-y-6">
        {course.modules.map((m) => (
          <div key={m.slug} id={`module-${m.slug}`} className="space-y-2 scroll-mt-20">
            <h3 className="font-display text-xl leading-tight text-ink">
              <span className="text-ink/40">Module {m.romanIndex} ·</span> {m.title}
            </h3>
            {m.summary ? (
              <p className="text-sm leading-snug text-ink/65">{m.summary}</p>
            ) : null}
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {m.units.map((u) => {
                const href = `/doctrine/${course.slug}/${m.slug}/${u.slug}`;
                const isDone = completedUnitPaths.has(u.unitPath);
                const isCurrent = currentUnitPath === u.unitPath;
                const state: 'done' | 'current' | 'todo' = isDone
                  ? 'done'
                  : isCurrent
                    ? 'current'
                    : 'todo';
                return (
                  <li key={u.slug}>
                    <Link
                      href={href}
                      className="flex items-center gap-4 px-1 py-3 text-sm leading-snug transition-colors hover:bg-ink/[0.03]"
                    >
                      <span className="w-4 flex-shrink-0">{statusGlyph(state)}</span>
                      <span className="flex-1 text-ink/85">
                        <span className="font-display text-base text-ink">
                          folio {u.romanIndex}.
                        </span>{' '}
                        {u.title}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-ink/45">
                        ~{formatMinutes(u.estimatedMinutes)}
                      </span>
                      {laneGlyphs(u)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `[course]/page.tsx`.**

```tsx
import { notFound } from 'next/navigation';
import { getCourse, firstUnitHref, flattenCourse } from '@/lib/doctrine';
import { getMember } from '@/lib/auth';
import { findProgressForMember, findMostRecentProgress } from '@/lib/doctrine-progress';
import { CourseHero } from '@/app/(frontend)/components/doctrine/course-hero';
import { LearnPoints } from '@/app/(frontend)/components/doctrine/learn-points';
import { CourseCurriculum } from '@/app/(frontend)/components/doctrine/course-curriculum';
import RichText from '@/app/(frontend)/components/RichText';

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
```

If `RichText` doesn't already exist in the components directory, check `src/app/(frontend)/components/RichText.tsx`. If absent, look at how existing pages render Lexical content and import the same path.

- [ ] **Step 6: Verify typecheck + smoke test.**

Run: `pnpm typecheck`.
Expected: course page typechecks.

```bash
pnpm dev
```

Visit `/doctrine/eucharist`. Expected: hero with cover, two-column body (description + learnPoints on left, curriculum on right). All modules expanded. Status glyphs render (○ for everyone if signed out). Lane glyphs render (R/W/L) where lanes have content.

Stop dev.

- [ ] **Step 7: Commit.**

```bash
git add src/app/(frontend)/doctrine/[course]/ src/app/(frontend)/components/doctrine/course-hero.tsx src/app/(frontend)/components/doctrine/learn-points.tsx src/app/(frontend)/components/doctrine/course-curriculum.tsx
git commit -m "feat(doctrine): course landing page (hero + curriculum + learnPoints)"
```

---

### Task C4: Module-level redirect

**Files:**
- Create: `src/app/(frontend)/doctrine/[course]/[module]/page.tsx`

This file is a thin server component that issues a 301 redirect to the course landing page anchored at the module's section.

- [ ] **Step 1: Create the file.**

```tsx
import { redirect, permanentRedirect } from 'next/navigation';

type PageParams = { course: string; module: string };

export default async function ModuleRedirectPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { course, module } = await params;
  permanentRedirect(`/doctrine/${course}#module-${module}`);
}
```

`permanentRedirect` returns a 308 in Next 16 (semantically equivalent to 301 for our purposes — both signal "moved permanently"). If you specifically need a 301, use `redirect` with no second argument and add a `headers()` override; 308 is fine for our case.

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: typechecks. Errors continue on the old `[track]` route files.

- [ ] **Step 3: Smoke test.**

```bash
pnpm dev
```

Visit `http://localhost:3000/doctrine/eucharist/what-it-is`. Expected: browser redirects to `/doctrine/eucharist#module-what-it-is` and scrolls to that module heading.

Stop dev.

- [ ] **Step 4: Commit.**

```bash
git add "src/app/(frontend)/doctrine/[course]/[module]/page.tsx"
git commit -m "feat(doctrine): module path 308-redirects to course landing anchor"
```

---

## Phase D — Unit player rebuild

### Task D1: CourseChrome (sticky top bar)

**Files:**
- Create: `src/app/(frontend)/components/doctrine/course-chrome.tsx`

- [ ] **Step 1: Create the file.**

```tsx
import Link from 'next/link';
import { romanizeLower, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  unitIndexInCourse: number;       // 0-based
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
```

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 3: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/course-chrome.tsx
git commit -m "feat(doctrine): CourseChrome sticky top bar"
```

---

### Task D2: CourseOutline (collapsible sidebar)

**Files:**
- Create: `src/app/(frontend)/components/doctrine/course-outline.tsx`

- [ ] **Step 1: Create the file.**

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatMinutes, type DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  currentModuleSlug: string;
  currentUnitPath: string;
  completedUnitPaths: Set<string>;
};

function statusGlyph(state: 'done' | 'current' | 'todo') {
  if (state === 'done') return <span aria-label="Complete" className="text-gilt">✓</span>;
  if (state === 'current')
    return <span aria-label="In progress" className="text-gilt">⊙</span>;
  return <span aria-label="Not started" className="text-ink/30">○</span>;
}

export function CourseOutline({ course, currentModuleSlug, currentUnitPath, completedUnitPaths }: Props) {
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set([currentModuleSlug]),
  );

  const toggle = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <nav aria-label="Course outline" className="space-y-2 text-sm">
      <h2 className="px-3 pb-2 text-[11px] uppercase tracking-[0.22em] text-ink/55">
        Curriculum
      </h2>
      <ul className="space-y-1">
        {course.modules.map((m) => {
          const isExpanded = expandedSlugs.has(m.slug);
          return (
            <li key={m.slug}>
              <button
                type="button"
                onClick={() => toggle(m.slug)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left font-display text-base leading-tight text-ink hover:bg-ink/[0.03]"
                aria-expanded={isExpanded}
              >
                <span aria-hidden className="text-ink/45">{isExpanded ? '▼' : '▶'}</span>
                <span className="flex-1">
                  <span className="text-ink/45">Module {m.romanIndex} ·</span> {m.title}
                </span>
              </button>
              {isExpanded ? (
                <ul className="ml-3 space-y-px border-l border-ink/10 py-1">
                  {m.units.map((u) => {
                    const isCurrent = u.unitPath === currentUnitPath;
                    const isDone = completedUnitPaths.has(u.unitPath);
                    const state: 'done' | 'current' | 'todo' = isDone
                      ? 'done'
                      : isCurrent
                        ? 'current'
                        : 'todo';
                    const href = `/doctrine/${course.slug}/${m.slug}/${u.slug}`;
                    return (
                      <li key={u.slug}>
                        <Link
                          href={href}
                          className={`flex items-start gap-2 px-3 py-1.5 text-sm leading-snug transition-colors ${
                            isCurrent ? 'bg-gilt/[0.08] text-ink' : 'text-ink/75 hover:bg-ink/[0.03]'
                          }`}
                        >
                          <span className="w-3 flex-shrink-0">{statusGlyph(state)}</span>
                          <span className="flex-1">
                            <span className="font-display text-[15px] text-ink">folio {u.romanIndex}.</span>{' '}
                            {u.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-ink/45">
                            ~{formatMinutes(u.estimatedMinutes)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 3: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/course-outline.tsx
git commit -m "feat(doctrine): collapsible-by-module course outline sidebar"
```

---

### Task D3: Server actions for player (mark complete + save mastery + touch)

**Files:**
- Create: `src/app/(frontend)/doctrine/[course]/[module]/[unit]/actions.ts`

- [ ] **Step 1: Create the file.**

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { requireMember } from '@/lib/auth';
import {
  markComplete as markCompleteLib,
  saveMasteryAnswer as saveMasteryLib,
} from '@/lib/doctrine-progress';

export async function markCompleteAction(unitPath: string): Promise<void> {
  const member = await requireMember();
  await markCompleteLib(String(member.id), unitPath);
  const [course, module, unit] = unitPath.split('/');
  revalidatePath(`/doctrine/${course}/${module}/${unit}`);
  revalidatePath(`/doctrine/${course}`);
}

export async function saveMasteryAction(
  unitPath: string,
  answer: string,
  isCorrect: boolean,
): Promise<void> {
  const member = await requireMember();
  await saveMasteryLib(String(member.id), unitPath, answer, isCorrect);
  const [course, module, unit] = unitPath.split('/');
  revalidatePath(`/doctrine/${course}/${module}/${unit}`);
  revalidatePath(`/doctrine/${course}`);
}
```

Note the `'use server'` rule from project context: this file exports only async functions, no constants, no types. Constants and types live in client components or shared lib files.

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 3: Commit.**

```bash
git add "src/app/(frontend)/doctrine/[course]/[module]/[unit]/actions.ts"
git commit -m "feat(doctrine): server actions for mark-complete, save-mastery, touch"
```

---

### Task D4: MarkCompleteButton + AutoCompleteSentinel

**Files:**
- Create: `src/app/(frontend)/components/doctrine/mark-complete-button.tsx`
- Create: `src/app/(frontend)/components/doctrine/auto-complete-sentinel.tsx`

- [ ] **Step 1: Create `mark-complete-button.tsx`.**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { markCompleteAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
  variant?: 'inline' | 'footer';
};

export function MarkCompleteButton({ unitPath, isAlreadyComplete, variant = 'inline' }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(isAlreadyComplete);

  const onClick = () => {
    if (optimisticDone) return;
    setOptimisticDone(true);
    startTransition(async () => {
      try {
        await markCompleteAction(unitPath);
      } catch (err) {
        console.error('markCompleteAction failed', err);
        setOptimisticDone(false);
      }
    });
  };

  const label = optimisticDone ? '✓ Folio complete' : 'Mark folio complete';

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending || optimisticDone}
        className={`flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
          optimisticDone ? 'bg-gilt/15 text-ink/85' : 'bg-ink text-vellum hover:opacity-90'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || optimisticDone}
      className={`mx-auto block rounded-sm border px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
        optimisticDone
          ? 'border-gilt/40 bg-gilt/10 text-ink/85'
          : 'border-ink bg-ink text-vellum hover:opacity-90'
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Create `auto-complete-sentinel.tsx`.**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { markCompleteAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
};

/**
 * Renders an invisible sentinel at the bottom of the reading lane.
 * When it scrolls into view, fires markCompleteAction once.
 */
export function AutoCompleteSentinel({ unitPath, isAlreadyComplete }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isAlreadyComplete) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            markCompleteAction(unitPath).catch((err) => {
              console.error('autoComplete failed', err);
              firedRef.current = false;
            });
            obs.disconnect();
          }
        }
      },
      { threshold: 1.0, rootMargin: '0px 0px -10% 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [unitPath, isAlreadyComplete]);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
```

- [ ] **Step 3: Verify typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`.

- [ ] **Step 4: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/mark-complete-button.tsx src/app/(frontend)/components/doctrine/auto-complete-sentinel.tsx
git commit -m "feat(doctrine): mark-complete button + auto-complete intersection sentinel"
```

---

### Task D5: ResourcesBlock + UnitFooterNav

**Files:**
- Create: `src/app/(frontend)/components/doctrine/resources-block.tsx`
- Create: `src/app/(frontend)/components/doctrine/unit-footer-nav.tsx`

- [ ] **Step 1: Create `resources-block.tsx`.**

```tsx
import type { DoctrineResourceWire } from './types';

type Props = { resources: DoctrineResourceWire[] };

function kindLabel(kind: DoctrineResourceWire['kind']): string {
  if (kind === 'download') return 'Download';
  if (kind === 'link') return 'Link';
  return 'Citation';
}

function kindGlyph(kind: DoctrineResourceWire['kind']): string {
  if (kind === 'download') return '↓';
  if (kind === 'link') return '↗';
  return '§';
}

export function ResourcesBlock({ resources }: Props) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">References</h2>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {resources.map((r, i) => {
          const glyph = kindGlyph(r.kind);
          const ariaLabel = kindLabel(r.kind);

          if (r.kind === 'citation') {
            const inner = (
              <>
                <span aria-hidden className="w-5 flex-shrink-0 text-ink/55">{glyph}</span>
                <span className="flex-1">
                  <span className="font-display text-base text-ink">{r.label}</span>
                  {r.description ? (
                    <span className="block text-sm leading-snug text-ink/65">{r.description}</span>
                  ) : null}
                  <em className="block text-sm not-italic text-ink/85">{r.citation}</em>
                </span>
              </>
            );
            return (
              <li key={i}>
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${ariaLabel}: ${r.label}`}
                    className="flex gap-3 px-1 py-3 transition-colors hover:bg-ink/[0.03]"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex gap-3 px-1 py-3">{inner}</div>
                )}
              </li>
            );
          }

          return (
            <li key={i}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${ariaLabel}: ${r.label}`}
                download={r.kind === 'download' ? '' : undefined}
                className="flex gap-3 px-1 py-3 transition-colors hover:bg-ink/[0.03]"
              >
                <span aria-hidden className="w-5 flex-shrink-0 text-ink/55">{glyph}</span>
                <span className="flex-1">
                  <span className="font-display text-base text-ink">{r.label}</span>
                  {r.description ? (
                    <span className="block text-sm leading-snug text-ink/65">{r.description}</span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Create `unit-footer-nav.tsx`.**

```tsx
import Link from 'next/link';
import { MarkCompleteButton } from './mark-complete-button';

type NavTarget = { unitPath: string } | null;

type Props = {
  unitPath: string;
  isAlreadyComplete: boolean;
  prev: NavTarget;
  next: NavTarget;
};

function targetHref(t: NavTarget): string | null {
  if (!t) return null;
  const [course, module, unit] = t.unitPath.split('/');
  return `/doctrine/${course}/${module}/${unit}`;
}

export function UnitFooterNav({ unitPath, isAlreadyComplete, prev, next }: Props) {
  const prevHref = targetHref(prev);
  const nextHref = targetHref(next);

  return (
    <nav
      aria-label="Folio navigation"
      className="grid grid-cols-3 gap-px border border-ink/15 bg-ink/15"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex items-center justify-center gap-2 bg-vellum px-4 py-3 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink/[0.03]"
        >
          <span aria-hidden>←</span> Prev
        </Link>
      ) : (
        <span className="flex items-center justify-center gap-2 bg-vellum/60 px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink/35">
          ← Prev
        </span>
      )}

      <MarkCompleteButton
        unitPath={unitPath}
        isAlreadyComplete={isAlreadyComplete}
        variant="footer"
      />

      {nextHref ? (
        <Link
          href={nextHref}
          className="flex items-center justify-center gap-2 bg-vellum px-4 py-3 text-sm font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink/[0.03]"
        >
          Next <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className="flex items-center justify-center gap-2 bg-vellum/60 px-4 py-3 text-sm uppercase tracking-[0.18em] text-ink/35">
          Next →
        </span>
      )}
    </nav>
  );
}
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 4: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/resources-block.tsx src/app/(frontend)/components/doctrine/unit-footer-nav.tsx
git commit -m "feat(doctrine): ResourcesBlock + UnitFooterNav (prev/mark/next)"
```

---

### Task D6: Update LaneSwitcher + MasteryCheck for new types

**Files:**
- Modify: `src/app/(frontend)/components/doctrine/lane-switcher.tsx`
- Modify: `src/app/(frontend)/components/doctrine/mastery-check.tsx`

- [ ] **Step 1: Update `lane-switcher.tsx` to consume `DoctrineLanesWire`.**

Read the current file. The lane switcher currently takes individual props for each lane's content. Update its prop interface to take a `DoctrineLanesWire` directly:

```tsx
'use client';

import { useState } from 'react';
import RichText from '@/app/(frontend)/components/RichText';
import { AutoCompleteSentinel } from './auto-complete-sentinel';
import type { DoctrineLanesWire } from './types';

type Props = {
  lanes: DoctrineLanesWire;
  unitPath: string;
  isAlreadyComplete: boolean;
};

type Lane = 'reading' | 'watch' | 'listen';

export function LaneSwitcher({ lanes, unitPath, isAlreadyComplete }: Props) {
  const availableLanes: Lane[] = [
    lanes.hasReading ? 'reading' : null,
    lanes.hasWatch ? 'watch' : null,
    lanes.hasListen ? 'listen' : null,
  ].filter((l): l is Lane => l !== null);

  const [activeLane, setActiveLane] = useState<Lane>(availableLanes[0] ?? 'reading');

  if (availableLanes.length === 0) return null;

  const tabClass = (lane: Lane) =>
    `border-b-2 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
      activeLane === lane
        ? 'border-gilt text-ink'
        : 'border-transparent text-ink/55 hover:text-ink/85'
    }`;

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex gap-2 border-b border-ink/15">
        {lanes.hasReading ? (
          <button type="button" role="tab" aria-selected={activeLane === 'reading'} onClick={() => setActiveLane('reading')} className={tabClass('reading')}>
            Read
          </button>
        ) : null}
        {lanes.hasWatch ? (
          <button type="button" role="tab" aria-selected={activeLane === 'watch'} onClick={() => setActiveLane('watch')} className={tabClass('watch')}>
            Watch
          </button>
        ) : null}
        {lanes.hasListen ? (
          <button type="button" role="tab" aria-selected={activeLane === 'listen'} onClick={() => setActiveLane('listen')} className={tabClass('listen')}>
            Listen
          </button>
        ) : null}
      </div>

      <div>
        {activeLane === 'reading' && lanes.reading ? (
          <article className="prose prose-stone max-w-[65ch] text-base leading-relaxed text-ink/90">
            <RichText data={lanes.reading} />
            <AutoCompleteSentinel unitPath={unitPath} isAlreadyComplete={isAlreadyComplete} />
          </article>
        ) : null}

        {activeLane === 'watch' && lanes.watchVideoUrl ? (
          <video
            src={lanes.watchVideoUrl}
            controls
            className="w-full max-w-4xl"
            onEnded={() => {
              import('@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions').then((m) => {
                m.markCompleteAction(unitPath).catch(console.error);
              });
            }}
          />
        ) : null}

        {activeLane === 'listen' && lanes.listenAudioUrl ? (
          <audio
            src={lanes.listenAudioUrl}
            controls
            className="w-full"
            onEnded={() => {
              import('@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions').then((m) => {
                m.markCompleteAction(unitPath).catch(console.error);
              });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `mastery-check.tsx`.**

Read the current file. Update its prop interface to consume `DoctrineMasteryCheckWire` and to call `saveMasteryAction` (which now also auto-completes on correct):

```tsx
'use client';

import { useState, useTransition } from 'react';
import { saveMasteryAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';
import type { DoctrineMasteryCheckWire } from './types';

type Props = {
  check: DoctrineMasteryCheckWire;
  unitPath: string;
  initialAnswer: string | null;
  initialCorrect: boolean;
};

export function MasteryCheck({ check, unitPath, initialAnswer, initialCorrect }: Props) {
  const [selected, setSelected] = useState<string | null>(initialAnswer);
  const [showResult, setShowResult] = useState<boolean>(initialAnswer !== null);
  const [isCorrect, setIsCorrect] = useState<boolean>(initialCorrect);
  const [pending, startTransition] = useTransition();

  const submit = (answer: string) => {
    const option = check.options.find((o) => o.text === answer);
    if (!option) return;
    setSelected(answer);
    setShowResult(true);
    setIsCorrect(option.isCorrect);
    startTransition(async () => {
      try {
        await saveMasteryAction(unitPath, answer, option.isCorrect);
      } catch (err) {
        console.error('saveMasteryAction failed', err);
      }
    });
  };

  const correctOption = check.options.find((o) => o.isCorrect);
  const affirmation =
    showResult && isCorrect ? correctOption?.affirmation ?? 'Yes — well noted.' : null;

  return (
    <section className="space-y-4 rounded-md border border-ink/15 bg-vellum/40 p-5">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">Mastery check</h2>
      <p className="font-display text-lg leading-snug text-ink">{check.prompt}</p>
      <ul className="space-y-2">
        {check.options.map((opt) => {
          const isSelected = selected === opt.text;
          const isThisCorrect = showResult && isSelected && opt.isCorrect;
          const isThisWrong = showResult && isSelected && !opt.isCorrect;
          return (
            <li key={opt.text}>
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(opt.text)}
                className={`w-full rounded-sm border px-4 py-3 text-left text-sm leading-snug transition-colors ${
                  isThisCorrect
                    ? 'border-gilt bg-gilt/[0.1] text-ink'
                    : isThisWrong
                      ? 'border-ink/35 bg-ink/[0.04] text-ink/65'
                      : isSelected
                        ? 'border-ink/35 bg-ink/[0.04] text-ink/85'
                        : 'border-ink/15 bg-vellum text-ink/85 hover:border-ink/35'
                }`}
              >
                {opt.text}
              </button>
            </li>
          );
        })}
      </ul>
      {affirmation ? (
        <p className="text-sm italic leading-relaxed text-gilt-deep">{affirmation}</p>
      ) : null}
      {showResult && !isCorrect ? (
        <p className="text-sm italic leading-relaxed text-ink/65">
          Re-read the folio and try again when ready.
        </p>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 4: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/lane-switcher.tsx src/app/(frontend)/components/doctrine/mastery-check.tsx
git commit -m "feat(doctrine): LaneSwitcher + MasteryCheck consume new wire types + auto-complete on lane-end"
```

---

### Task D7: Unit player page (server)

**Files:**
- Create: `src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx`

This server component pulls the data, computes progress, and renders the page. The player page composes:

- `<CourseChrome>` (sticky top)
- `<CourseOutline>` (sidebar)
- Unit header (tight, NOT editorial)
- `<LaneSwitcher>` with `AutoCompleteSentinel` injected for the reading lane
- `<MasteryCheck>` (when present)
- `<ResourcesBlock>` (when resources exist)
- inline `<MarkCompleteButton variant="inline">`
- `<UnitFooterNav>`

- [ ] **Step 1: Create the file.**

```tsx
import { notFound } from 'next/navigation';
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
import RichText from '@/app/(frontend)/components/RichText';

export const dynamic = 'force-dynamic';

type PageParams = { course: string; module: string; unit: string };

export default async function UnitPlayerPage({ params }: { params: Promise<PageParams> }) {
  const { course: courseSlug, module: moduleSlug, unit: unitSlug } = await params;

  const member = await requireMember();   // gates the route
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const found = findUnitInCourse(course, moduleSlug, unitSlug);
  if (!found) notFound();
  const { module, unit, indexInCourse, totalUnits, prev, next } = found;

  // Touch progress (sets lastVisitedAt). Don't await render-blocking work twice.
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
                <RichText data={unit.introduction} />
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
```

- [ ] **Step 2: Verify typecheck + lint.**

Run: `pnpm typecheck && pnpm lint`.
Expected: NEW player typechecks. Errors only on the old `[track]` route files.

- [ ] **Step 3: Smoke test.**

```bash
pnpm dev
```

Sign in as a learner, then visit `/doctrine/eucharist/what-it-is/real-presence`. Expected:
- Sticky chrome at top (back to course, folio counter, progress %)
- Sidebar visible at ≥1024px with current module expanded
- Unit title + introduction + Read/Watch/Listen tabs
- Lane content renders
- Mastery check appears
- Resources block appears (CCC §1374, Sacramentum Caritatis link, CCC excerpt download)
- Mark complete button appears inline
- Footer nav with Prev / Mark / Next buttons

Click "Mark folio complete" — button shows "✓ Folio complete" optimistically; reload page; sidebar shows ✓ next to that unit.

Stop dev.

- [ ] **Step 4: Commit.**

```bash
git add "src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx"
git commit -m "feat(doctrine): unit player page (chrome + outline + lanes + mastery + resources + footer)"
```

---

### Task D8: Mobile player polish (drawer + sticky bottom bar)

**Files:**
- Modify: `src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx`
- Create: `src/app/(frontend)/components/doctrine/mobile-outline-drawer.tsx`

- [ ] **Step 1: Create `mobile-outline-drawer.tsx`.**

```tsx
'use client';

import { useState } from 'react';
import { CourseOutline } from './course-outline';
import type { DoctrineCourseWire } from './types';

type Props = {
  course: DoctrineCourseWire;
  currentModuleSlug: string;
  currentUnitPath: string;
  completedUnitPaths: string[];
};

export function MobileOutlineDrawer({
  course,
  currentModuleSlug,
  currentUnitPath,
  completedUnitPaths,
}: Props) {
  const [open, setOpen] = useState(false);
  const completedSet = new Set(completedUnitPaths);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open course outline"
        className="rounded-sm border border-ink/15 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-ink/85 lg:hidden"
      >
        ☰ Outline
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div
            className="ml-auto h-full w-full max-w-md overflow-y-auto bg-vellum p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-4 text-sm uppercase tracking-[0.18em] text-ink/65"
            >
              ✕ Close
            </button>
            <CourseOutline
              course={course}
              currentModuleSlug={currentModuleSlug}
              currentUnitPath={currentUnitPath}
              completedUnitPaths={completedSet}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Wire the mobile drawer into the unit page.**

Edit `src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx`. Import `MobileOutlineDrawer`. In the `<CourseChrome>` area, the chrome already has its own JSX — instead, add the drawer button INSIDE the page, between chrome and main. Or, simpler: add a mobile-only row above the article:

After the closing `</aside>` element and BEFORE the `<article>`, add a mobile-only banner with the drawer button. Since the layout is a CSS grid with the aside hidden on mobile, the drawer button should sit at the top of the article on mobile only:

```tsx
<article className="space-y-10">
  <div className="lg:hidden">
    <MobileOutlineDrawer
      course={course}
      currentModuleSlug={module.slug}
      currentUnitPath={unit.unitPath}
      completedUnitPaths={Array.from(completedUnitPaths)}
    />
  </div>
  {/* existing header... */}
```

- [ ] **Step 3: Verify typecheck + smoke test on mobile viewport.**

Run: `pnpm typecheck && pnpm dev`. Resize browser to <1024px width. Visit a unit page. Expected: outline button appears at top of content; clicking opens a full-height drawer from the right with the course outline; clicking outside the drawer closes it.

Stop dev.

- [ ] **Step 4: Commit.**

```bash
git add src/app/(frontend)/components/doctrine/mobile-outline-drawer.tsx "src/app/(frontend)/doctrine/[course]/[module]/[unit]/page.tsx"
git commit -m "feat(doctrine): mobile drawer for course outline on unit player"
```

---

## Phase E — Access control + studio scoping

### Task E1: Full access matrix on DoctrineCourses + auto-attribution hook

**Files:**
- Modify: `src/collections/DoctrineCourses.ts`

- [ ] **Step 1: Replace the `access` block in DoctrineCourses with the full matrix.**

Find the existing `access:` block and replace it with:

```typescript
access: {
  read: ({ req }) => {
    const user = req.user;
    if (user?.roles?.includes('admin')) return true;
    if (user?.roles?.includes('instructor')) {
      // instructors see published courses + drafts of their own courses
      return {
        or: [
          { _status: { equals: 'published' } },
          { instructors: { contains: user.id } },
        ],
      };
    }
    // public + learners: published only
    return { _status: { equals: 'published' } };
  },
  create: ({ req }) => {
    const user = req.user;
    return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('instructor'));
  },
  update: ({ req }) => {
    const user = req.user;
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    if (user.roles?.includes('instructor')) {
      return { instructors: { contains: user.id } };
    }
    return false;
  },
  delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
},
```

- [ ] **Step 2: Add the auto-attribution hook.**

Add a `hooks:` block to the `DoctrineCourses` config (sibling to `access:`):

```typescript
hooks: {
  beforeChange: [
    ({ req, operation, data }) => {
      if (operation !== 'create') return data;
      const user = req.user;
      if (!user) return data;
      const isAdmin = user.roles?.includes('admin') ?? false;
      const isInstructor = user.roles?.includes('instructor') ?? false;

      // Only auto-attribute for instructors who aren't admins.
      if (isInstructor && !isAdmin) {
        const existing = Array.isArray(data.instructors) ? data.instructors : [];
        const userId = String(user.id);
        if (!existing.some((id) => String(id) === userId)) {
          return { ...data, instructors: [...existing, user.id] };
        }
      }
      return data;
    },
  ],
},
```

- [ ] **Step 3: Verify typecheck + build.**

Run: `pnpm typecheck && pnpm build`.
Expected: still failing on old `[track]` files. Phase F deletes them.

- [ ] **Step 4: Commit.**

```bash
git add src/collections/DoctrineCourses.ts
git commit -m "feat(doctrine): per-role access matrix + instructor auto-attribution on create"
```

---

### Task E2: LmsProgress access for learners (own rows)

**Files:**
- Modify: `src/collections/LmsProgress.ts`

- [ ] **Step 1: Replace the `access` block.**

```typescript
access: {
  read: ({ req }) => {
    const user = req.user;
    if (!user) return false;
    if (user.roles?.includes('admin')) return true;
    return { member: { equals: user.id } };
  },
  create: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  update: ({ req }) => req.user?.roles?.includes('admin') ?? false,
  delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
},
```

Server-action writes from the player use `overrideAccess: true` (already in `doctrine-progress.ts` lib), so write access being admin-only here is intentional — it keeps the studio honest.

- [ ] **Step 2: Hide LmsProgress from non-admin sidebar.**

Add to the `admin:` block on LmsProgress:

```typescript
admin: {
  useAsTitle: 'unitPath',
  defaultColumns: ['member', 'unitPath', 'completedAt', 'lastVisitedAt'],
  group: 'Doctrine',
  hidden: ({ user }) => !user?.roles?.includes('admin'),
},
```

- [ ] **Step 3: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 4: Commit.**

```bash
git add src/collections/LmsProgress.ts
git commit -m "feat(doctrine): LmsProgress access — learners read own rows; admins read all"
```

---

### Task E3: Hide Atlas + Members collections from non-admins

**Files:**
- Modify: `src/collections/Miracles.ts`
- Modify: `src/collections/Pilgrimages.ts`
- Modify: `src/collections/Members.ts`

- [ ] **Step 1: Add `admin.hidden` to Miracles.**

Find the `admin:` block in `src/collections/Miracles.ts`. Add the `hidden` predicate:

```typescript
admin: {
  // ...existing fields...
  hidden: ({ user }) => !user?.roles?.includes('admin'),
},
```

If there is no existing `admin:` block, add one:

```typescript
admin: {
  hidden: ({ user }) => !user?.roles?.includes('admin'),
},
```

- [ ] **Step 2: Same for Pilgrimages.**

Repeat the change in `src/collections/Pilgrimages.ts`.

- [ ] **Step 3: Same for Members.**

Repeat in `src/collections/Members.ts`. **Important:** this hides the collection from the studio sidebar. Members can still edit their own profile via the public `/account` page (which uses `overrideAccess: true` server actions).

- [ ] **Step 4: Verify typecheck + smoke test.**

Run: `pnpm typecheck`.

```bash
pnpm dev
```

Sign in as an instructor (you'll need a test member promoted to that role first — use `pnpm admin:promote your-admin@example.com`, then in the studio set another member's `roles` to include `instructor`). Visit `/admin`. Expected: sidebar shows only "Doctrine Courses" and "Media" (and any global config nav). No Miracles, Pilgrimages, Members.

Sign in as the admin. Sidebar shows everything.

Stop dev.

- [ ] **Step 5: Commit.**

```bash
git add src/collections/Miracles.ts src/collections/Pilgrimages.ts src/collections/Members.ts
git commit -m "feat(auth): hide non-doctrine collections from non-admin studio sidebar"
```

---

### Task E4: Media write access for instructors

**Files:**
- Modify: `src/collections/Media.ts`

Instructors need to upload video/audio/PDFs into their courses. The Media collection's create/update should allow them.

- [ ] **Step 1: Update Media access.**

Find `src/collections/Media.ts`. Replace the access block (or add one if missing):

```typescript
access: {
  read: () => true,           // public read for frontend rendering
  create: ({ req }) => {
    const user = req.user;
    return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('instructor'));
  },
  update: ({ req }) => {
    const user = req.user;
    return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('instructor'));
  },
  delete: ({ req }) => req.user?.roles?.includes('admin') ?? false,
},
```

- [ ] **Step 2: Verify typecheck.**

Run: `pnpm typecheck`.

- [ ] **Step 3: Commit.**

```bash
git add src/collections/Media.ts
git commit -m "feat(auth): allow instructors to upload media (admin still owns delete)"
```

---

## Phase F — Cleanup + final verification

### Task F1: Delete old collection files + DB tables

**Files:**
- Delete: `src/collections/DoctrineTracks.ts`
- Delete: `src/collections/DoctrineModules.ts`
- Delete: `src/collections/DoctrineUnits.ts`
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Remove the imports + entries from payload.config.ts.**

Edit `src/payload.config.ts`. Remove these three import lines and the corresponding entries from the `collections` array:
- `DoctrineTracks`
- `DoctrineModules`
- `DoctrineUnits`

- [ ] **Step 2: Delete the collection files.**

```bash
rm src/collections/DoctrineTracks.ts src/collections/DoctrineModules.ts src/collections/DoctrineUnits.ts
```

- [ ] **Step 3: Generate the migration to drop the old tables.**

Run: `pnpm payload migrate:create drop_old_doctrine_tables`.
Expected: a new migration file with `DROP TABLE` statements for `tantum.doctrine_tracks`, `tantum.doctrine_modules`, `tantum.doctrine_units`, and any related rels tables.

Inspect the migration. If Drizzle missed a foreign-key or rels table, add the missing `DROP TABLE` manually. Likely table names: `doctrine_units_lanes_*`, `doctrine_units_mastery_check_options`, `doctrine_units_rels`, `doctrine_modules_rels`, `doctrine_tracks_rels`.

- [ ] **Step 4: Apply the migration.**

Run: `pnpm payload migrate`.
Expected: tables dropped cleanly. If any test data left orphaned FKs, the migration will fail — drop those rows manually then re-run.

- [ ] **Step 5: Regen types.**

Run: `pnpm generate:types`.
Expected: `DoctrineTrack`, `DoctrineModule`, `DoctrineUnit` types removed from `src/payload-types.ts`.

- [ ] **Step 6: Verify typecheck.**

Run: `pnpm typecheck`.
Expected: STILL fails — but now only on the old route files in `src/app/(frontend)/doctrine/[track]/`. F2 deletes them.

- [ ] **Step 7: Commit.**

```bash
git add -A src/collections/ src/payload.config.ts src/migrations/ src/payload-types.ts
git commit -m "feat(doctrine): drop DoctrineTracks/Modules/Units collections + tables"
```

---

### Task F2: Delete old route folder

**Files:**
- Delete: `src/app/(frontend)/doctrine/[track]/` (entire subtree)

- [ ] **Step 1: Confirm what's there.**

```bash
ls -R "src/app/(frontend)/doctrine/[track]"
```

Expected output: `page.tsx`, `[module]/page.tsx`, `[module]/[unit]/page.tsx`, `[module]/[unit]/actions.ts` (and possibly intermediate folders).

- [ ] **Step 2: Delete recursively.**

```bash
rm -rf "src/app/(frontend)/doctrine/[track]"
```

- [ ] **Step 3: Verify typecheck + lint + build.**

Run: `pnpm typecheck && pnpm lint && pnpm build`.
Expected: ALL GREEN. No more references to the old types.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "chore(doctrine): delete old [track] route folder"
```

---

### Task F3: Delete unused components + lib

**Files:**
- Delete: `src/app/(frontend)/components/doctrine/track-plate.tsx`
- Delete: `src/app/(frontend)/components/doctrine/module-folio.tsx`
- Delete: `src/app/(frontend)/components/doctrine/unit-folio.tsx`
- Delete: `src/app/(frontend)/components/doctrine/doctrine-outline.tsx`
- Delete: `src/app/(frontend)/components/doctrine/mobile-outline.tsx`
- Delete: `src/app/(frontend)/components/doctrine/unit-player.tsx`
- Delete: `src/lib/doctrine-outline.ts`

- [ ] **Step 1: Verify nothing imports these.**

```bash
grep -r "track-plate\|module-folio\|unit-folio\|doctrine-outline\|mobile-outline\|unit-player\|doctrine-outline" src/ --include="*.ts" --include="*.tsx"
```

Expected: only matches inside the files being deleted, not in any active page or component.

If a match appears in an active file, that import was missed in an earlier task — go fix the importer first before deleting.

- [ ] **Step 2: Delete the files.**

```bash
rm src/app/(frontend)/components/doctrine/track-plate.tsx \
   src/app/(frontend)/components/doctrine/module-folio.tsx \
   src/app/(frontend)/components/doctrine/unit-folio.tsx \
   src/app/(frontend)/components/doctrine/doctrine-outline.tsx \
   src/app/(frontend)/components/doctrine/mobile-outline.tsx \
   src/app/(frontend)/components/doctrine/unit-player.tsx \
   src/lib/doctrine-outline.ts
```

- [ ] **Step 3: Verify typecheck + lint + build.**

Run: `pnpm typecheck && pnpm lint && pnpm build`.
Expected: all green.

- [ ] **Step 4: Commit.**

```bash
git add -A
git commit -m "chore(doctrine): delete unused legacy components + lib"
```

---

### Task F4: Final verification gate

This task is verification only — no code changes.

- [ ] **Step 1: Wipe the local DB and re-seed from scratch.**

This proves the seed is reproducible from a clean slate. If you don't want to wipe local dev data, skip this step (but at minimum re-run the seed once to confirm idempotency).

```bash
# OPTIONAL — only on a throwaway DB:
psql $DATABASE_URL -c "DROP SCHEMA tantum CASCADE; CREATE SCHEMA tantum;"
pnpm payload migrate
pnpm seed:doctrine
pnpm seed:atlas
pnpm seed:pilgrimages
pnpm seed:foundation
```

- [ ] **Step 2: Run the full verification gate.**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all green.

- [ ] **Step 3: Manual click-through.**

Set up three test accounts (or reuse existing):

1. Sign up as `learner@test.local` (defaults to `roles: ['learner']`).
2. Sign up as `admin@test.local`. Then run `pnpm admin:promote admin@test.local`.
3. Sign up as `instructor@test.local`. As admin, edit that member in the studio and add `instructor` to `roles`. Edit one seeded course (e.g. `eucharist`) and add `instructor@test.local` to `instructors`.

Test as **learner**:
- Visit `/doctrine`. Catalogue renders three cards. Click the first.
- Course landing renders. Click "Begin reading."
- Unit player opens. Read through the reading lane — the auto-complete sentinel fires when you reach the bottom; reload the page and confirm ✓ next to the unit in the sidebar.
- Switch to the watch lane (if present). Let the video play to the end. Reload — that unit should also be marked complete.
- Answer a mastery check correctly. The unit gets marked complete.
- Click "Next →" in the footer. Move through several units.
- Sign out and back in. Visit `/doctrine`. The resume banner shows the last unit visited.
- Verify `/doctrine/eucharist/what-it-is` redirects to `/doctrine/eucharist#module-what-it-is`.

Test as **instructor**:
- Visit `/admin`. Sidebar shows only "Doctrine Courses" and "Media." No Miracles, Pilgrimages, Members.
- Open the assigned course (`eucharist`). Edit the title. Save. Verify the change.
- Try to open a course you're NOT assigned to (`mariology`) — expect 403 / not visible.
- Try to delete the assigned course — delete button should be missing or fail. Unpublishing works.

Test as **admin**:
- Visit `/admin`. Sidebar shows everything: Doctrine Courses, Media, Miracles, Pilgrimages, Members, LmsProgress.
- Edit a Members record's `roles` field — succeeds.
- Delete a course — succeeds (try this on a throwaway course, not a seeded one).
- Browse LmsProgress — see all members' rows.

- [ ] **Step 4: Confirm spec requirements are met.**

Walk through the verification gate from spec §11. Every checkbox should pass.

- [ ] **Step 5: Push the branch.**

```bash
git push origin feat/foundation
```

- [ ] **Step 6: Final commit (handoff note).**

If the verification surfaced any small fixes, commit them. Otherwise this step is a no-op — the work is done.

If you want a tracking commit for handoff:

```bash
git commit --allow-empty -m "docs(doctrine): rebuild verified — handoff to user"
```

---

## Self-review checklist (post-write)

Run this checklist mentally before handing the plan to the executor:

- [ ] Every wire-shape type referenced in Tasks C/D/E exists in the locked block at the top.
- [ ] Every `import` statement in every code block resolves to a file created in this plan or pre-existing in the repo.
- [ ] No task uses `TODO` or `TBD` outside the seed-content step (B2 Step 3 is necessarily mechanical).
- [ ] Every `git commit` line stands alone — files staged in that commit are real.
- [ ] Every `pnpm typecheck` step has the right expectation about whether old code is still present (typecheck breaks A3 → recovers F2).
- [ ] Server-action files contain only async functions (Next 16 rule from `cacdadf`).
- [ ] The `'use client'` directives are on every interactive component (CourseOutline, MobileOutlineDrawer, MarkCompleteButton, AutoCompleteSentinel, LaneSwitcher, MasteryCheck).
- [ ] Spec §11 verification gate items are all exercised in F4.
- [ ] Spec §13 closed-questions table — every decision has a corresponding implementation task.

