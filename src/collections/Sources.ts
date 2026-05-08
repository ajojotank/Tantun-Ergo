import type { CollectionConfig, CollectionAfterChangeHook } from 'payload'

export const Sources: CollectionConfig = {
  slug: 'sources',
  labels: { singular: 'Source', plural: 'Sources' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authorityTier', 'ingestStatus', 'chunkCount', 'lastIngestedAt'],
    description: 'Catechist corpus documents. Upload a file, set fields, then click "Ingest" in the sidebar.',
    group: 'Catechist',
  },
  access: {
    read: () => true,
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users'),
    update: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users'),
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  hooks: {
    afterChange: [
      (async ({ doc, previousDoc, req, operation }) => {
        const fileChanged =
          operation === 'create'
            ? Boolean(doc.file)
            : doc.file && (!previousDoc?.file || (typeof doc.file === 'object' ? doc.file.id : doc.file) !== (typeof previousDoc?.file === 'object' ? previousDoc?.file?.id : previousDoc?.file))
        if (!fileChanged) return doc
        if (doc.ingestStatus === 'ingesting') return doc
        const { ingestSource } = await import('../catechist/ingest')
        ingestSource(req.payload, doc.id as number).catch((err) => {
          req.payload.logger.error(`afterChange ingest failed: ${err}`)
        })
        return doc
      }) as CollectionAfterChangeHook,
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true,
      admin: { position: 'sidebar' } },
    { name: 'author', type: 'text' },
    { name: 'year', type: 'number' },
    {
      name: 'authorityTier',
      type: 'select',
      required: true,
      options: [
        { label: 'Scripture', value: 'scripture' },
        { label: 'Council', value: 'council' },
        { label: 'Catechism', value: 'catechism' },
        { label: 'Encyclical', value: 'encyclical' },
        { label: 'Father', value: 'father' },
        { label: 'Theologian', value: 'theologian' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'locatorFormat',
      type: 'select',
      required: true,
      options: [
        { label: 'Bible (book ch:v)', value: 'bible' },
        { label: 'CCC (§nnnn)', value: 'ccc' },
        { label: 'Roman Catechism (Part, Q.)', value: 'roman-catechism' },
        { label: 'Council canon (Sess., Can.)', value: 'council-canon' },
        { label: 'Encyclical section (§nn)', value: 'encyclical-section' },
        { label: 'Summa (Part, Q., a.)', value: 'summa' },
        { label: 'Father book/chapter', value: 'father-book-chapter' },
        { label: 'Generic 600-token chunks', value: 'generic' },
      ],
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
    { name: 'rightsNote', type: 'textarea',
      admin: { description: 'Surfaced on the Credits page. e.g. "Public domain (NPNF)", "Vatican English text, used with credit".' } },
    {
      name: 'ingestStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Ingesting', value: 'ingesting' },
        { label: 'Ingested', value: 'ingested' },
        { label: 'Error', value: 'error' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    { name: 'chunkCount', type: 'number',
      admin: { readOnly: true, position: 'sidebar' } },
    { name: 'lastIngestedAt', type: 'date',
      admin: { readOnly: true, position: 'sidebar' } },
    { name: 'errorMessage', type: 'textarea',
      admin: { readOnly: true, condition: (data) => data?.ingestStatus === 'error' } },
    { name: '_isSample', type: 'checkbox',
      admin: { position: 'sidebar', description: 'Sample/filler doc — badged in studio + frontend.' } },
  ],
}
