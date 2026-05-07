import type { CollectionConfig } from 'payload';
import { isStudioAdmin } from '@/lib/access';

export const LmsProgress: CollectionConfig = {
  slug: 'lmsProgress',
  admin: {
    useAsTitle: 'unitPath',
    defaultColumns: ['member', 'unitPath', 'completedAt', 'lastVisitedAt'],
    group: 'Doctrine',
    hidden: ({ user }) => {
      if (!user) return true;
      if (user.collection === 'users') return user.role !== 'admin';
      if (user.collection === 'members') return !user.roles.includes('admin');
      return true;
    },
  },
  access: {
    read: ({ req }) => {
      const user = req.user;
      if (!user) return false;
      if (isStudioAdmin(user)) return true;
      if (user.collection === 'members') {
        return { member: { equals: user.id } };
      }
      return false;
    },
    create: ({ req }) => isStudioAdmin(req.user),
    update: ({ req }) => isStudioAdmin(req.user),
    delete: ({ req }) => isStudioAdmin(req.user),
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
