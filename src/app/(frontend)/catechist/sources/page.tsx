import Link from 'next/link'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export const metadata = { title: 'Sources — Catechist' }

const TIER_LABEL: Record<string, string> = {
  scripture: 'Scripture',
  council: 'Council',
  catechism: 'Catechism',
  encyclical: 'Encyclical',
  father: 'Father',
  theologian: 'Theologian',
  other: 'Other',
}

export default async function SourcesPage() {
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { ingestStatus: { equals: 'ingested' } },
    limit: 200,
    depth: 0,
  })

  const grouped = new Map<string, typeof sources.docs>()
  for (const s of sources.docs) {
    const key = s.authorityTier as string
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(s)
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Catechist · Corpus</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">What the Catechist has read</h1>

      <div className="mt-12 space-y-12">
        {(['scripture', 'council', 'catechism', 'encyclical', 'father', 'theologian', 'other'] as const).map((tier) =>
          (grouped.get(tier) ?? []).length > 0 ? (
            <section key={tier}>
              <h2 className="font-display italic text-2xl text-ink mb-4">{TIER_LABEL[tier]}</h2>
              <ul className="divide-y divide-ink/10">
                {grouped.get(tier)!.map((s) => (
                  <li key={s.id} className="py-4">
                    <Link
                      href={`/catechist/sources/${s.slug}`}
                      className="block hover:bg-parchment/30 -mx-3 px-3 py-1 rounded transition-colors"
                    >
                      <h3 className="font-display text-lg text-ink">{s.title}</h3>
                      <p className="font-mono text-xs text-ink-soft mt-1">
                        {s.author ?? '—'}{s.year ? ` · ${s.year}` : ''} · {s.chunkCount ?? 0} passages
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </main>
  )
}
