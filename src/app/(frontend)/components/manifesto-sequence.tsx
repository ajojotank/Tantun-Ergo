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
  count,
  scrollYProgress,
}: {
  frame: Frame
  i: number
  count: number
  scrollYProgress: MotionValue<number>
}) {
  // Frame opacity: was a hard binary (1 when active, 0 otherwise) which
  // produced an instant flip at boundaries AND required an overlay band to
  // slide up through the last frame at section exit. Now each frame
  // cross-fades with its neighbours at slot boundaries, and the final frame
  // dissolves its image to transparent at section end so the body's vellum
  // shows through naturally — no rising horizontal seam.
  const opacity = useTransform(scrollYProgress, (v) => {
    const slot = 1 / count
    const start = i * slot
    const end = start + slot
    const fade = slot * 0.2 // 20% of a slot for cross-fade lead-in/out
    const isLast = i === count - 1
    const exitStart = 0.93 // last frame starts dissolving here

    // Lead-in: first frame is already at 1 at v=0; later frames cross-fade
    // in with the preceding frame's fade-out.
    if (i > 0) {
      if (v < start - fade) return 0
      if (v < start) return (v - (start - fade)) / fade
    }

    // Trailing fade-out
    if (isLast) {
      // Hold until 93% of the entire section, then dissolve to vellum.
      if (v < exitStart) return 1
      if (v >= 1) return 0
      return 1 - (v - exitStart) / (1 - exitStart)
    }
    if (v < end - fade) return 1
    if (v < end) return 1 - (v - (end - fade)) / fade
    return 0
  })

  // Ken-Burns scale tied to local progress within this frame's slot.
  const imageScale = useTransform(scrollYProgress, (v) => {
    const local = Math.max(0, Math.min(1, v * count - i))
    return 1 + local * 0.06
  })
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <div className="relative h-full w-full overflow-hidden">
        {frame.image?.url ? (
          <motion.div
            style={{ scale: imageScale }}
            className="absolute inset-0 will-change-transform"
          >
            <Image
              src={frame.image.url}
              alt={frame.image.alt ?? ''}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
            />
          </motion.div>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(80% 60% at 50% 35%, rgba(176,138,62,0.3), transparent 70%), linear-gradient(180deg, rgba(31,51,88,0.4), rgba(12,10,8,0.85))',
            }}
          />
        )}
        {/* Stronger lower vignette so the caption and eyebrow are always
            anchored against a darker base, regardless of the underlying art. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-start gap-4 px-6 pb-20 text-vellum md:px-8">
          {frame.eyebrow ? (
            <p
              className="font-mono text-xs uppercase tracking-[0.32em] text-gilt sm:text-[13px]"
              style={{ textShadow: '0 1px 8px rgba(12,10,8,0.85)' }}
            >
              {frame.eyebrow}
            </p>
          ) : null}
          <p
            className="font-display text-3xl italic leading-tight md:text-5xl"
            style={{ textShadow: '0 2px 16px rgba(12,10,8,0.65)' }}
          >
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
          <FrameLayer
            key={i}
            frame={frame}
            i={i}
            count={count}
            scrollYProgress={scrollYProgress}
          />
        ))}

        {/* Frame indicator dots */}
        <div className="absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 md:right-8">
          {frames.map((_, i) => (
            <IndicatorDot key={i} i={i} activeIndex={activeIndex} />
          ))}
        </div>
      </div>
    </section>
  )
}
