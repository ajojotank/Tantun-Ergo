'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { payload } from '@/lib/payload'

export type SignInState = {
  error: string | null
}

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const nextRaw = String(formData.get('next') ?? '')
  const next = isSafeRedirect(nextRaw) ? nextRaw : '/doctrine'

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  let token: string
  let exp: number
  try {
    const p = await payload()
    const result = await p.login({
      collection: 'members',
      data: { email, password },
    })
    if (!result?.token || !result.exp) {
      return { error: 'Sign-in failed. Please try again.' }
    }
    token = result.token
    exp = result.exp
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign-in failed.'
    if (/verified|verify/i.test(msg)) {
      return {
        error:
          'Please verify your email first — check the link we sent when you signed up.',
      }
    }
    if (/locked/i.test(msg)) {
      return {
        error:
          'Too many failed attempts. Try again in a few minutes, or reset your password.',
      }
    }
    return { error: 'Email or password is incorrect.' }
  }

  const store = await cookies()
  store.set('payload-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(exp * 1000),
    path: '/',
  })

  redirect(next)
}

// Only allow same-origin paths starting with "/" — never an absolute URL or
// a "//evil.com" protocol-relative jump.
function isSafeRedirect(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//')
}
