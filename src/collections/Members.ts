import type { CollectionConfig } from 'payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['displayName', 'email', '_verified', 'updatedAt'],
    description:
      'End-user accounts for the Doctrine LMS. Read access from the studio is admin-only — members cannot themselves access /admin.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000, // 10 minutes
    verify: {
      generateEmailHTML: ({ token }) => {
        const url = `${SERVER_URL}/account/verify-email?token=${encodeURIComponent(token ?? '')}`
        return `
          <p>Welcome to Tantum Ergo.</p>
          <p>Click the link below to verify your email and finish signing up:</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not request this account, you can safely ignore this message.</p>
        `
      },
      generateEmailSubject: () => 'Verify your Tantum Ergo account',
    },
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args && typeof args === 'object' && 'token' in args
          ? String((args as { token?: string }).token ?? '')
          : ''
        const url = `${SERVER_URL}/account/reset-password?token=${encodeURIComponent(token)}`
        return `
          <p>You asked to reset your Tantum Ergo password.</p>
          <p><a href="${url}">${url}</a></p>
          <p>If you did not, you can safely ignore this message.</p>
        `
      },
    },
  },
  access: {
    // Members can read only their own document. Stewards (Users with any
    // role) can read all members for support purposes.
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users') return true
      return { id: { equals: req.user.id } }
    },
    // Anyone (including unauthenticated visitors) can create — that's signup.
    create: () => true,
    // Members can update only themselves; admins can update anyone.
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.collection === 'users' && req.user.role === 'admin') return true
      if (req.user.collection === 'members') {
        return { id: { equals: req.user.id } }
      }
      return false
    },
    // Only admin stewards can delete a member.
    delete: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
    // Hide from the studio sidebar for non-admins. Admins still see it.
    admin: ({ req }) =>
      Boolean(
        req.user && req.user.collection === 'users' && req.user.role === 'admin',
      ),
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description:
          'Optional display name shown in the header dropdown. Falls back to the email local-part when empty.',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional profile image. Renders as a 32px circle in the header and 64px on /account. Members upload via the /account page; admins can override via the studio.',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['learner'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Instructor', value: 'instructor' },
        { label: 'Learner', value: 'learner' },
      ],
      saveToJWT: true,
      access: {
        update: ({ req }) => {
          const user = req.user
          if (!user) return false
          if (user.collection === 'members') return user.roles.includes('admin')
          if (user.collection === 'users') return user.role === 'admin'
          return false
        },
      },
      admin: {
        description:
          'Admins have full studio access. Instructors can author DoctrineCourses they own. Learners read the public site only.',
      },
    },
  ],
}
