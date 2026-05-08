'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/members', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, roles: ['learner'] }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setError(err?.errors?.[0]?.message ?? 'Sign-up failed.')
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-4xl font-display tracking-tight text-ink">Check your inbox.</h1>
        <p className="mt-6 text-lg text-ink-soft font-display italic">
          We sent a verification link to <span className="not-italic">{email}</span>. Open it to finish creating your account, then return here.
        </p>
        <p className="mt-8 font-mono text-sm">
          <Link href="/sign-in" className="underline">Back to sign in</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <p className="text-sm uppercase tracking-widest text-ink-soft italic font-display">Begin</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">Create account</h1>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Display name</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Email</span>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-mono uppercase tracking-wider text-ink-soft">Password</span>
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
          />
        </label>

        {error && <p className="text-sm text-rubric italic">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-10 font-mono text-sm text-ink-soft">
        Already have an account? <Link href="/sign-in" className="underline">Sign in</Link>.
      </p>
    </main>
  )
}
