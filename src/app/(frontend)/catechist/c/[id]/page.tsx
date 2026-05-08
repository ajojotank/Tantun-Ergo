import { notFound, redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { Conversation } from '../../components/conversation'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') redirect('/sign-in?next=/catechist')

  let conv
  try {
    conv = await payload.findByID({
      collection: 'catechist-conversations',
      id,
      overrideAccess: false,
      user: auth.user,
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
