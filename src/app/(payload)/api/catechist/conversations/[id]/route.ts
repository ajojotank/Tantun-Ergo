import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  try {
    const conv = await payload.findByID({
      collection: 'catechist-conversations',
      id,
      overrideAccess: false,
      user,
    })
    return Response.json(conv)
  } catch {
    return new Response('Not found', { status: 404 })
  }
}

const PatchBody = z.object({
  title: z.string().optional(),
  archived: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const body = PatchBody.parse(await req.json())
  try {
    const updated = await payload.update({
      collection: 'catechist-conversations',
      id,
      data: body,
      overrideAccess: false,
      user,
    })
    return Response.json({ id: updated.id, title: updated.title, archived: updated.archived })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { payload, user } = await authedMember(req)
  if (!user) return new Response('Unauthorized', { status: 401 })
  try {
    await payload.update({
      collection: 'catechist-conversations',
      id,
      data: { archived: true },
      overrideAccess: false,
      user,
    })
    return new Response(null, { status: 204 })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}
