import type { GlobalConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home Page',
  admin: {
    description:
      'The public homepage at /. Hero, scroll-scrubbed manifesto sequence, three pillar plates, reading band — all in one place.',
    livePreview: {
      url: () => {
        const params = new URLSearchParams({
          path: '/',
          previewSecret: process.env.PREVIEW_SECRET || '',
        })
        return `${SERVER_URL}/next/preview?${params.toString()}`
      },
    },
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
      schedulePublish: true,
    },
    max: 50,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'hero',
              type: 'group',
              fields: [
                { name: 'eyebrow', type: 'text', defaultValue: 'In Hoc Signo · MMXXVI' },
                {
                  name: 'headlineLine1',
                  type: 'text',
                  defaultValue: 'A digital',
                  admin: { description: 'First line of the headline (before the italicised word).' },
                },
                {
                  name: 'headlineItalic',
                  type: 'text',
                  defaultValue: 'Sistine Chapel',
                  admin: { description: 'The italicised middle word/phrase, rendered in rubric red.' },
                },
                {
                  name: 'headlineLine2',
                  type: 'text',
                  defaultValue: 'for Catholic formation.',
                  admin: { description: 'Final line of the headline.' },
                },
                {
                  name: 'subheadline',
                  type: 'textarea',
                  defaultValue:
                    'Tantum Ergo holds three instruments inside one reverent surface — a cartographic Miracle Atlas, a long-form Doctrine LMS, and an AI Catechist bound to citation. Mobile-first. Scroll-scrubbed. Built to last centuries.',
                },
                {
                  name: 'ctaPrimaryLabel',
                  type: 'text',
                  defaultValue: 'Begin pilgrimage',
                },
                { name: 'ctaPrimaryHref', type: 'text', defaultValue: '/atlas' },
                {
                  name: 'ctaSecondaryLabel',
                  type: 'text',
                  defaultValue: 'Read the manifesto',
                },
                { name: 'ctaSecondaryHref', type: 'text', defaultValue: '/manifesto' },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description:
                      'Full-bleed background image for the hero section. Aspect 16:9 ideal. Mobile crops centre.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Manifesto Sequence',
          fields: [
            {
              name: 'manifestoSequence',
              type: 'group',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { description: 'When off, the section is omitted from the homepage entirely.' },
                },
                {
                  name: 'frames',
                  type: 'array',
                  minRows: 0,
                  maxRows: 8,
                  labels: { singular: 'Frame', plural: 'Frames' },
                  admin: { description: '3–6 frames recommended. Order = scroll order.' },
                  fields: [
                    { name: 'eyebrow', type: 'text' },
                    { name: 'caption', type: 'richText' },
                    { name: 'image', type: 'upload', relationTo: 'media' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Pillars',
          fields: [
            {
              name: 'pillars',
              type: 'group',
              fields: [
                { name: 'eyebrow', type: 'text', defaultValue: 'Three pillars' },
                {
                  name: 'headlineLine1',
                  type: 'text',
                  defaultValue: 'Cartography. Formation.',
                },
                {
                  name: 'headlineItalic',
                  type: 'text',
                  defaultValue: 'Dialogue.',
                  admin: { description: 'Final word/phrase, rendered italic in rubric red.' },
                },
                {
                  name: 'atlas',
                  type: 'group',
                  label: 'Plate I — Atlas',
                  fields: [
                    { name: 'title', type: 'text', defaultValue: 'Atlas' },
                    {
                      name: 'intent',
                      type: 'textarea',
                      defaultValue:
                        'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
                    },
                    { name: 'href', type: 'text', defaultValue: '/atlas' },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        description:
                          'Background image for this pillar plate. Aspect 4:5 portrait.',
                      },
                    },
                  ],
                },
                {
                  name: 'doctrine',
                  type: 'group',
                  label: 'Plate II — Doctrine',
                  fields: [
                    { name: 'title', type: 'text', defaultValue: 'Doctrine' },
                    {
                      name: 'intent',
                      type: 'textarea',
                      defaultValue: 'A breviary-paced LMS over councils, encyclicals, the Catechism.',
                    },
                    { name: 'href', type: 'text', defaultValue: '/doctrine' },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        description:
                          'Background image for this pillar plate. Aspect 4:5 portrait.',
                      },
                    },
                  ],
                },
                {
                  name: 'catechist',
                  type: 'group',
                  label: 'Plate III — Catechist',
                  fields: [
                    { name: 'title', type: 'text', defaultValue: 'Catechist' },
                    {
                      name: 'intent',
                      type: 'textarea',
                      defaultValue: 'An interlocutor bound to citation. Cites; never invents.',
                    },
                    { name: 'href', type: 'text', defaultValue: '/catechist' },
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      admin: {
                        description:
                          'Background image for this pillar plate. Aspect 4:5 portrait.',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Reading Band',
          fields: [
            {
              name: 'readingBand',
              type: 'group',
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  defaultValue: 'From the reading room',
                },
                {
                  name: 'emptyMessage',
                  type: 'text',
                  defaultValue: 'Reading room opens soon.',
                  admin: { description: 'Shown when no published Articles exist yet.' },
                },
                {
                  name: 'limit',
                  type: 'number',
                  defaultValue: 6,
                  admin: { description: 'How many recent articles to surface.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
