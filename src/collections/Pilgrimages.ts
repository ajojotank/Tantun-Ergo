// src/collections/Pilgrimages.ts
import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Pilgrimages: CollectionConfig = {
  slug: 'pilgrimages',
  labels: { singular: 'Pilgrimage', plural: 'Pilgrimages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'subtitle', '_status'],
    description:
      'Curated routes through the Miracle Atlas. Each pilgrimage is an ordered list of miracles the end-user walks as a scrolltelling chapter sequence at /atlas/pilgrimages/{slug}.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/atlas/pilgrimages/${slug}`,
          previewSecret: process.env.PREVIEW_SECRET || '',
        })
        return `${SERVER_URL}/next/preview?${params.toString()}`
      },
    },
    hidden: ({ user }) => {
      if (!user) return true
      if (user.collection === 'users') return user.role !== 'admin'
      if (user.collection === 'members') return !user.roles.includes('admin')
      return true
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
              name: 'subtitle',
              type: 'text',
              admin: {
                description:
                  'Single-line tagline shown beneath the title on the gallery plate.',
              },
            },
            {
              name: 'intro',
              type: 'textarea',
              admin: {
                description:
                  '1–2 sentence framing displayed on the walker page above the first chapter.',
              },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Hero plate for the gallery card and walker page.',
              },
            },
            {
              name: 'route',
              type: 'array',
              required: true,
              minRows: 2,
              labels: { singular: 'Stop', plural: 'Route' },
              admin: {
                description:
                  'Ordered list of miracles. Drag to reorder; the order here is the chapter sequence the user walks.',
              },
              fields: [
                {
                  name: 'miracle',
                  type: 'relationship',
                  relationTo: 'miracles',
                  required: true,
                  hasMany: false,
                },
                {
                  name: 'chapterNote',
                  type: 'textarea',
                  admin: {
                    description:
                      'Optional override for this stop on this pilgrimage. Leave blank to use the miracle\'s default summary.',
                  },
                },
              ],
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
        description: 'URL fragment under /atlas/pilgrimages/.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this pilgrimage as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
