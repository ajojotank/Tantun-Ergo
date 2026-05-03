import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Asset',
    plural: 'Reliquary',
  },
  admin: {
    description:
      'Imagery, audio, and reference scans used across the Atlas, LMS, and editorial.',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'audio/*', 'video/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 480, position: 'centre' },
      { name: 'card', width: 960, height: 720, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
      { name: 'sequence', width: 1440, height: 1440, position: 'centre' },
    ],
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Reverent, descriptive alt text — read aloud by screen readers.',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'attribution',
      type: 'text',
      admin: {
        description: 'Photographer, archive, or rights holder.',
      },
    },
  ],
}
