// src/app/(frontend)/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { draftMode } from 'next/headers'

import { GildedRule } from './components/gilded-rule'
import { IlluminatedDropCap } from './components/illuminated-drop-cap'
import { LivePreviewListener } from './components/live-preview-listener'
import { MagneticCTA } from './components/magnetic-cta'
import { ManifestoSequence } from './components/manifesto-sequence'
import { PillarPlate } from './components/pillar-plate'
import { RevealItem, SectionReveal } from './components/section-reveal'
import { payload } from '@/lib/payload'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type ImageDoc = { url?: string | null; alt?: string | null } | null | undefined

function imageURL(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const v = value as { url?: string | null }
  return v.url ?? null
}

export default async function Home() {
  const { isEnabled: isDraft } = await draftMode()
  const p = await payload()
  const home = await p.findGlobal({ slug: 'home-page', draft: isDraft })

  const limit = home.readingBand?.limit ?? 6
  const articles = await p.find({
    collection: 'articles',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit,
    sort: '-publishedAt',
  })

  const hero = home.hero ?? {}
  const seq = home.manifestoSequence ?? {}
  const pillars = home.pillars ?? {}
  const reading = home.readingBand ?? {}

  const heroImageURL = imageURL(hero.image)
  const headline1 = hero.headlineLine1 ?? ''
  // Pull off the first letter of headline1 for the drop cap; keep the remainder.
  const dropCap = headline1.charAt(0).toUpperCase()
  const dropCapTail = headline1.slice(1)

  return (
    <main className="relative isolate">
      {/* Hero — full-bleed image with text overlay */}
      <section className="relative isolate overflow-hidden">
        {/* Background: image if present, otherwise atmospheric gradient placeholder.
            The image gets a slow Ken-Burns zoom (CSS keyframes) so the hero
            feels like it's breathing rather than holding still. */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 hero-kenburns will-change-transform">
            {heroImageURL ? (
              <Image
                src={heroImageURL}
                alt={(hero.image as ImageDoc)?.alt ?? ''}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    'radial-gradient(80% 60% at 70% 25%, rgba(176,138,62,0.45) 0%, transparent 60%), radial-gradient(70% 50% at 25% 80%, rgba(140,42,42,0.25) 0%, transparent 70%), linear-gradient(180deg, rgba(31,51,88,0.55), rgba(12,10,8,0.95))',
                }}
              />
            )}
          </div>
          {/* Gradient veil — four layers stacked for legibility on every
              part of the cathedral image:
                1. universal mid-darkening so text never fights gilt details
                2. radial anchor in the lower-left where the headline sits
                3. bottom-floor for the subhead + CTAs
                4. top-stripe so the header nav has a base to read against */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'linear-gradient(180deg, rgba(12,10,8,0.30) 0%, rgba(12,10,8,0.15) 40%, rgba(12,10,8,0.45) 100%)',
                'radial-gradient(120% 90% at 0% 100%, rgba(12,10,8,0.85) 0%, rgba(12,10,8,0.45) 38%, rgba(12,10,8,0.0) 70%)',
                'linear-gradient(180deg, rgba(12,10,8,0) 55%, rgba(12,10,8,0.55) 100%)',
                'linear-gradient(180deg, rgba(12,10,8,0.55) 0%, rgba(12,10,8,0) 22%)',
              ].join(', '),
            }}
          />
        </div>

        <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col justify-end px-5 pb-20 pt-32 sm:px-8 sm:pb-28 md:min-h-[92dvh] md:pb-40 md:pt-48">
          <SectionReveal className="max-w-3xl text-vellum">
            {hero.eyebrow ? (
              <RevealItem>
                <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-gilt">
                  {hero.eyebrow}
                </p>
              </RevealItem>
            ) : null}
            <RevealItem>
              <h1
                className="mt-6 font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] tracking-tight text-vellum"
                style={{
                  // Backup contrast: a soft dark glow under the cream type
                  // means even the parts of the headline crossing the bright
                  // gilt cathedral remain legible without re-darkening the
                  // image more than the veil already does.
                  textShadow:
                    '0 2px 18px rgba(12,10,8,0.55), 0 1px 2px rgba(12,10,8,0.65)',
                }}
              >
                {dropCap ? <IlluminatedDropCap>{dropCap}</IlluminatedDropCap> : null}
                {dropCapTail}
                <br />
                <em className="font-light italic text-gilt">{hero.headlineItalic}</em>
                {hero.headlineLine2 ? (
                  <>
                    <br />
                    <span className="font-display">{hero.headlineLine2}</span>
                  </>
                ) : null}
              </h1>
            </RevealItem>
            {hero.subheadline ? (
              <RevealItem>
                <p
                  className="mt-8 max-w-[55ch] text-base leading-relaxed text-vellum/85 sm:text-lg"
                  style={{ textShadow: '0 1px 12px rgba(12,10,8,0.55)' }}
                >
                  {hero.subheadline}
                </p>
              </RevealItem>
            ) : null}
            <RevealItem>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                {hero.ctaPrimaryLabel && hero.ctaPrimaryHref ? (
                  <MagneticCTA href={hero.ctaPrimaryHref}>{hero.ctaPrimaryLabel}</MagneticCTA>
                ) : null}
                {hero.ctaSecondaryLabel && hero.ctaSecondaryHref ? (
                  <MagneticCTA href={hero.ctaSecondaryHref} intent="secondary">
                    {hero.ctaSecondaryLabel}
                  </MagneticCTA>
                ) : null}
              </div>
            </RevealItem>
          </SectionReveal>
        </div>
      </section>

      {/* Manifesto sequence (scroll-scrubbed). Joins the hero with no vellum
          strip in between — the dark cathedral imagery flows directly into
          the dark sacred-art frames as one continuous mood. The last frame
          dissolves to transparent over the back ~18% of its scroll, exposing
          the body's vellum gradually. The chi-rho rule below follows quickly
          so the user is never marooned in a wall of cream. */}
      {seq.enabled && (seq.frames?.length ?? 0) > 0 ? (
        <ManifestoSequence frames={seq.frames as never} />
      ) : null}

      <GildedRule className="pt-6 pb-12" />

      {/* Three pillar plates */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8 md:pb-24 md:pt-12">
        <SectionReveal className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <RevealItem className="md:col-span-12">
            {pillars.eyebrow ? (
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
                {pillars.eyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight text-ink md:text-6xl">
              {pillars.headlineLine1}{' '}
              <em className="italic text-rubric-deep">{pillars.headlineItalic}</em>
            </h2>
          </RevealItem>
          <RevealItem className="md:col-span-12">
            <SectionReveal className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <RevealItem>
              <PillarPlate
                index="I"
                name={pillars.atlas?.title ?? 'Atlas'}
                intent={pillars.atlas?.intent ?? ''}
                href={pillars.atlas?.href ?? '/atlas'}
                tone="rubric"
                imageURL={imageURL(pillars.atlas?.image)}
              />
              </RevealItem>
              <RevealItem>
              <PillarPlate
                index="II"
                name={pillars.doctrine?.title ?? 'Doctrine'}
                intent={pillars.doctrine?.intent ?? ''}
                href={pillars.doctrine?.href ?? '/doctrine'}
                tone="lapis"
                imageURL={imageURL(pillars.doctrine?.image)}
              />
              </RevealItem>
              <RevealItem>
              <PillarPlate
                index="III"
                name={pillars.catechist?.title ?? 'Catechist'}
                intent={pillars.catechist?.intent ?? ''}
                href={pillars.catechist?.href ?? '/catechist'}
                tone="gilt"
                imageURL={imageURL(pillars.catechist?.image)}
              />
              </RevealItem>
            </SectionReveal>
          </RevealItem>
        </SectionReveal>
      </section>

      <GildedRule className="py-16" />

      {/* Editorial primer band */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 md:pb-40">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            {reading.eyebrow ?? 'From the reading room'}
          </p>
          <Link
            href="/reading"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
          >
            All articles →
          </Link>
        </div>
        {articles.docs.length === 0 ? (
          <p className="mt-12 font-display text-2xl italic text-ink-soft">
            {reading.emptyMessage ?? 'Reading room opens soon.'}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {articles.docs.map((a) => (
              <Link
                key={a.id}
                href={`/reading/${a.slug}`}
                className="group block border-t border-ink/10 pt-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Reading'}
                </p>
                <h3 className="mt-2 font-display text-xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-2xl">
                  {a.title}
                </h3>
                {a.excerpt ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                    {a.excerpt}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}
