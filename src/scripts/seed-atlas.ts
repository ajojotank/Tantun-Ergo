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
  videos?: Array<{ url: string; label?: string; attribution?: string }>
}

const SEEDS: MiracleSeed[] = [
  {
    slug: 'eucharistic-miracle-of-sample-lanciano',
    title: 'Eucharistic Miracle of Sample-Lanciano [Sample]',
    type: 'eucharistic',
    ecclesialStatus: 'approved',
    locationName: 'Sample-Lanciano, Italy',
    coordinates: [14.388, 42.227],
    yearOccurred: 700,
    dateApproximate: true,
    approvingAuthority: 'Bishop of Sample-See, c. 1574',
    summary:
      'In a small Italian church, the host and wine are said to have transformed into flesh and blood during a moment of doubt — the relics venerated for over a millennium.',
    narrativeText:
      'A monk celebrating Mass entertained doubts about the Real Presence. As he spoke the words of consecration, the host became visible flesh and the wine became visible blood. The relics were preserved and have been examined repeatedly across the centuries.',
    sources: [
      {
        label: 'Sample-Lanciano archive — pamphlet',
        attribution: 'Diocese of Sample-See',
      },
    ],
    videos: [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        label: 'Sample explanatory video',
        attribution: 'Sample · replace with a real source',
      },
    ],
  },
  {
    slug: 'bleeding-host-of-placeholder-bolsena',
    title: 'The Bleeding Host of Placeholder-Bolsena [Sample]',
    type: 'eucharistic',
    ecclesialStatus: 'recognised',
    locationName: 'Placeholder-Bolsena, Italy',
    coordinates: [11.985, 42.642],
    yearOccurred: 1263,
    approvingAuthority: 'Pope Placeholder IV',
    summary:
      'A travelling priest, doubting the Real Presence, witnessed blood seeping from the host onto the corporal — the linen later venerated as a relic.',
    narrativeText:
      'A Bohemian priest stopped in Placeholder-Bolsena en route to Rome. Plagued by doubts about transubstantiation, he celebrated Mass — and as he spoke the words of consecration, the host bled onto the corporal cloth. The cloth was carried in procession and survives to this day.',
    sources: [
      {
        label: 'Bull of Pope Placeholder IV (sample)',
        attribution: 'Vatican archive (filler)',
      },
    ],
  },
  {
    slug: 'apparition-at-sample-town',
    title: 'Apparition at Sample-Town [Sample]',
    type: 'marian',
    ecclesialStatus: 'worthy-of-belief',
    locationName: 'Sample-Town, France',
    coordinates: [-0.06, 43.094],
    yearOccurred: 1858,
    approvingAuthority: 'Bishop of Sample-Tarbes, 1862',
    summary:
      'A young shepherdess reported eighteen visits from a luminous lady at a grotto in Sample-Town — the spring that emerged is said to have brought countless healings.',
    narrativeText:
      'Over five months in 1858, a fourteen-year-old in Sample-Town reported eighteen apparitions of a lady who identified herself as the Immaculate Conception. The grotto became a pilgrimage site; the spring water is associated with thousands of reported healings.',
    sources: [
      {
        label: 'Bishop of Sample-Tarbes — pastoral letter',
        attribution: 'Diocesan archive (filler)',
      },
    ],
  },
  {
    slug: 'our-lady-of-lorem',
    title: 'Our Lady of Lorem [Sample]',
    type: 'marian',
    ecclesialStatus: 'approved',
    locationName: 'Lorem-Tepeyac, Mexico',
    coordinates: [-99.117, 19.486],
    yearOccurred: 1531,
    approvingAuthority: 'Archbishop of Lorem-City',
    summary:
      'An indigenous farmer reported four visits from the Mother of God on the hill of Lorem-Tepeyac; her image is said to have appeared imprinted on his cloak.',
    narrativeText:
      'A peasant in early-colonial Lorem-Tepeyac reported encountering a young woman who identified herself as the Mother of God. As proof, she instructed him to gather flowers in his cloak. When he opened the cloak before the bishop, an image of the lady was found imprinted on the fabric.',
    sources: [
      {
        label: 'Lorem chronicle (sample)',
        attribution: 'Archdiocese of Lorem-City',
      },
    ],
  },
  {
    slug: 'healing-of-brother-placeholder',
    title: 'Healing of Brother Placeholder [Sample]',
    type: 'healing',
    ecclesialStatus: 'under-investigation',
    locationName: 'Anywhere, Spain',
    coordinates: [-3.703, 40.416],
    yearOccurred: 1923,
    summary:
      'A Franciscan brother reported the sudden remission of a degenerative illness after a novena — the case currently before the diocesan tribunal.',
    narrativeText:
      'Brother Placeholder, a Franciscan, was diagnosed with a degenerative neuromuscular condition. After a nine-day novena to a particular intercessor, he reported sudden and complete remission, confirmed by his attending physicians. The case has been forwarded to the diocesan tribunal.',
    sources: [
      {
        label: 'Diocesan medical report — sealed (sample)',
        attribution: 'Anywhere diocesan curia',
      },
    ],
  },
  {
    slug: 'restoration-at-sample-spring',
    title: 'Restoration at Sample-Spring [Sample]',
    type: 'healing',
    ecclesialStatus: 'approved',
    locationName: 'Sample-Spring, France',
    coordinates: [0.044, 43.099],
    yearOccurred: 1879,
    approvingAuthority: 'Bishop of Sample-Spring, 1884',
    summary:
      'A pilgrim with a long-standing infirmity reported instantaneous restoration after immersion in the spring — one of dozens approved by the local tribunal.',
    narrativeText:
      'A pilgrim travelled to Sample-Spring with documentation of a fifteen-year infirmity. Upon immersion in the spring waters, he reported instantaneous restoration. After medical examination, the local tribunal approved the case as inexplicable by natural means.',
    sources: [
      {
        label: 'Sample-Spring tribunal record',
        attribution: 'Diocesan archive (filler)',
      },
    ],
  },
  {
    slug: 'stigmata-of-saint-ipsum',
    title: 'Stigmata of Saint Ipsum [Sample]',
    type: 'stigmata',
    ecclesialStatus: 'recognised',
    locationName: 'Ipsum Abbey, Italy',
    coordinates: [12.611, 43.062],
    yearOccurred: 1224,
    dateApproximate: true,
    approvingAuthority: 'Pope Lorem IX, 1228',
    summary:
      'A friar at Ipsum Abbey is said to have received the wounds of Christ on a mountain retreat — the first such recorded case in Christian history.',
    narrativeText:
      'Withdrawn for prayer at Ipsum Abbey, the friar reported a vision of a seraph in the form of the crucified Christ. After the vision, the wounds of Christ appeared on his body — hands, feet, and side — and remained until his death.',
    sources: [
      {
        label: 'Hagiographic account (sample)',
        attribution: 'Order of Friars Sample',
      },
    ],
  },
  {
    slug: 'incorrupt-body-of-saint-lorem',
    title: 'The Incorrupt Body of Saint Lorem [Sample]',
    type: 'incorruptible',
    ecclesialStatus: 'approved',
    locationName: 'Lorem-City, Spain',
    coordinates: [-4.728, 40.64],
    yearOccurred: 1582,
    approvingAuthority: 'Archbishop of Lorem-City, 1622',
    summary:
      'Forty years after burial, the body of a Carmelite reformer was exhumed and reported intact, fragrant, and supple — taken as a sign of holiness.',
    narrativeText:
      'Forty years after her burial, the body of the Carmelite reformer was exhumed for translation to a new shrine. Witnesses reported finding the body intact, fragrant, and supple. The body has been examined repeatedly and remains preserved at her shrine.',
    sources: [
      {
        label: 'Exhumation register (sample)',
        attribution: 'Carmelite archive',
      },
    ],
  },
  {
    slug: 'levitation-of-brother-sample',
    title: 'Levitation of Brother Sample [Sample]',
    type: 'other',
    ecclesialStatus: 'under-investigation',
    locationName: 'Sample-Cupertino, Italy',
    coordinates: [16.5, 40.75],
    yearOccurred: 1671,
    summary:
      'A Franciscan known for ecstatic prayer was repeatedly observed rising into the air during the Eucharistic celebration — the cause is presently before a Roman tribunal.',
    narrativeText:
      'Brother Sample of Sample-Cupertino was a Franciscan known for ecstatic prayer. Witnesses on multiple occasions reported him rising into the air during the consecration of the Eucharist. The accounts are documented in his cause for canonisation, currently before a Roman tribunal.',
    sources: [
      {
        label: 'Cause for canonisation — Roman archive (sample)',
        attribution: 'Congregation for the Causes of Saints',
      },
    ],
  },
]

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
    videos: seed.videos ?? [],
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
