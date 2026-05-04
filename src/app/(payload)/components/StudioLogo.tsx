import { ChiRho } from '@/components/brand/chi-rho'

// Login-screen + sidebar wordmark for the Tantum Ergo studio.
//
// Why no roundel: the previous dark-on-dark roundel disappeared into
// Payload's dark-mode sidebar (which is itself near-black). A gilt chi-rho
// without a tile contrasts cleanly on both modes — gilt sits mid-tone
// enough that it's visible on cream (light) and on near-black (dark).
//
// Wordmark color uses --theme-elevation-1000 which Payload maps to:
//   light: black
//   dark:  white
// so the type adapts to the active theme without us touching the
// elevation tokens themselves (those break input contrast — see
// project memory `runtime_gotchas`).
export default function StudioLogo() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '4px 0',
      }}
    >
      <span aria-hidden style={{ color: '#b08a3e' }}>
        <ChiRho size={26} />
      </span>
      <span
        style={{
          fontFamily: 'Cormorant Garamond, ui-serif, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: '-0.01em',
          color: 'var(--theme-elevation-1000)',
        }}
      >
        Tantum Ergo
      </span>
    </div>
  )
}
