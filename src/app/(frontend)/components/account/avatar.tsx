// src/app/(frontend)/components/account/avatar.tsx
import Image from 'next/image'

export function Avatar({
  imageUrl,
  name,
  size = 32,
  className = '',
}: {
  imageUrl: string | null
  name: string
  size?: number
  className?: string
}) {
  // Two-letter initials. Splits on whitespace; uses the first letter of the
  // first word and (if present) the first letter of the last word. Falls
  // back to the first letter of the email-local part for single-token names.
  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const initials =
    parts.length === 0
      ? '·'
      : parts.length === 1
        ? parts[0]!.slice(0, 2).toUpperCase()
        : (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()

  const dim = `${size}px`
  return (
    <span
      aria-hidden
      style={{ width: dim, height: dim }}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/15 bg-vellum-deep ${className}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={dim}
          className="object-cover"
          unoptimized={imageUrl.startsWith('/api/')}
        />
      ) : (
        <span
          className="font-mono uppercase text-ink-soft"
          style={{ fontSize: Math.round(size * 0.36), letterSpacing: '0.04em' }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}
