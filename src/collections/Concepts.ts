import type { CollectionConfig } from 'payload'

export const Concepts: CollectionConfig = {
  slug: 'concepts',
  labels: { singular: 'Concept', plural: 'Concepts' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'parent'],
    description: 'Curated Catholic ontology. Each chunk is tagged with 3-7 concepts at ingestion.',
    group: 'Catechist',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user && req.user.collection === 'users'),
    update: ({ req }) => Boolean(req.user && req.user.collection === 'users'),
    delete: ({ req }) =>
      Boolean(req.user && req.user.collection === 'users' && req.user.role === 'admin'),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'definition', type: 'textarea', required: true,
      admin: { description: 'One-paragraph definition; used in the Gemini Flash classification prompt.' } },
    { name: 'parent', type: 'relationship', relationTo: 'concepts',
      admin: { description: 'Optional taxonomy parent.' } },
    { name: 'synonyms', type: 'array',
      fields: [{ name: 'phrase', type: 'text', required: true }],
      admin: { description: 'Alternate phrasings used for matching, e.g. "transubstantiation" under Real Presence.' } },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Trinity / God', value: 'trinity-god' },
        { label: 'Christology', value: 'christology' },
        { label: 'Soteriology / Grace', value: 'soteriology' },
        { label: 'Sacraments', value: 'sacraments' },
        { label: 'Moral theology', value: 'moral' },
        { label: 'Ecclesiology', value: 'ecclesiology' },
        { label: 'Eschatology', value: 'eschatology' },
        { label: 'Mariology', value: 'mariology' },
        { label: 'Spirituality', value: 'spirituality' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
}
