import 'server-only'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const sources = await payload.find({
    collection: 'sources',
    where: { ingestStatus: { equals: 'ingested' } },
    limit: 100,
    sort: 'authorityTier',
    depth: 0,
  })
  return Response.json({
    sources: sources.docs.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      author: s.author,
      year: s.year,
      authorityTier: s.authorityTier,
      chunkCount: s.chunkCount,
      rightsNote: s.rightsNote,
    })),
  })
}
