import 'server-only'
import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getMember } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getMember()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadInstance()
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
  const user = await getMember()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadInstance()
  const body = PatchBody.parse(await req.json())
  try {
    const updated = await payload.update({
      collection: 'catechist-conversations',
      id,
      data: body,
      overrideAccess: false,
      user,
    })
    // Invalidate the catechist layout so the sidebar picks up the title /
    // archived state without requiring the user to hit refresh.
    revalidatePath('/catechist', 'layout')
    return Response.json({ id: updated.id, title: updated.title, archived: updated.archived })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getMember()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadInstance()
  try {
    await payload.update({
      collection: 'catechist-conversations',
      id,
      data: { archived: true },
      overrideAccess: false,
      user,
    })
    // Invalidate the catechist layout so the sidebar's conversation list
    // re-renders without the archived row on the next request.
    revalidatePath('/catechist', 'layout')
    return new Response(null, { status: 204 })
  } catch {
    return new Response('Forbidden', { status: 403 })
  }
}
