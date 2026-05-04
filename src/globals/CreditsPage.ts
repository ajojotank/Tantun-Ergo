import type { GlobalConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const CreditsPage: GlobalConfig = {
  slug: 'credits-page',
  label: 'Credits Page',
  admin: {
    description:
      'The /credits page — sources, attributions, ecclesial review notes.',
    livePreview: {
      url: () => {
        const params = new URLSearchParams({
          path: '/credits',
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
  fields: [
    { name: 'eyebrow', type: 'text', defaultValue: 'Credits' },
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Sources & ecclesial review',
    },
    { name: 'body', type: 'richText' },
  ],
}
