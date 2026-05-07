'use server'

import { revalidatePath } from 'next/cache'

import { getMember } from '@/lib/auth'
import { payload } from '@/lib/payload'

export type ProfileState = {
  status: 'idle' | 'saved' | 'error'
  error: string | null
}
export type PasswordState = {
  status: 'idle' | 'saved' | 'error'
  error: string | null
}

export const INITIAL_PROFILE: ProfileState = { status: 'idle', error: null }
export const INITIAL_PASSWORD: PasswordState = { status: 'idle', error: null }

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const member = await getMember()
  if (!member) {
    return { status: 'error', error: 'You must be signed in to update your profile.' }
  }

  const displayNameRaw = formData.get('displayName')
  const displayName =
    typeof displayNameRaw === 'string' ? displayNameRaw.trim() : ''

  // Avatar upload: optional. The form only includes a non-empty file when
  // the user picked one. An empty File still arrives with size 0 — skip it.
  const file = formData.get('avatar')
  let avatarMediaId: number | null = null
  if (file && typeof file === 'object' && 'arrayBuffer' in file) {
    const f = file as File
    if (f.size > 0) {
      if (f.size > MAX_AVATAR_BYTES) {
        return {
          status: 'error',
          error: 'Avatar must be 5 MB or smaller.',
        }
      }
      if (!ALLOWED_AVATAR_TYPES.has(f.type)) {
        return {
          status: 'error',
          error: 'Avatar must be a JPEG, PNG, WebP, or AVIF image.',
        }
      }
      try {
        const p = await payload()
        const buffer = Buffer.from(await f.arrayBuffer())
        const created = await p.create({
          collection: 'media',
          data: { alt: `${displayName || member.email} avatar` },
          file: {
            data: buffer,
            mimetype: f.type,
            name: f.name || `avatar-${member.id}.bin`,
            size: f.size,
          },
          overrideAccess: true,
        })
        avatarMediaId = (created.id as number) ?? null
      } catch {
        return {
          status: 'error',
          error: "We couldn't process that image. Try a different file.",
        }
      }
    }
  }

  try {
    const p = await payload()
    await p.update({
      collection: 'members',
      id: member.id,
      data: {
        displayName: displayName || null,
        ...(avatarMediaId !== null ? { avatar: avatarMediaId } : {}),
      },
      overrideAccess: true,
    })
  } catch {
    return { status: 'error', error: 'Could not save your profile. Try again.' }
  }

  // Header reads from the same member document — re-render every page so
  // the avatar updates everywhere.
  revalidatePath('/', 'layout')
  return { status: 'saved', error: null }
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const member = await getMember()
  if (!member) {
    return { status: 'error', error: 'You must be signed in to change your password.' }
  }

  const current = String(formData.get('currentPassword') ?? '')
  const next = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!current || !next) {
    return { status: 'error', error: 'Both fields are required.' }
  }
  if (next.length < 8) {
    return { status: 'error', error: 'New password must be at least 8 characters.' }
  }
  if (next !== confirm) {
    return { status: 'error', error: 'New passwords do not match.' }
  }
  if (next === current) {
    return { status: 'error', error: 'New password must differ from the current one.' }
  }

  // Verify current password by attempting to log in with it. login() throws
  // on bad credentials. We discard the returned token — the existing cookie
  // is still valid. Email is read from the live member doc (never trusted
  // from the form).
  try {
    const p = await payload()
    await p.login({
      collection: 'members',
      data: { email: member.email, password: current },
    })
  } catch {
    return { status: 'error', error: 'Current password is incorrect.' }
  }

  try {
    const p = await payload()
    await p.update({
      collection: 'members',
      id: member.id,
      data: { password: next },
      overrideAccess: true,
    })
  } catch {
    return { status: 'error', error: 'Could not change your password. Try again.' }
  }

  return { status: 'saved', error: null }
}
