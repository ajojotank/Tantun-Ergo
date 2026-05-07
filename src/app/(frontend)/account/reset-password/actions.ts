'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from '@/lib/payload'

export type ResetPasswordState = {
  error: string | null
}

export const INITIAL: ResetPasswordState = { error: null }

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!token) return { error: 'Reset token is missing.' }
  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  let token2: string
  let exp: number
  try {
    const p = await payload()
    const result = await p.resetPassword({
      collection: 'members',
      data: { token, password },
      overrideAccess: true,
    })
    if (!result?.token || !result.user || typeof result.user !== 'object') {
      return { error: 'That reset link is no longer valid.' }
    }
    // Payload's resetPassword returns a fresh JWT — log the user in directly
    // so they don't have to re-type the password they just set.
    token2 = result.token
    // resetPassword doesn't return `exp`; derive it from auth.tokenExpiration
    // (30 days, see Members.ts). Match what login() would set.
    exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  } catch {
    return { error: 'That reset link is no longer valid. Request a new one.' }
  }

  const store = await cookies()
  store.set('payload-token', token2, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(exp * 1000),
    path: '/',
  })

  redirect('/doctrine')
}
