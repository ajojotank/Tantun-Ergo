import type { CollectionConfig, Validate, Where } from 'payload';
import { isStudioAdmin, isInstructor } from '@/lib/access';

const validateModuleSlug: Validate<string> = (value, { siblingData: _siblingData, data }) => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Slug must be lowercase alphanumeric with hyphens';

  const allModules = (data as { modules?: Array<{ slug?: string }> })?.modules ?? [];
  const duplicates = allModules.filter((m) => m?.slug === value).length;
  if (duplicates > 1) return `Module slug "${value}" is already used in this course`;

  return true;
};

const validateUnitSlug: Validate<string> = (value, { siblingData: _siblingData, data, path }) => {
  if (typeof value !== 'string' || value.length === 0) return 'Slug is required';
  if (!/^[a-z0-9-]+$/.test(value)) return 'Slug must be lowercase alphanumeric with hyphens';

  // path is an array like ['modules', 0, 'units', 2, 'slug'] — index 1 is the parent module index
  const moduleIdx = typeof path?.[1] === 'number' ? path[1] : NaN;
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
    read: ({ req }): boolean | Where => {
      const user = req.user;
      if (isStudioAdmin(user)) return true;
      if (isInstructor(user)) {
        // Instructors see published courses + drafts of their own courses
        return {
          or: [
            { _status: { equals: 'published' } } as Where,
            { instructors: { contains: user!.id } } as Where,
          ],
        } as Where;
      }
      // Public + learners: published only
      return { _status: { equals: 'published' } } as Where;
    },
    create: ({ req }) => {
      const user = req.user;
      return isStudioAdmin(user) || isInstructor(user);
    },
    update: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      if (isStudioAdmin(user)) return true;
      if (isInstructor(user)) {
        return { instructors: { contains: user.id } };
      }
      return false;
    },
    delete: ({ req }) => isStudioAdmin(req.user),
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation !== 'create') return data;
        const user = req.user;
        if (!user) return data;
        const adminFlag = isStudioAdmin(user);
        const instructorFlag = isInstructor(user);

        // Auto-attribute: instructors who aren't admins get added to the course's instructors list.
        if (instructorFlag && !adminFlag) {
          const existing = Array.isArray(data.instructors) ? data.instructors : [];
          const userId = user.id;
          if (!existing.some((id) => id === userId)) {
            return { ...data, instructors: [...existing, userId] };
          }
        }
        return data;
      },
    ],
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
