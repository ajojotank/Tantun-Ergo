import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const DoctrineUnits: CollectionConfig = {
  slug: 'doctrine-units',
  labels: { singular: 'Doctrine Unit', plural: 'Doctrine Units' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'module', 'order', '_status'],
    description:
      'A single readable folio. Reading lane is required. Watch (video upload) and Listen (audio upload) lanes are optional — leave empty and the frontend hides those tabs entirely.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const params = new URLSearchParams({
          path: `/doctrine/_/_/_/${slug}`,
          previewSecret: process.env.PREVIEW_SECRET || '',
          preview: 'true',
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
            {
              name: 'module',
              type: 'relationship',
              relationTo: 'doctrine-modules',
              required: true,
              hasMany: false,
              admin: {
                description:
                  'The module this unit belongs to. Order within the module is set by the `order` sidebar field.',
              },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'introduction',
              type: 'richText',
              admin: {
                description:
                  'Optional short opener. Renders above the lane content on every lane.',
              },
            },
            {
              name: 'lanes',
              type: 'group',
              admin: {
                description:
                  'Three lanes — only Reading is required. Watch and Listen tabs hide automatically when their media is empty.',
              },
              fields: [
                {
                  name: 'reading',
                  type: 'richText',
                  required: true,
                  admin: {
                    description:
                      'Primary lane. Always shown. Default tab when the unit player opens.',
                  },
                },
                {
                  name: 'watchVideo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Optional video upload (MP4/WebM). When present, a "Watch" tab appears in the lane switcher.',
                  },
                },
                {
                  name: 'listenAudio',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Optional audio upload (MP3/WAV). When present, a "Listen" tab appears in the lane switcher.',
                  },
                },
              ],
            },
            {
              name: 'masteryCheck',
              type: 'group',
              admin: {
                description:
                  'Single multiple-choice question shown at the bottom of every lane. Self-graded, gentle — no streaks, no badges. Leave the prompt empty to disable the check entirely.',
              },
              fields: [
                {
                  name: 'prompt',
                  type: 'text',
                  admin: {
                    description:
                      'The question. Spec convention: phrase as "Do you remember…?". Leave empty to skip the check.',
                  },
                },
                {
                  name: 'options',
                  type: 'array',
                  minRows: 0,
                  maxRows: 6,
                  labels: { singular: 'Option', plural: 'Options' },
                  admin: {
                    description:
                      'Up to six options. Mark exactly one as correct. The affirmation is the one-line response shown after the user submits.',
                  },
                  fields: [
                    { name: 'text', type: 'text', required: true },
                    {
                      name: 'isCorrect',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { description: 'Mark exactly one option correct.' },
                    },
                    {
                      name: 'affirmation',
                      type: 'text',
                      admin: {
                        description:
                          'One-line response shown when the user picks this option. For correct options, an affirming line; for incorrect, a gentle correction.',
                      },
                    },
                  ],
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
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'URL fragment within the module (/doctrine/{track}/{module}/{this slug}). Should be unique within the module.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Sort key within the module. Lower numbers appear first. Drives the "Folio iii. of vii." footer numbering and the "Turn page" link target.',
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this unit as filler. Frontend renders a [Sample] badge.',
      },
    },
  ],
}
