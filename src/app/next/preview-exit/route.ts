// src/app/next/preview-exit/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') ?? '/'
  if (!path.startsWith('/')) {
    return new Response('`path` must be site-relative', { status: 400 })
  }
  const dm = await draftMode()
  dm.disable()
  redirect(path)
}
