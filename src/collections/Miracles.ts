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
        {
          label: 'Provenance',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Eucharistic', value: 'eucharistic' },
                { label: 'Marian', value: 'marian' },
                { label: 'Healing', value: 'healing' },
                { label: 'Stigmata', value: 'stigmata' },
                { label: 'Incorruptible', value: 'incorruptible' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'ecclesialStatus',
              type: 'select',
              required: true,
              options: [
                { label: 'Approved', value: 'approved' },
                { label: 'Recognised', value: 'recognised' },
                { label: 'Worthy of belief', value: 'worthy-of-belief' },
                { label: 'Under investigation', value: 'under-investigation' },
                { label: 'Not constatat', value: 'not-constatat' },
              ],
            },
            {
              name: 'locationName',
              type: 'text',
              required: true,
              admin: { description: 'Human-readable place name, e.g. "Lanciano, Italy".' },
            },
            {
              name: 'coordinates',
              type: 'point',
              required: true,
              admin: {
                description:
                  'Pin position. Payload stores [longitude, latitude] — the same order Mapbox expects.',
              },
            },
            {
              name: 'yearOccurred',
              type: 'number',
              required: true,
              admin: { description: 'Year only (no month/day). Negative for BC.' },
            },
            {
              name: 'dateApproximate',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Renders as "c. 700" instead of "700" when true.' },
            },
            { name: 'approvalDate', type: 'date' },
            {
              name: 'approvingAuthority',
              type: 'text',
              admin: { description: 'e.g. "Bishop of Tours, 1574".' },
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
  ],
}
