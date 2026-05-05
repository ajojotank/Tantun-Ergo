import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Miracles: CollectionConfig = {
  slug: 'miracles',
  labels: { singular: 'Miracle', plural: 'Miracles' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'ecclesialStatus', 'yearOccurred', '_status'],
    description:
      'The Atlas corpus. Each miracle gets a pin on /atlas; the inPilgrimage flag promotes it to the curated scrolltelling chapters.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/atlas?focus=${slug}`,
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
    delete: ({ req }) => req.user?.role === 'admin',
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
              required: true,
              admin: {
                description:
                  '1–2 sentences. Shown in the pin tooltip and the drawer header.',
              },
            },
            { name: 'narrative', type: 'richText' },
            {
              name: 'sources',
              type: 'array',
              labels: { singular: 'Source', plural: 'Sources' },
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text' },
                { name: 'attribution', type: 'text' },
              ],
            },
            {
              name: 'artwork',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: 'Reliquary images shown in the drawer carousel.',
              },
            },
          ],
        },
      ],
    },
  ],
}
