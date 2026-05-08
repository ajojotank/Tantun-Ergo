import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (sources.docs.length === 0) return new Response('Not found', { status: 404 })
  const source = sources.docs[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = (payload.db as any).pool
  const chunks = await pool.query(
    `SELECT id, chunk_index, locator, text FROM tantum.source_chunks
       WHERE source_id = $1 ORDER BY chunk_index ASC LIMIT 500`,
    [source.id],
  )

  return Response.json({
    source: {
      id: source.id,
      title: source.title,
      slug: source.slug,
      author: source.author,
      year: source.year,
      authorityTier: source.authorityTier,
      rightsNote: source.rightsNote,
    },
    chunks: chunks.rows,
  })
}
