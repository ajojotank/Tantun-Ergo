'use server'

import { payload } from '@/lib/payload'

export type ForgotPasswordState = {
  status: 'idle' | 'sent' | 'error'
  error: string | null
}

export const INITIAL: ForgotPasswordState = { status: 'idle', error: null }

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) {
    return { status: 'error', error: 'Email is required.' }
  }

  try {
    const p = await payload()
    // Payload's forgotPassword is intentionally silent on whether the email
    // exists — never reveal account existence. The success state is the
    // same regardless.
    await p.forgotPassword({
      collection: 'members',
      data: { email },
      disableEmail: false,
    })
  } catch {
    // Even on failure we show the same "sent" message to avoid leaking
    // account existence. The token, if generated, is in the email; if not,
    // nothing was sent. Either way the user's path forward is the same.
  }

  return { status: 'sent', error: null }
}
