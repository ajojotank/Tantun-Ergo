// Brand chi-rho monogram — sources from `/public/chi-rho.svg` so the visual
// art is a single file the design team controls. Rendered via CSS mask so
// the glyph adopts `currentColor`, keeping all callers themable through text
// color (e.g. `text-gilt`, `text-vellum`).
import type { CSSProperties, HTMLAttributes } from 'react'

type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  size?: string | number
}

export function ChiRho({ size = '1em', style, ...rest }: Props) {
  const dim = typeof size === 'number' ? `${size}px` : size
  const maskStyle: CSSProperties = {
    display: 'inline-block',
    width: dim,
    height: dim,
    backgroundColor: 'currentColor',
    maskImage: 'url(/chi-rho.svg)',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskImage: 'url(/chi-rho.svg)',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: 'contain',
    ...style,
  }
  return <span aria-hidden style={maskStyle} {...rest} />
}
