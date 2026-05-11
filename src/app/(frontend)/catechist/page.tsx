import { redirect } from 'next/navigation'

import { requireMember } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

import { ensureWelcomeConversation } from '../../../catechist/seed/welcomeConversation'
import { EmptyState } from './components/empty-state'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Catechist · Tantum Ergo' }

export default async function CatechistRoot({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams
  const member = await requireMember('/catechist')

  const payload = await getPayloadInstance()

  // First sign-in: create welcome conversation
  if (sp.welcome === '1') {
    const id = await ensureWelcomeConversation(payload, member.id as number)
    if (id) redirect(`/catechist/c/${id}`)
  }

  // Otherwise: redirect to most-recent conversation, or render empty state.
  // The empty state has its own composer (clicking "Begin" creates a fresh
  // conversation and routes to it) so a brand-new user has a clear next step.
  const recent = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: member.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user: { ...member, collection: 'members' },
  })
  if (recent.docs.length > 0) redirect(`/catechist/c/${recent.docs[0].id}`)

  return <EmptyState />
}
