import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthShell } from '../../components/account/auth-shell'
import { payload } from '@/lib/payload'

type SearchParams = Promise<{ token?: string }>

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <AuthShell
        eyebrow="Account · Verify"
        title="Missing token."
        intro="The verification link is incomplete. Try opening the link from your inbox again, or sign up to resend."
      >
        <Link
          href="/account/signup"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink underline-offset-4 hover:underline"
        >
          Back to sign-up →
        </Link>
      </AuthShell>
    )
  }

  let ok = false
  try {
    const p = await payload()
    ok = await p.verifyEmail({ collection: 'members', token })
  } catch {
    ok = false
  }

  if (ok) {
    redirect('/account/signin?verified=1')
  }

  return (
    <AuthShell
      eyebrow="Account · Verify"
      title="That link expired."
      intro="The verification link is no longer valid. Sign up again with the same email to get a fresh link, or sign in if your email was already verified."
    >
      <div className="flex flex-col gap-3 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link href="/account/signup" className="text-ink underline-offset-4 hover:underline">
          Resend verification →
        </Link>
        <Link href="/account/signin" className="text-ink-soft hover:text-ink">
          Or sign in
        </Link>
      </div>
    </AuthShell>
  )
}
