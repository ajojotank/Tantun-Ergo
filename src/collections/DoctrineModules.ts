import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineModules: CollectionConfig = {
  slug: 'doctrine-modules',
  labels: { singular: 'Doctrine Module', plural: 'Doctrine Modules' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'track', 'order', '_status'],
    description:
      'A chapter within a doctrine track. Groups units. The {track-slug, slug} pair must be unique — slug uniqueness is scoped to the track.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        // Track is a relationship at this point — use slug only (track resolves
        // server-side when the live-preview page loads).
        const params = new URLSearchParams({
          path: `/doctrine/_/_/${slug}`,
          previewSecret: process.env.PREVIEW_SECRET || '',
        })
        return `${SERVER_URL}/next/preview?${params.toString()}`
      },
    },
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => req.user?.collection === 'users' && req.user.role === 'admin',
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'track',
              type: 'relationship',
              relationTo: 'doctrine-tracks',
              required: true,
              hasMany: false,
              admin: {
                description:
                  'The track this module belongs to. Drag in the studio sidebar to reorder modules within the track.',
              },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'summary',
              type: 'textarea',
              admin: {
                description:
                  '1–2 sentences. Shown on the track overview folio entry and the module overview header.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta',
              type: 'group',
              fields: [
                { name: 'title', type: 'text' },
                { name: 'description', type: 'textarea' },
                { name: 'ogImage', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'URL fragment within the track (/doctrine/{track}/{this slug}). Should be unique within the track; the seed and frontend assume it.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key within the track. Lower numbers appear first. Ties break alphabetically by title.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this module as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
