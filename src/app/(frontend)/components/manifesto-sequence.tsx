// src/app/(frontend)/_components/manifesto-sequence.tsx
'use client'

import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import Image from 'next/image'
import { useRef } from 'react'

type Frame = {
  eyebrow?: string | null
  caption?: unknown // Lexical rich text — we render as plain extract
  image?: { url?: string | null; alt?: string | null; width?: number | null; height?: number | null } | null
}

function richTextToString(value: unknown): string {
  try {
    const root = (value as { root?: { children?: unknown[] } } | null)?.root
    if (!root?.children) return ''
    const out: string[] = []
    const walk = (node: unknown) => {
      const n = node as { type?: string; text?: string; children?: unknown[] }
      if (typeof n.text === 'string') out.push(n.text)
      n.children?.forEach(walk)
    }
    root.children.forEach(walk)
    return out.join(' ').trim()
  } catch {
    return ''
  }
}

function FrameLayer({
  frame,
  i,
  activeIndex,
}: {
  frame: Frame
  i: number
  activeIndex: MotionValue<number>
}) {
  const opacity = useTransform(activeIndex, (idx) => (idx === i ? 1 : 0))
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <div className="relative h-full w-full">
        {frame.image?.url ? (
          <Image
            src={frame.image.url}
            alt={frame.image.alt ?? ''}
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(80% 60% at 50% 35%, rgba(176,138,62,0.3), transparent 70%), linear-gradient(180deg, rgba(31,51,88,0.4), rgba(12,10,8,0.85))',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-start gap-3 px-6 pb-16 text-vellum">
          {frame.eyebrow ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              {frame.eyebrow}
            </p>
          ) : null}
          <p className="font-display text-3xl italic leading-tight md:text-5xl">
            {richTextToString(frame.caption)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function IndicatorDot({ i, activeIndex }: { i: number; activeIndex: MotionValue<number> }) {
  const opacity = useTransform(activeIndex, (idx) => (idx === i ? 1 : 0.4))
  const scale = useTransform(activeIndex, (idx) => (idx === i ? 1.4 : 1))
  return (
    <motion.span
      className="h-2 w-2 rounded-full bg-vellum/30"
      style={{ opacity, scale }}
    />
  )
}

export function ManifestoSequence({ frames }: { frames: Frame[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const count = Math.max(frames.length, 1)
  const activeIndex = useTransform(scrollYProgress, (v) =>
    Math.min(count - 1, Math.floor(v * count)),
  )

  if (frames.length === 0) return null

  return (
    <section
      ref={ref}
      aria-label="Manifesto sequence"
      className="relative"
      style={{ position: 'relative', height: `${count * 100}vh` }}
    >
      <div className="sticky top-0 flex h-[100dvh] items-stretch overflow-hidden">
        {frames.map((frame, i) => (
          <FrameLayer key={i} frame={frame} i={i} activeIndex={activeIndex} />
        ))}

        {/* Frame indicator dots */}
        <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-8">
          {frames.map((_, i) => (
            <IndicatorDot key={i} i={i} activeIndex={activeIndex} />
          ))}
        </div>
      </div>

      {/* Exit fade — sits at the absolute bottom of the (count*100vh) outer
          section. Only enters viewport during the final viewport-worth of
          scroll, gracefully blending the last frame out to vellum so the
          editorial pillar section that follows doesn't read as a hard cut. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh]"
        style={{
          background:
            'linear-gradient(180deg, rgba(12,10,8,0) 0%, rgba(12,10,8,0.6) 55%, var(--color-vellum) 100%)',
        }}
      />
    </section>
  )
}
