import { requireMember, memberDisplayName } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

import { Sidebar } from './components/sidebar'

export const dynamic = 'force-dynamic'

export default async function CatechistLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember('/catechist')

  const payload = await getPayloadInstance()
  const conversations = await payload.find({
    collection: 'catechist-conversations',
    where: { and: [{ member: { equals: member.id } }, { archived: { equals: false } }] },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user: { ...member, collection: 'members' },
  })

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-vellum">
      <Sidebar
        conversations={conversations.docs.map((c) => ({
          id: String(c.id),
          title: c.title,
          updatedAt: c.updatedAt as string,
        }))}
        member={{ id: member.id as number, displayName: memberDisplayName(member) }}
      />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  )
}
