'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/catechist'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Sign-in failed.')
        return
      }
      router.push(next)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm uppercase tracking-widest text-ink-soft italic font-display">Return</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">Sign in</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Returning…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-10 space-y-2 font-mono text-sm text-ink-soft">
        <p><Link href="/sign-in/forgot" className="underline">Forgot your password?</Link></p>
        <p>No account? <Link href="/sign-up" className="underline">Begin here</Link>.</p>
      </div>
    </main>
  )
}
