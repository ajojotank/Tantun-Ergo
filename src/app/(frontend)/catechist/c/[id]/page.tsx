import { notFound } from 'next/navigation'

import { requireMember } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

import { Conversation } from '../../components/conversation'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await requireMember(`/catechist/c/${id}`)

  const payload = await getPayloadInstance()
  let conv
  try {
    conv = await payload.findByID({
      collection: 'catechist-conversations',
      id,
      overrideAccess: false,
      user: { ...member, collection: 'members' },
    })
  } catch {
    notFound()
  }

  return (
    <Conversation
      conversationId={String(conv.id)}
      title={conv.title}
      initialMessages={(conv.messages ?? []).map((m, i) => ({
        id: `m-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        citations: (m.citations ?? []) as any[],
      }))}
    />
  )
}
