'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { forgotPasswordAction, INITIAL, type ForgotPasswordState } from './actions'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    INITIAL,
  )

  if (state.status === 'sent') {
    return (
      <AuthShell
        eyebrow="Account · Reset"
        title="Check your inbox."
        intro="If an account exists for the address you entered, we sent a link to reset its password. The link is good for the next hour."
      >
        <Link
          href="/account/signin"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          ← Back to sign in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Reset"
      title="Forgot your password?"
      intro="Enter your email and we'll send a link to set a new one. The link expires after an hour."
    >
      <form action={action} className="space-y-5">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
          />
        </label>
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        Remembered it?{' '}
        <Link href="/account/signin" className="text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
