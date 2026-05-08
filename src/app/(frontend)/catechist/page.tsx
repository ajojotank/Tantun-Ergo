import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { ensureWelcomeConversation } from '../../../catechist/seed/welcomeConversation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Catechist — Tantum Ergo' }

export default async function CatechistRoot({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') redirect('/sign-in?next=/catechist')

  // First sign-in: create welcome conversation
  if (sp.welcome === '1') {
    const id = await ensureWelcomeConversation(payload, auth.user.id as number)
    if (id) redirect(`/catechist/c/${id}`)
  }

  // Otherwise: redirect to most-recent conversation, or empty state
  const recent = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: auth.user.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: false,
    user: auth.user,
  })
  if (recent.docs.length > 0) redirect(`/catechist/c/${recent.docs[0].id}`)

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="font-display italic text-ink-soft text-sm tracking-widest uppercase">Catechist</p>
      <h1 className="mt-2 text-5xl font-display tracking-tight text-ink leading-none">Ask anything.</h1>
      <p className="mt-6 text-lg font-display italic text-ink-soft">
        Click <em>+ New inquiry</em> in the sidebar to begin.
      </p>
    </main>
  )
}
