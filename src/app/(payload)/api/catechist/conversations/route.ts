import 'server-only'
import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getMember } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

export async function GET(_req: NextRequest) {
  const user = await getMember()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadInstance()

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
  const user = await getMember()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadInstance()

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

  // Sidebar lives on the catechist layout — invalidate so the freshly
  // created conversation appears without a manual refresh.
  revalidatePath('/catechist', 'layout')

  return Response.json({ id: String(created.id), title: created.title })
}
