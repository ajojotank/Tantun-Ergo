import Link from 'next/link'

import { MagneticCTA } from './components/magnetic-cta'
import { ScrollRubric } from './components/scroll-rubric'

const PILLARS = [
  {
    index: 'I',
    name: 'Miracle Atlas',
    intent:
      'A scroll-scrubbed cartography of the approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and source documents.',
    plinth: 'Cartography',
  },
  {
    index: 'II',
    name: 'Doctrine LMS',
    intent:
      'Catechesis as a long-form syllabus — councils, encyclicals, the Catechism — paced through video, audio, and reading paths with mastery checks.',
    plinth: 'Formation',
  },
  {
    index: 'III',
    name: 'AI Catechist',
    intent:
      'A retrieval-grounded interlocutor trained on the magisterium. It cites; it never invents. Conversation as spiritual direction with footnotes.',
    plinth: 'Dialogue',
  },
] as const

export default function Home() {
  return (
    <>
      <ScrollRubric />

      <main className="relative isolate">
        {/* Top frame */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8 md:pt-10">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-vellum text-[10px] font-mono tracking-[0.2em]"
              style={{ boxShadow: 'var(--shadow-relief)' }}
            >
              TE
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg italic text-ink">Tantum Ergo</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                Studio · ZA
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="hidden items-center gap-2 rounded-full border border-ink/15 bg-vellum-deep/60 px-4 py-2 text-xs font-medium tracking-tight text-ink-soft transition-colors hover:border-ink/30 hover:text-ink sm:inline-flex"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-incense"
              style={{ boxShadow: '0 0 0 3px rgba(111,122,58,0.18)' }}
            />
            Studio
          </Link>
        </header>

        {/* Hero — asymmetric: 7/12 type, 5/12 plinth on md+ */}
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 pt-16 pb-24 sm:px-8 md:grid-cols-12 md:gap-8 md:pt-28 md:pb-40">
          <div className="md:col-span-7 md:pr-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
              In Hoc Signo · MMXXVI
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,7.5vw,5.6rem)] leading-[0.92] tracking-tight text-ink">
              A digital
              <br />
              <em className="font-light italic text-rubric-deep">Sistine Chapel</em>{' '}
              for
              <br />
              Catholic formation.
            </h1>

            <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink-soft sm:text-lg">
              Tantum Ergo holds three instruments inside one reverent surface — a
              cartographic{' '}
              <span className="font-display italic text-ink">Miracle Atlas</span>, a
              long-form{' '}
              <span className="font-display italic text-ink">Doctrine LMS</span>, and
              an AI{' '}
              <span className="font-display italic text-ink">Catechist</span> bound to
              citation. Mobile-first. Scroll-scrubbed. Built to last centuries.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticCTA href="/admin">Enter the studio</MagneticCTA>
              <MagneticCTA href="#pillars" intent="secondary">
                See the three pillars
              </MagneticCTA>
            </div>

            <dl className="mt-14 grid max-w-md grid-cols-3 gap-px bg-ink/10">
              {[
                ['Miracles indexed', '— —'],
                ['Doctrine modules', '— —'],
                ['Citations grounded', '— —'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="bg-vellum px-4 py-3"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {k}
                  </dt>
                  <dd className="mt-1 font-display text-2xl text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right plinth */}
          <aside
            aria-hidden
            className="relative md:col-span-5"
          >
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
              {/* Concentric oculus */}
              <div className="absolute inset-0 grid place-items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-ink/8"
                    style={{
                      width: `${20 + i * 12}%`,
                      aspectRatio: '1',
                      borderColor: 'rgba(26,20,16,0.06)',
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

        {/* Divider */}
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="h-px w-full bg-ink/10" />
        </div>

        {/* Three pillars — anti-3-column: split 5/7 with index numerals */}
        <section
          id="pillars"
          className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 md:py-32"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
                Three pillars
              </p>
              <h2 className="mt-4 font-display text-4xl leading-[0.98] tracking-tight text-ink md:text-5xl">
                Cartography. Formation.{' '}
                <em className="italic text-rubric-deep">Dialogue.</em>
              </h2>
              <p className="mt-6 max-w-[40ch] text-ink-soft">
                Each pillar is a separate render target — different motion grammars,
                shared theological spine. Built so the work outlives the hosting.
              </p>
            </div>

            <ol className="md:col-span-7 md:divide-y md:divide-ink/10">
              {PILLARS.map((p) => (
                <li
                  key={p.index}
                  className="grid grid-cols-[auto_1fr] items-start gap-6 py-6 first:pt-0 md:py-8"
                >
                  <span
                    className="font-display text-3xl italic text-rubric md:text-4xl"
                    aria-hidden
                  >
                    {p.index}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3 className="font-display text-2xl tracking-tight text-ink md:text-3xl">
                        {p.name}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                        / {p.plinth}
                      </span>
                    </div>
                    <p className="mt-3 max-w-[58ch] leading-relaxed text-ink-soft">
                      {p.intent}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Footing */}
        <footer className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
              Tantum Ergo · Boilerplate v0.1 · Next 16 + Payload 3.84
            </p>
            <p className="font-display text-sm italic text-ink-soft">
              Genitori, Genitoque · laus et jubilatio.
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
