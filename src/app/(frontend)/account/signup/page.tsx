'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { signUpAction, type SignUpState } from './actions'

const INITIAL: SignUpState = { error: null, success: false }

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  )
}

function SignUpForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const [state, action, pending] = useActionState(signUpAction, INITIAL)

  if (state.success) {
    return (
      <AuthShell
        eyebrow="Account · Verify your email"
        title="Almost in."
        intro="We sent a verification link to your inbox. Click it to finish signing up — once verified, you can sign in and pick up your reading."
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Already verified?{' '}
          <Link
            href={next ? `/account/signin?next=${encodeURIComponent(next)}` : '/account/signin'}
            className="text-ink underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Account · Create"
      title="Begin formation."
      intro="Make an account so your reading position carries across your devices. We'll only ask for your email and a password."
    >
      <form action={action} className="space-y-5">
        <Field name="displayName" type="text" label="Display name (optional)" autoComplete="name" />
        <Field name="email" type="email" label="Email" autoComplete="email" required />
        <Field
          name="password"
          type="password"
          label="Password (8+ chars)"
          autoComplete="new-password"
          required
        />
        <Field
          name="confirm"
          type="password"
          label="Confirm password"
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
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        Already have an account?{' '}
        <Link
          href={next ? `/account/signin?next=${encodeURIComponent(next)}` : '/account/signin'}
          className="text-ink underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
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
