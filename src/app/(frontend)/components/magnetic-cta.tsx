'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useRef } from 'react'

const SPRING = { stiffness: 220, damping: 18, mass: 0.5 }

type Props = {
  href: string
  children: ReactNode
  intent?: 'primary' | 'secondary'
}

export function MagneticCTA({ href, children, intent = 'primary' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, SPRING)
  const y = useSpring(py, SPRING)
  const rotateX = useTransform(py, (v) => (v / 4).toFixed(2))
  const rotateY = useTransform(px, (v) => (-v / 4).toFixed(2))

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(hover: none)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const cap = 14
    px.set(Math.max(-cap, Math.min(cap, dx * 0.18)))
    py.set(Math.max(-cap, Math.min(cap, dy * 0.18)))
  }

  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  const palette =
    intent === 'primary'
      ? 'bg-ink text-vellum hover:bg-rubric-deep'
      : 'bg-vellum-deep/80 text-ink ring-1 ring-ink/10 hover:bg-vellum-deep'

  return (
    <motion.span
      style={{ x, y, rotateX, rotateY, transformPerspective: 600 }}
      className="inline-block will-change-transform"
    >
      <Link
        ref={ref}
        href={href}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium tracking-tight transition-colors duration-300 active:translate-y-[1px] ${palette}`}
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 40px -22px rgba(26,20,16,0.4)',
        }}
      >
        <span>{children}</span>
        <span
          aria-hidden
          className="inline-block h-px w-6 bg-current opacity-50 transition-all duration-300 group-hover:w-10 group-hover:opacity-100"
        />
      </Link>
    </motion.span>
  )
}
