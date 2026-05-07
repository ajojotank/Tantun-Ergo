import type { Metadata } from 'next'
import Link from 'next/link'

import { Avatar } from '../components/account/avatar'
import {
  memberAvatarUrl,
  memberDisplayName,
  requireMember,
} from '@/lib/auth'

import { AccountForms } from './forms'

export const metadata: Metadata = { title: 'Account · Tantum Ergo' }

export default async function AccountPage() {
  const member = await requireMember('/account')
  const displayName = memberDisplayName(member)
  const avatarUrl = memberAvatarUrl(member)

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8 md:py-24">
      <Link
        href="/doctrine"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft transition-colors hover:text-ink"
      >
        <span aria-hidden>←</span>
        Doctrine
      </Link>

      <div className="mt-10 flex items-center gap-5">
        <Avatar imageUrl={avatarUrl} name={displayName} size={64} />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Account
          </p>
          <h1 className="mt-2 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-5xl">
            {displayName}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            {member.email}
          </p>
        </div>
      </div>

      <AccountForms
        memberId={String(member.id)}
        displayName={member.displayName ?? ''}
        avatarUrl={avatarUrl}
        email={member.email}
      />

      <div className="mt-16 border-t border-ink/10 pt-6">
        <form action="/account/sign-out" method="post">
          <button
            type="submit"
            className="font-mono text-[11px] uppercase tracking-[0.22em] text-rubric-deep underline-offset-4 hover:underline"
          >
            Sign out of this device
          </button>
        </form>
      </div>
    </main>
  )
}
