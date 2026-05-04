// Illuminated initial — the first letter of the hero headline rendered in a
// gilt-to-rubric gradient with a soft drop-shadow glow. Stays inline with the
// rest of the headline (no float, no cartouche box) so the headline reads as
// one composed phrase, not as text wrapping around a tile.
export function IlluminatedDropCap({ children }: { children: string }) {
  return (
    <span
      className="font-display italic"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #d8b370 0%, #b08a3e 45%, #8c2a2a 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 4px 14px rgba(176,138,62,0.35))',
      }}
    >
      {children}
    </span>
  )
}
