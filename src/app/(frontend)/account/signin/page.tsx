'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useActionState } from 'react'

import { AuthShell } from '../../components/account/auth-shell'
import { destinationContext } from '../../components/account/destination-context'
import { signInAction, type SignInState } from './actions'

const INITIAL: SignInState = { error: null }

function SignInForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  const verified = searchParams.get('verified') === '1'

  const [state, action, pending] = useActionState(signInAction, INITIAL)
  const ctx = destinationContext(next, 'signin')

  return (
    <AuthShell eyebrow={ctx.eyebrow} title={ctx.title} intro={ctx.intro}>
      {verified ? (
        <p className="mb-6 rounded-xl border border-incense/30 bg-incense/10 px-4 py-3 font-display text-base italic leading-relaxed text-ink">
          Your email is verified — go ahead and sign in.
        </p>
      ) : null}
      <form action={action} className="space-y-5">
        <input type="hidden" name="next" value={next} />
        <Field name="email" type="email" label="Email" autoComplete="email" required />
        <Field
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
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
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-8 flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        <p>
          New here?{' '}
          <Link
            href={next ? `/account/signup?next=${encodeURIComponent(next)}` : '/account/signup'}
            className="text-ink underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p>
          <Link
            href="/account/forgot-password"
            className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
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
