// src/app/(frontend)/_components/pillar-plate.tsx
'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

const SPRING = { stiffness: 200, damping: 20, mass: 0.6 } as const

export function PillarPlate({
  index,
  name,
  intent,
  href,
  tone,
}: {
  index: 'I' | 'II' | 'III'
  name: string
  intent: string
  href: string
  tone: 'rubric' | 'lapis' | 'gilt'
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, SPRING)
  const y = useSpring(py, SPRING)
  const rotateX = useTransform(py, (v) => (v / 6).toFixed(2))
  const rotateY = useTransform(px, (v) => (-v / 6).toFixed(2))

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(hover: none)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    px.set(Math.max(-12, Math.min(12, dx * 0.1)))
    py.set(Math.max(-12, Math.min(12, dy * 0.1)))
  }
  const onLeave = () => {
    px.set(0)
    py.set(0)
  }

  const palette =
    tone === 'rubric'
      ? 'from-rubric/15 to-vellum-deep/40'
      : tone === 'lapis'
      ? 'from-lapis/15 to-vellum-deep/40'
      : 'from-gilt/20 to-vellum-deep/40'

  return (
    <motion.span
      style={{ x, y, rotateX, rotateY, transformPerspective: 700 }}
      className="block will-change-transform"
    >
      <Link
        ref={ref}
        href={href}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={`group relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-altar)] bg-gradient-to-br ${palette} p-6 ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-altar`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-soft">
          Plate {index}
        </p>
        <h3 className="mt-3 font-display text-3xl italic text-ink md:text-4xl">{name}</h3>
        <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-ink-soft">{intent}</p>
        <span
          aria-hidden
          className="absolute bottom-6 left-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink"
        >
          Enter
          <span className="inline-block h-px w-6 bg-current opacity-50 transition-all duration-300 group-hover:w-12 group-hover:opacity-100" />
        </span>
      </Link>
    </motion.span>
  )
}
