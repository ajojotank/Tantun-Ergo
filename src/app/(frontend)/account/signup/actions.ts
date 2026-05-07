'use server'

import { payload } from '@/lib/payload'

export type SignUpState = {
  error: string | null
  success: boolean
}

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  const displayName = String(formData.get('displayName') ?? '').trim()

  if (!email || !password) {
    return { error: 'Email and password are required.', success: false }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false }
  }
  if (password !== confirm) {
    return { error: 'Passwords do not match.', success: false }
  }

  try {
    const p = await payload()
    await p.create({
      collection: 'members',
      data: {
        email,
        password,
        displayName: displayName || undefined,
        roles: ['learner'],
      },
    })
    return { error: null, success: true }
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message: string }).message)
        : 'Sign-up failed.'
    if (/duplicate|unique|already/i.test(msg)) {
      return {
        error: 'An account with that email already exists. Try signing in.',
        success: false,
      }
    }
    return { error: msg, success: false }
  }
}
