// src/app/(frontend)/page.tsx
import Link from 'next/link'

import { MagneticCTA } from './components/magnetic-cta'
import { ManifestoSequence } from './components/manifesto-sequence'
import { PillarPlate } from './components/pillar-plate'
import { RevealItem, SectionReveal } from './components/section-reveal'
import { payload } from '@/lib/payload'

export default async function Home() {
  const p = await payload()
  const [sequence, articles] = await Promise.all([
    p.findGlobal({ slug: 'manifesto-sequence' }),
    p.find({
      collection: 'pages',
      where: {
        and: [
          { pageType: { equals: 'reading-article' } },
          { _status: { equals: 'published' } },
        ],
      },
      limit: 6,
      sort: '-publishedAt',
    }),
  ])

  return (
    <main className="relative isolate">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 pt-16 pb-24 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-28 md:pb-40">
        <SectionReveal className="md:col-span-7 md:pr-8">
          <RevealItem>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              In Hoc Signo · MMXXVI
            </p>
          </RevealItem>
          <RevealItem>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,7.5vw,5.6rem)] leading-[0.92] tracking-tight text-ink">
              A digital
              <br />
              <em className="font-light italic text-rubric-deep">Sistine Chapel</em> for
              <br />
              Catholic formation.
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink-soft sm:text-lg">
              Tantum Ergo holds three instruments inside one reverent surface — a cartographic{' '}
              <span className="font-display italic text-ink">Miracle Atlas</span>, a long-form{' '}
              <span className="font-display italic text-ink">Doctrine LMS</span>, and an AI{' '}
              <span className="font-display italic text-ink">Catechist</span> bound to citation.
              Mobile-first. Scroll-scrubbed. Built to last centuries.
            </p>
          </RevealItem>
          <RevealItem>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticCTA href="/atlas">Begin pilgrimage</MagneticCTA>
              <MagneticCTA href="/manifesto" intent="secondary">
                Read the manifesto
              </MagneticCTA>
            </div>
          </RevealItem>
        </SectionReveal>

        <aside aria-hidden className="relative md:col-span-5">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-altar)] bg-vellum-deep"
            style={{ boxShadow: 'var(--shadow-altar)' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(80% 60% at 50% 18%, rgba(176,138,62,0.28) 0%, transparent 60%), linear-gradient(180deg, rgba(31,51,88,0.10), rgba(140,42,42,0.10))',
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: `${20 + i * 12}%`,
                    aspectRatio: '1',
                    border: '1px solid rgba(26,20,16,0.06)',
                  }}
                />
              ))}
              <div
                className="h-3 w-3 rounded-full bg-rubric"
                style={{ boxShadow: '0 0 0 6px rgba(140,42,42,0.18)' }}
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Plate 01 · Oculus
              </p>
              <p className="font-display text-sm italic text-ink-soft">
                Lumen ad revelationem
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* Manifesto sequence (scroll-scrubbed) */}
      {sequence.enabled && (sequence.frames?.length ?? 0) > 0 ? (
        <ManifestoSequence frames={sequence.frames as never} />
      ) : null}

      {/* Three pillar plates */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 md:py-32">
        <SectionReveal className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-8">
          <RevealItem className="md:col-span-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              Three pillars
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] tracking-tight text-ink md:text-6xl">
              Cartography. Formation. <em className="italic text-rubric-deep">Dialogue.</em>
            </h2>
          </RevealItem>
          <RevealItem className="md:col-span-12">
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-[2fr_1fr_1fr]">
              <PillarPlate
                index="I"
                name="Atlas"
                intent="A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record."
                href="/atlas"
                tone="rubric"
              />
              <PillarPlate
                index="II"
                name="Doctrine"
                intent="A breviary-paced LMS over councils, encyclicals, the Catechism."
                href="/doctrine"
                tone="lapis"
              />
              <PillarPlate
                index="III"
                name="Catechist"
                intent="An interlocutor bound to citation. Cites; never invents."
                href="/catechist"
                tone="gilt"
              />
            </div>
          </RevealItem>
        </SectionReveal>
      </section>

      {/* Editorial primer band */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 md:pb-40">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
            From the reading room
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
            Reading room opens soon.
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
    </main>
  )
}
