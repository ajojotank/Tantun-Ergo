import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  const store = await cookies()
  store.delete('payload-token')

  const url = new URL(request.url)
  const next = url.searchParams.get('next')
  const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return NextResponse.redirect(new URL(target, SERVER_URL), { status: 303 })
}

// GET-as-POST fallback so browsers without JS can sign out via a plain link.
export const GET = POST
