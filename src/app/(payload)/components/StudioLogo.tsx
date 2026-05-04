import { ChiRho } from '@/components/brand/chi-rho'

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
      <span
        aria-hidden
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#1a1410',
          color: '#fbf6ea',
        }}
      >
        <ChiRho size={16} />
      </span>
      <span
        style={{
          fontFamily:
            'Cormorant Garamond, ui-serif, Georgia, serif',
          fontStyle: 'italic',
          fontSize: 22,
          letterSpacing: '-0.01em',
          color: '#1a1410',
        }}
      >
        Tantum Ergo
      </span>
    </div>
  )
}
