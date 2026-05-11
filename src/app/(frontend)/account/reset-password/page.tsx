'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Reset failed.')
        return
      }
      router.push('/account/signin?reset=1')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-display tracking-tight text-ink">Set a new password</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">New password</span>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Confirm</span>
          <input
            type="password" required minLength={8} value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Setting…' : 'Set password'}
        </button>
      </form>

      <p className="mt-10 font-mono text-sm text-ink-soft">
        <Link href="/account/signin" className="underline">Back to sign in</Link>
      </p>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-24"><p className="font-display italic text-ink-soft">Loading…</p></main>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
