'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { resetPasswordAction, type ResetPasswordState } from './actions'

// Lives client-side: `'use server'` modules can only export async functions.
const INITIAL: ResetPasswordState = { error: null }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    INITIAL,
  )

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account · Reset"
        title="Missing token."
        intro="The reset link is incomplete. Try opening the link from your inbox again, or request a fresh one."
      >
        <Link
          href="/account/forgot-password"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          Request a new link →
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Reset"
      title="Set a new password."
      intro="Type your new password twice. We'll sign you in once it's saved."
    >
      <form action={action} className="space-y-5">
        <input type="hidden" name="token" value={token} />
        <Field
          name="password"
          type="password"
          label="New password (8+ chars)"
          autoComplete="new-password"
          required
        />
        <Field
          name="confirm"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
        />
        {state.error ? (
          <p className="font-display text-sm italic text-rubric-deep">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Set password'}
        </button>
      </form>
    </AuthShell>
  )
}

function Field({
  name,
  label,
  type,
  autoComplete,
  required,
}: {
  name: string
  label: string
  type: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
      />
    </label>
  )
}
