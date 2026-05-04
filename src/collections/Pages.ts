import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Long-form editorial surfaces — homepage, formation primers, and standalone meditations.',
    livePreview: {
      url: ({ data }) => {
        const slug = typeof data?.slug === 'string' ? data.slug : ''
        const pageType = typeof data?.pageType === 'string' ? data.pageType : 'generic'
        let path = ''
        if (pageType === 'manifesto') path = '/manifesto'
        else if (pageType === 'credits') path = '/credits'
        else if (pageType === 'reading-article') path = `/reading/${slug}`
        else if (slug && slug !== 'home') path = `/${slug}`
        const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
        const params = new URLSearchParams({
          path: path || '/',
          previewSecret: process.env.PREVIEW_SECRET || '',
        })
        return `${base}/next/preview?${params.toString()}`
      },
    },
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return {
        _status: { equals: 'published' },
      }
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
              name: 'pageType',
              type: 'select',
              required: true,
              defaultValue: 'generic',
              options: [
                { label: 'Home block', value: 'home-block' },
                { label: 'Manifesto', value: 'manifesto' },
                { label: 'Credits', value: 'credits' },
                { label: 'Reading article', value: 'reading-article' },
                { label: 'Generic', value: 'generic' },
              ],
              admin: {
                description: 'Drives where this Page surfaces. Manifesto and Credits should only have one published doc each.',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'subtitle',
              type: 'text',
            },
            {
              name: 'hero',
              type: 'group',
              fields: [
                {
                  name: 'eyebrow',
                  type: 'text',
                  admin: { description: 'Small label above the headline.' },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
            {
              name: 'body',
              type: 'richText',
            },
            {
              name: 'excerpt',
              type: 'textarea',
              admin: {
                description: 'Short summary shown on listing pages (Reading index, home preview band).',
                condition: (data) => data?.pageType === 'reading-article',
              },
            },
            {
              name: 'publishedAt',
              type: 'date',
              admin: {
                position: 'sidebar',
                description: 'Sort key for Reading index. Defaults to creation time.',
                condition: (data) => data?.pageType === 'reading-article',
              },
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
        description: "URL fragment — use 'home' for the root.",
      },
    },
    {
      name: '_isSample',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marks this Page as filler / placeholder for the content team.',
      },
    },
  ],
}
