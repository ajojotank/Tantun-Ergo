import { redirect } from 'next/navigation'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { Sidebar } from './components/sidebar'

export const dynamic = 'force-dynamic'

export default async function CatechistLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config })
  const h = await nextHeaders()
  const auth = await payload.auth({ headers: h })
  if (!auth.user || auth.user.collection !== 'members') {
    redirect('/sign-in?next=/catechist')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(auth.user as any)._verified) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-3xl font-display tracking-tight text-ink">Almost there.</h1>
        <p className="mt-4 font-display italic text-ink-soft">
          Please verify your email to enter the Catechist. Check your inbox for the link we sent.
        </p>
      </main>
    )
  }

  // Fetch conversations for sidebar
  const conversations = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: auth.user.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user: auth.user,
  })

  return (
    <div className="flex min-h-screen bg-vellum">
      <Sidebar
        conversations={conversations.docs.map((c) => ({
          id: String(c.id),
          title: c.title,
          updatedAt: c.updatedAt as string,
        }))}
        member={{ id: auth.user.id as number, displayName: ((auth.user as { displayName?: string }).displayName) ?? 'Friend' }}
      />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
