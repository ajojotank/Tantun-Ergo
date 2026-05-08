'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [state, setState] = useState<'verifying' | 'ok' | 'error'>('verifying')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Missing verification token.')
      return
    }
    ;(async () => {
      const r = await fetch(`/api/members/verify/${encodeURIComponent(token)}`, { method: 'POST' })
      if (!r.ok) {
        setState('error')
        setMessage('This verification link is invalid or has expired.')
        return
      }
      setState('ok')
      setTimeout(() => router.push('/sign-in?verified=1&next=/catechist'), 1500)
    })()
  }, [token, router])

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      {state === 'verifying' && (
        <p className="font-display italic text-ink-soft">Verifying…</p>
      )}
      {state === 'ok' && (
        <>
          <h1 className="text-3xl font-display tracking-tight text-ink">Verified.</h1>
          <p className="mt-4 font-display italic text-ink-soft">Sending you to sign in…</p>
        </>
      )}
      {state === 'error' && (
        <>
          <h1 className="text-3xl font-display tracking-tight text-ink">Verification failed.</h1>
          <p className="mt-4 font-display italic text-ink-soft">{message}</p>
          <p className="mt-8 font-mono text-sm">
            <Link href="/sign-up" className="underline">Try signing up again</Link>
          </p>
        </>
      )}
    </main>
  )
}
