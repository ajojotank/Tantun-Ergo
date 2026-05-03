'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

export function ScrollRubric() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.4,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] bg-rubric/80 mix-blend-multiply"
    />
  )
}
