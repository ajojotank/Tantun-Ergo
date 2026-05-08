import { getPayload } from 'payload'
import config from '../payload.config'
import { CONCEPT_SEEDS } from '../catechist/seed/concepts'

async function main() {
  const payload = await getPayload({ config })
  payload.logger.info(`Seeding ${CONCEPT_SEEDS.length} concepts...`)

  const slugToId = new Map<string, number>()

  for (const seed of CONCEPT_SEEDS) {
    const existing = await payload.find({
      collection: 'concepts',
      where: { slug: { equals: seed.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      slugToId.set(seed.slug, existing.docs[0].id as number)
      continue
    }
    const created = await payload.create({
      collection: 'concepts',
      data: {
        name: seed.name,
        slug: seed.slug,
        definition: seed.definition,
        category: seed.category,
        synonyms: (seed.synonyms ?? []).map((p) => ({ phrase: p })),
      },
    })
    slugToId.set(seed.slug, created.id as number)
    payload.logger.info(`  + ${seed.name}`)
  }

  for (const seed of CONCEPT_SEEDS) {
    if (!seed.parentSlug) continue
    const id = slugToId.get(seed.slug)
    const parentId = slugToId.get(seed.parentSlug)
    if (!id || !parentId) continue
    await payload.update({
      collection: 'concepts',
      id,
      data: { parent: parentId },
    })
  }

  payload.logger.info('DONE')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
