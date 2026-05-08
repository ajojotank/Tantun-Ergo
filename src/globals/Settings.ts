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
      name: 'brand',
      type: 'group',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional custom logo. If unset, the chi-rho + wordmark default renders.',
          },
        },
        {
          name: 'faviconLight',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'PNG, transparent background, 32×32 or 64×64.' },
        },
        {
          name: 'faviconDark',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'PNG, transparent background, for dark mode.' },
        },
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
        {
          name: 'dailyLimit',
          type: 'number',
          defaultValue: 50,
          admin: { description: 'Per-Member daily cap on /api/catechist/ask requests.' },
        },
        {
          name: 'refusalMessage',
          type: 'textarea',
          defaultValue:
            "I cannot answer this with confidence from the sources I've read. Here are the closest passages I found —",
          admin: {
            description:
              'Shown when retrieval+generation cannot produce a citation-bound answer.',
          },
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
