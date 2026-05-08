'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/members/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-3xl font-display tracking-tight text-ink">Check your inbox.</h1>
        <p className="mt-4 text-ink-soft font-display italic">
          If an account exists for {email}, we sent a reset link.
        </p>
        <p className="mt-8 font-mono text-sm">
          <Link href="/sign-in" className="underline">Back to sign in</Link>
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-display tracking-tight text-ink">Forgot password</h1>
      <p className="mt-4 text-ink-soft font-display italic">Enter your email; we'll send a reset link.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <input
          type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border-b border-ink/30 bg-transparent px-0 py-2 text-lg text-ink outline-none focus:border-rubric"
        />
        <button
          type="submit" disabled={submitting}
          className="border border-ink px-6 py-3 font-mono text-sm uppercase tracking-widest text-ink hover:bg-ink hover:text-vellum transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </main>
  )
}
