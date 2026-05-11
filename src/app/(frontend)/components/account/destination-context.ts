// Maps a `?next=` redirect target to context-aware copy on the auth pages,
// so a user clicking "Catechist" while signed-out sees a sign-in screen
// that says "Begin with the Catechist" — not generic LMS-flavored language
// about reading position.

export interface DestinationContext {
  eyebrow: string
  title: string
  intro: string
}

const FALLBACK_SIGNIN: DestinationContext = {
  eyebrow: 'Account · Sign in',
  title: 'Welcome back.',
  intro:
    'Sign in to resume your reading and keep your progress in step across your devices.',
}

const FALLBACK_SIGNUP: DestinationContext = {
  eyebrow: 'Account · Create',
  title: 'Begin formation.',
  intro:
    "Make an account so your reading position carries across your devices. We'll only ask for your email and a password.",
}

export function destinationContext(
  next: string | null | undefined,
  mode: 'signin' | 'signup',
): DestinationContext {
  const dest = (next ?? '').toLowerCase()

  if (dest.startsWith('/catechist')) {
    return mode === 'signin'
      ? {
          eyebrow: 'Catechist · Sign in',
          title: 'Continue with the Catechist.',
          intro:
            'Sign in to converse with the Catechist — an interlocutor bound to citation. It quotes the Magisterium; it never invents.',
        }
      : {
          eyebrow: 'Catechist · Create account',
          title: 'Begin with the Catechist.',
          intro:
            'Create an account to converse with the Catechist. Your inquiries are yours alone, kept in step across every device you sign in on.',
        }
  }

  if (dest.startsWith('/doctrine')) {
    return mode === 'signin'
      ? {
          eyebrow: 'Doctrine · Sign in',
          title: 'Resume your reading.',
          intro:
            'Sign in to keep your place in the Doctrine library, across every device you sign in on.',
        }
      : {
          eyebrow: 'Doctrine · Create account',
          title: 'Begin your reading.',
          intro:
            'Create an account so your reading position carries across your devices.',
        }
  }

  if (dest.startsWith('/atlas')) {
    return mode === 'signin'
      ? {
          eyebrow: 'Atlas · Sign in',
          title: 'Resume your pilgrimage.',
          intro:
            'Sign in to mark stations on the Atlas and keep your pilgrimage in step across your devices.',
        }
      : {
          eyebrow: 'Atlas · Create account',
          title: 'Begin your pilgrimage.',
          intro:
            'Create an account so the stations you mark travel with you across devices.',
        }
  }

  return mode === 'signin' ? FALLBACK_SIGNIN : FALLBACK_SIGNUP
}
