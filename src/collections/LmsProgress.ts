import type { CollectionConfig } from 'payload'

export const LmsProgress: CollectionConfig = {
  slug: 'lms-progress',
  labels: { singular: 'LMS Progress', plural: 'LMS Progress' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['member', 'unit', 'masteryCorrect', 'lastVisitedAt'],
    description:
      'Per-member, per-unit progress for the Doctrine LMS. One row per (member, unit) pair — upserted by the unit player. Read-only from the studio for non-admins.',
    // Hide from non-admins to keep the studio focused on editorial tools.
    hidden: ({ user }) =>
      !(user && user.collection === 'users' && user.role === 'admin'),
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      // Members read only their own rows.
      return { member: { equals: req.user.id } }
    },
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'members'),
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users' && req.user.role === 'admin') return true
      if (req.user.collection === 'members') {
        return { member: { equals: req.user.id } }
      }
      return false
    },
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  fields: [
    {
      name: 'member',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'unit',
      type: 'relationship',
      relationTo: 'doctrine-units',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'masteryAnswer',
      type: 'text',
      admin: {
        description: 'The text of the option the member selected. Null if they skipped.',
      },
    },
    {
      name: 'masteryCorrect',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Set when the member submits the mastery check. Computed server-side against the unit\'s correct option.',
      },
    },
    {
      name: 'lastVisitedAt',
      type: 'date',
      required: true,
      admin: {
        description:
          'Updated every time the member loads the unit player or saves the mastery check. Powers the resume banner.',
      },
    },
  ],
}
