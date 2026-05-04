// src/app/(frontend)/_components/section-reveal.tsx
'use client'

import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

const SPRING = { type: 'spring', stiffness: 110, damping: 22, mass: 0.5 } as const

const parent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

const child: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: SPRING },
}

export function SectionReveal({
  children,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  as?: 'div' | 'section' | 'header' | 'footer' | 'article'
  className?: string
}) {
  const MotionTag = motion[Tag] as typeof motion.div
  return (
    <MotionTag
      className={className}
      variants={parent}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </MotionTag>
  )
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div className={className} variants={child}>
      {children}
    </motion.div>
  )
}
