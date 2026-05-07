import { Suspense } from 'react'

import { getMember, memberAvatarUrl, memberDisplayName } from '@/lib/auth'

import { SiteHeaderClient } from './site-header-client'

export async function SiteHeader() {
  // The header lives in the root layout, so it runs on every navigation.
  // Auth is a single DB lookup keyed on the token cookie; cheap enough.
  const member = await getMember()
  const displayName = member ? memberDisplayName(member) : null
  const avatarUrl = member ? memberAvatarUrl(member) : null
  return (
    <Suspense fallback={null}>
      <SiteHeaderClient displayName={displayName} avatarUrl={avatarUrl} />
    </Suspense>
  )
}
