import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineTracks: CollectionConfig = {
  slug: 'doctrine-tracks',
  labels: { singular: 'Doctrine Track', plural: 'Doctrine Tracks' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', '_status'],
    description:
      'Top-level LMS container. Each track holds an ordered set of modules. Listed at /doctrine.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/doctrine/${slug}`,
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
            { name: 'title', type: 'text', required: true },
            {
              name: 'summary',
              type: 'textarea',
              admin: {
                description:
                  '1–2 sentences. Shown on the catalogue plate and the track overview header.',
              },
            },
            {
              name: 'coverPlate',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Hero image for the catalogue plate. 4:5 aspect ratio reads best.',
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
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL fragment under /doctrine/.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key for the catalogue. Lower numbers appear first. Ties break alphabetically by title.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this track as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
