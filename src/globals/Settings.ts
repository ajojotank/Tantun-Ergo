import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site Settings',
  admin: {
    description: 'Site-wide chrome — title, tagline, footer copy, socials.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      defaultValue: 'Tantum Ergo',
      required: true,
    },
    {
      name: 'siteTagline',
      type: 'text',
      defaultValue: 'A digital Sistine Chapel for Catholic formation.',
    },
    {
      name: 'footerCopy',
      type: 'richText',
      admin: { description: 'Long-form footer copy. Plain prose works fine here.' },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'X', value: 'x' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Email', value: 'email' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'mapboxStyle',
      type: 'text',
      label: 'Mapbox style URL',
      admin: {
        description: 'mapbox:// URL. Leave blank for default style. Used by /atlas (Plan 2).',
      },
    },
    {
      name: 'catechistRateLimit',
      type: 'group',
      fields: [
        { name: 'requestsPerHour', type: 'number', defaultValue: 20, required: true },
        {
          name: 'refusalMessage',
          type: 'text',
          defaultValue:
            'You've asked many questions in a short time. Please rest and return shortly.',
        },
      ],
    },
    {
      name: 'showSampleBadges',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Hide [Sample] badges sitewide once content team is ready for launch.',
      },
    },
  ],
}
