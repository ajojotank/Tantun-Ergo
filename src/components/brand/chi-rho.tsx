// Reusable chi-rho monogram. Renders crisp at any size.
// `size` prop controls pixel dimensions; defaults to inheriting font-size via 1em.
import type { SVGProps } from 'react'

export function ChiRho({
  size = '1em',
  ...rest
}: SVGProps<SVGSVGElement> & { size?: string | number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Chi (X) */}
      <line x1="14" y1="14" x2="50" y2="50" />
      <line x1="50" y1="14" x2="14" y2="50" />
      {/* Rho (P): vertical stem + bowl on the upper right */}
      <line x1="32" y1="14" x2="32" y2="58" />
      <path d="M 32 14 Q 50 14 50 26 Q 50 38 32 38" fill="none" />
    </svg>
  )
}
