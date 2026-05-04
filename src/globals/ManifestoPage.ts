import type { GlobalConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const ManifestoPage: GlobalConfig = {
  slug: 'manifesto-page',
  label: 'Manifesto Page',
  admin: {
    description: 'The /manifesto page — long-form vision essay.',
    livePreview: {
      url: () => {
        const params = new URLSearchParams({
          path: '/manifesto',
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
    { name: 'eyebrow', type: 'text', defaultValue: 'Manifesto' },
    {
      name: 'title',
      type: 'text',
      defaultValue: 'A digital Sistine Chapel.',
    },
    { name: 'body', type: 'richText' },
  ],
}
