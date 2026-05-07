'use client'

import { useActionState, useRef, useState } from 'react'

import { Avatar } from '../components/account/avatar'

import {
  changePasswordAction,
  INITIAL_PASSWORD,
  INITIAL_PROFILE,
  updateProfileAction,
  type PasswordState,
  type ProfileState,
} from './actions'

export function AccountForms({
  displayName: initialDisplayName,
  avatarUrl,
  email,
}: {
  /** Always passed by parent; reserved for future use (e.g. delete account). */
  memberId: string
  displayName: string
  avatarUrl: string | null
  email: string
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState,
    FormData
  >(updateProfileAction, INITIAL_PROFILE)
  const [passwordState, passwordAction, passwordPending] = useActionState<
    PasswordState,
    FormData
  >(changePasswordAction, INITIAL_PASSWORD)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  const previewName = initialDisplayName || email.split('@')[0] || ''

  return (
    <div className="mt-12 space-y-16">
      {/* Profile */}
      <section aria-labelledby="profile-h" className="space-y-6">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Profile
          </p>
          <h2
            id="profile-h"
            className="mt-2 font-display text-2xl italic leading-snug text-ink md:text-3xl"
          >
            How you appear to yourself.
          </h2>
        </header>

        <form action={profileAction} className="space-y-5">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Display name
            </span>
            <input
              name="displayName"
              type="text"
              defaultValue={initialDisplayName}
              autoComplete="name"
              className="rounded-xl border border-ink/20 bg-vellum-deep/40 px-4 py-3 font-display text-lg text-ink outline-none transition-colors focus:border-ink"
            />
          </label>

          <div className="flex items-center gap-5">
            <Avatar imageUrl={previewUrl ?? avatarUrl} name={previewName} size={64} />
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Avatar
              </span>
              <input
                ref={fileRef}
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={onFileChange}
                className="font-mono text-[11px] text-ink-soft file:mr-4 file:rounded-full file:border file:border-ink/15 file:bg-vellum file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.22em] file:text-ink hover:file:border-ink/30"
              />
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Email (read-only)
            </span>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="cursor-not-allowed rounded-xl border border-ink/10 bg-vellum-deep/20 px-4 py-3 font-display text-lg text-ink-soft"
            />
          </label>

          {profileState.error ? (
            <p className="font-display text-sm italic text-rubric-deep">
              {profileState.error}
            </p>
          ) : null}
          {profileState.status === 'saved' ? (
            <p className="font-display text-sm italic text-incense">Profile saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {profilePending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* Security */}
      <section aria-labelledby="security-h" className="space-y-6 border-t border-ink/10 pt-12">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            Security
          </p>
          <h2
            id="security-h"
            className="mt-2 font-display text-2xl italic leading-snug text-ink md:text-3xl"
          >
            Change your password.
          </h2>
        </header>

        <form action={passwordAction} className="space-y-5">
          <Field
            name="currentPassword"
            type="password"
            label="Current password"
            autoComplete="current-password"
            required
          />
          <Field
            name="newPassword"
            type="password"
            label="New password (8+ chars)"
            autoComplete="new-password"
            required
          />
          <Field
            name="confirm"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            required
          />

          {passwordState.error ? (
            <p className="font-display text-sm italic text-rubric-deep">
              {passwordState.error}
            </p>
          ) : null}
          {passwordState.status === 'saved' ? (
            <p className="font-display text-sm italic text-incense">
              {"Password changed. You're still signed in on this device."}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-full bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-vellum transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {passwordPending ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
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
