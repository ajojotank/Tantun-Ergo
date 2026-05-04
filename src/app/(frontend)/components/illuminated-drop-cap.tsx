// Illuminated drop cap — the first letter of a headline in gilt, set inside
// a small ornamental cartouche. Renders inline with the rest of the headline.
export function IlluminatedDropCap({ children }: { children: string }) {
  return (
    <span className="relative float-left mr-3 mt-1 inline-block">
      <span
        aria-hidden
        className="grid place-items-center rounded-md font-display text-[1.4em] italic leading-none"
        style={{
          width: '1.1em',
          height: '1.1em',
          color: '#fbf6ea',
          background:
            'linear-gradient(135deg, #b08a3e 0%, #9c7530 50%, #8c2a2a 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(140,42,42,0.25)',
        }}
      >
        {children}
      </span>
    </span>
  )
}
