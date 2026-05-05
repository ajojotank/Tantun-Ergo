// src/scripts/seed-pilgrimages.ts
//
// Idempotent seed for the Pilgrimages collection. Run AFTER `seed:atlas` —
// this script looks up miracles by slug to populate the route relationships.
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

type PilgrimageSeed = {
  slug: string
  title: string
  subtitle: string
  intro: string
  miracleSlugs: string[] // ordered
  chapterNotes?: Record<string, string> // miracleSlug → optional override
}

const SEEDS: PilgrimageSeed[] = [
  {
    slug: 'eucharistic-italy',
    title: 'Eucharistic Italy [Sample]',
    subtitle: 'Three altars where the bread became flesh.',
    intro:
      'From Sample-Lanciano in 700 to Placeholder-Bolsena in 1263 to Sample-Cupertino in 1671 — three Italian moments where the Eucharist\'s hidden mystery is said to have stepped briefly into sight.',
    miracleSlugs: [
      'eucharistic-miracle-of-sample-lanciano',
      'bleeding-host-of-placeholder-bolsena',
      'levitation-of-brother-sample',
    ],
  },
  {
    slug: 'marian-witnesses',
    title: 'Marian Witnesses [Sample]',
    subtitle: 'Two apparitions, two springs, two centuries.',
    intro:
      'From Lorem-Tepeyac in 1531 to Sample-Town in 1858 — two Marian visitations, both bound to a peasant child, both leaving an enduring sign.',
    miracleSlugs: [
      'our-lady-of-lorem',
      'apparition-at-sample-town',
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const seed of SEEDS) {
    await ensurePilgrimage(payload, seed)
  }

  payload.logger.info(`Pilgrimages seed complete (${SEEDS.length} pilgrimages).`)
  process.exit(0)
}

async function ensurePilgrimage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: PilgrimageSeed,
) {
  // Resolve every miracle slug to its id. Bail loudly if any are missing —
  // that means seed:atlas didn't run, or a slug typo.
  const route: Array<{ miracle: number; chapterNote?: string }> = []
  for (const slug of seed.miracleSlugs) {
    const found = await payload.find({
      collection: 'miracles',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      throw new Error(
        `Pilgrimage seed "${seed.slug}" references missing miracle slug "${slug}". ` +
          `Run \`pnpm seed:atlas\` first.`,
      )
    }
    const stop: { miracle: number; chapterNote?: string } = {
      miracle: doc.id as number,
    }
    const note = seed.chapterNotes?.[slug]
    if (note) stop.chapterNote = note
    route.push(stop)
  }

  const data = {
    title: seed.title,
    slug: seed.slug,
    subtitle: seed.subtitle,
    intro: seed.intro,
    route,
    _isSample: true,
    _status: 'published' as const,
  }

  const existing = await payload.find({
    collection: 'pilgrimages',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({
      collection: 'pilgrimages',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated pilgrimage ${seed.slug}`)
  } else {
    await payload.create({ collection: 'pilgrimages', data })
    payload.logger.info(`Created pilgrimage ${seed.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
