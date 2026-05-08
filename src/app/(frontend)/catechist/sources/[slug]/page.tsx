import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export const dynamic = 'force-dynamic'

export default async function SourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (sources.docs.length === 0) notFound()
  const source = sources.docs[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = (payload.db as any).pool
  const chunks = await pool.query(
    `SELECT id, locator, text FROM tantum.source_chunks
       WHERE source_id = $1 ORDER BY chunk_index ASC LIMIT 200`,
    [source.id],
  )

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{source.authorityTier}</p>
      <h1 className="mt-2 text-4xl font-display tracking-tight text-ink">{source.title}</h1>
      <p className="mt-2 font-display italic text-ink-soft">
        {source.author ?? ''}{source.year ? ` · ${source.year}` : ''}
      </p>
      {source.rightsNote && <p className="mt-4 font-mono text-xs text-ink-soft">{source.rightsNote}</p>}

      <div className="mt-12 space-y-6">
        {chunks.rows.map((c: { id: string; locator: string; text: string }) => (
          <article key={c.id} id={`chunk-${c.id}`} className="border-l-2 border-parchment pl-4">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{c.locator}</p>
            <p className="mt-1 font-display text-ink leading-relaxed">{c.text}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
