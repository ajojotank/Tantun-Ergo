import type { CollectionConfig } from 'payload'

export const CatechistConversations: CollectionConfig = {
  slug: 'catechist-conversations',
  labels: { singular: 'Catechist Conversation', plural: 'Catechist Conversations' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'member', 'archived', 'updatedAt'],
    description: 'Per-Member multi-turn threads with the Catechist. Stewards can read for support; Members manage their own.',
    group: 'Catechist',
    hidden: ({ user }) => {
      if (!user) return true
      if (user.collection === 'users') return user.role !== 'admin'
      return true
    },
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { member: { equals: req.user.id } }
    },
    create: ({ req }) =>
      Boolean(req.user && req.user.collection === 'members' && (req.user as { _verified?: boolean })?._verified === true),
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { member: { equals: req.user.id } }
    },
    delete: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return req.user.role === 'admin'
      return { member: { equals: req.user.id } }
    },
  },
  fields: [
    { name: 'member', type: 'relationship', relationTo: 'members', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'messages',
      type: 'array',
      fields: [
        { name: 'role', type: 'select', required: true,
          options: [{ label: 'User', value: 'user' }, { label: 'Assistant', value: 'assistant' }] },
        { name: 'content', type: 'textarea', required: true },
        { name: 'citations', type: 'json',
          admin: { description: 'Array<{ chunkId, locator, quotedSpan }>; assistant only.' } },
        { name: 'components', type: 'json',
          admin: { description: 'Serialized tool calls (scriptureCard etc.) for re-render; assistant only.' } },
        { name: 'createdAt', type: 'date', required: true },
      ],
    },
    { name: 'archived', type: 'checkbox', defaultValue: false, index: true,
      admin: { description: 'Soft-delete flag.' } },
  ],
  timestamps: true,
}
