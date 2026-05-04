// src/app/next/preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const secret = searchParams.get('previewSecret')

  if (!path) {
    return new Response('Missing `path` query param', { status: 400 })
  }
  // Only allow site-relative paths (defence in depth — never let an attacker
  // use this endpoint to set draftMode and redirect to an external URL).
  if (!path.startsWith('/')) {
    return new Response('`path` must be site-relative (start with /)', { status: 400 })
  }
  if (!process.env.PREVIEW_SECRET) {
    return new Response('PREVIEW_SECRET not configured on server', { status: 500 })
  }
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 })
  }

  const dm = await draftMode()
  dm.enable()
  redirect(path)
}
