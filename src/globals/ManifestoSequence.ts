import type { GlobalConfig } from 'payload'

export const ManifestoSequence: GlobalConfig = {
  slug: 'manifesto-sequence',
  label: 'Home · Manifesto Sequence',
  admin: {
    description:
      'The scroll-scrubbed image sequence on the homepage. 3–6 frames recommended. Order = scroll order.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
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
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'caption', type: 'richText' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
