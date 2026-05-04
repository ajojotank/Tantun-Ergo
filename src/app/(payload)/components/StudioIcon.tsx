import { ChiRho } from '@/components/brand/chi-rho'

// Browser tab + admin nav icon. Same gilt mark as StudioLogo, no tile.
// Visible on both light and dark theme sidebars.
export default function StudioIcon() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        color: '#b08a3e',
      }}
    >
      <ChiRho size={22} />
    </span>
  )
}
