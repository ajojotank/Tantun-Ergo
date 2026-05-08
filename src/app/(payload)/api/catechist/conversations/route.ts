import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { z } from 'zod'

async function authedMember(req: NextRequest) {
  const payload = await getPayload({ config })
  const cookieHeader = req.headers.get('cookie') ?? ''
  const auth = await payload.auth({ headers: new Headers({ cookie: cookieHeader }) })
  const user = auth.user
  if (!user || user.collection !== 'members') return { payload, user: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(user as any)._verified) return { payload, user: null }
  return { payload, user }
}

export async function GET(req: NextRequest) {
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const conversations = await payload.find({
    collection: 'catechist-conversations',
    where: {
      and: [{ member: { equals: user.id } }, { archived: { equals: false } }],
    },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    overrideAccess: false,
    user,
  })

  return Response.json({
    conversations: conversations.docs.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: (c.messages ?? []).length,
    })),
  })
}

const CreateBody = z.object({ title: z.string().optional() })

export async function POST(req: NextRequest) {
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = CreateBody.parse(await req.json().catch(() => ({})))
  const created = await payload.create({
    collection: 'catechist-conversations',
    data: {
      member: user.id as number,
      title: body.title ?? 'New inquiry',
      messages: [],
      archived: false,
    },
    overrideAccess: false,
    user,
  })

  return Response.json({ id: String(created.id), title: created.title })
}
