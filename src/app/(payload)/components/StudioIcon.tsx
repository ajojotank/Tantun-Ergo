import { ChiRho } from '@/components/brand/chi-rho'

export default function StudioIcon() {
  return (
    <span
      aria-hidden
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#1a1410',
        color: '#fbf6ea',
      }}
    >
      <ChiRho size={14} />
    </span>
  )
}
