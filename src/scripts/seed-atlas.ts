// src/scripts/seed-atlas.ts
//
// Idempotent seed for the Miracles collection. Run with `pnpm seed:atlas`.
// Each entry is `_isSample: true` with a deliberately fictional name; the
// content team will replace these with authentic records.
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

type MiracleSeed = {
  slug: string
  title: string
  type:
    | 'eucharistic'
    | 'marian'
    | 'healing'
    | 'stigmata'
    | 'incorruptible'
    | 'other'
  ecclesialStatus:
    | 'approved'
    | 'recognised'
    | 'worthy-of-belief'
    | 'under-investigation'
    | 'not-constatat'
  locationName: string
  coordinates: [number, number] // [lng, lat]
  yearOccurred: number
  dateApproximate?: boolean
  approvingAuthority?: string
  summary: string
  narrativeText: string
  sources?: Array<{ label: string; url?: string; attribution?: string }>
  inPilgrimage?: boolean
  pilgrimageOrder?: number
}

const SEEDS: MiracleSeed[] = [] // populated in Task 18

async function main() {
  const payload = await getPayload({ config })

  for (const seed of SEEDS) {
    await ensureMiracle(payload, seed)
  }

  payload.logger.info(`Atlas seed complete (${SEEDS.length} miracles).`)
  process.exit(0)
}

function lexicalLine(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: null,
      children: [
        {
          type: 'paragraph',
          version: 1,
          format: '',
          indent: 0,
          direction: null,
          children: [
            { type: 'text', version: 1, format: 0, detail: 0, mode: 'normal', style: '', text },
          ],
        },
      ],
    },
  } as never
}

async function ensureMiracle(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: MiracleSeed,
) {
  const existing = await payload.find({
    collection: 'miracles',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })
  const data = {
    title: seed.title,
    slug: seed.slug,
    type: seed.type,
    ecclesialStatus: seed.ecclesialStatus,
    locationName: seed.locationName,
    coordinates: seed.coordinates,
    yearOccurred: seed.yearOccurred,
    dateApproximate: Boolean(seed.dateApproximate),
    approvingAuthority: seed.approvingAuthority,
    summary: seed.summary,
    narrative: lexicalLine(seed.narrativeText),
    sources: seed.sources ?? [],
    inPilgrimage: Boolean(seed.inPilgrimage),
    pilgrimageOrder: seed.pilgrimageOrder,
    _isSample: true,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({
      collection: 'miracles',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated miracle ${seed.slug}`)
  } else {
    await payload.create({ collection: 'miracles', data })
    payload.logger.info(`Created miracle ${seed.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
