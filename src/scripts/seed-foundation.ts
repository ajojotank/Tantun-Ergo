// src/scripts/seed-foundation.ts
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

async function main() {
  const payload = await getPayload({ config })

  payload.logger.info('Seeding Settings global…')
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      siteTitle: 'Tantum Ergo',
      siteTagline: 'A digital Sistine Chapel for Catholic formation.',
      footerCopy: {
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
                {
                  type: 'text',
                  version: 1,
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                  text:
                    'Tantum Ergo is a citation-bound formation surface. Mobile-first. Built to last centuries.',
                },
              ],
            },
          ],
        },
      } as never,
      catechistRateLimit: { requestsPerHour: 20, refusalMessage: undefined },
      showSampleBadges: true,
    },
  })

  payload.logger.info('Seeding ManifestoSequence (with placeholder frames)…')
  await payload.updateGlobal({
    slug: 'manifesto-sequence',
    data: {
      enabled: true,
      frames: [
        {
          eyebrow: 'I. Threshold',
          caption: lexicalLine('We begin not with information, but with reverence.'),
        },
        {
          eyebrow: 'II. Witness',
          caption: lexicalLine('Two thousand years of testimony, mapped to the centuries.'),
        },
        {
          eyebrow: 'III. Page',
          caption: lexicalLine('Doctrine, paced like a breviary — read, watched, listened to.'),
        },
        {
          eyebrow: 'IV. Voice',
          caption: lexicalLine('A catechist that cites; that never invents.'),
        },
      ],
    },
  })

  await ensurePage(payload, 'home', 'home-block', 'Home block (filler)', '[Sample]')
  await ensurePage(
    payload,
    'manifesto',
    'manifesto',
    'A digital Sistine Chapel.',
    'Tantum Ergo is a vow disguised as a website. Three instruments — Atlas, Doctrine, Catechist — held under one threshold. Mobile-first. Scroll-scrubbed. Cited; never invented.',
  )
  await ensurePage(
    payload,
    'credits',
    'credits',
    'Sources & ecclesial review',
    'Sources, attributions, and ecclesial review notes will appear here as the content team curates them. The Catechism (Vatican English) is © Libreria Editrice Vaticana; explicit educational-use permission must be confirmed before public launch. Bible filler in the Catechist corpus uses the Douay-Rheims translation (public domain).',
  )

  await ensurePage(
    payload,
    'lumen-de-lumine',
    'reading-article',
    'Lumen de Lumine [Sample]',
    'Light from light, true God from true God — a brief reading on the Nicene confession of the Son’s consubstantiality with the Father.',
    {
      excerpt:
        'The Nicene fathers chose homoousios — “of one substance” — over the gentler homoiousios. One iota; an empire of meaning.',
      publishedAt: new Date('2026-04-21').toISOString(),
    },
  )
  await ensurePage(
    payload,
    'on-the-eucharistic-real-presence',
    'reading-article',
    'On the Eucharistic Real Presence [Sample]',
    'A primer on the Catholic teaching of the substantial presence of Christ — Body, Blood, soul, and divinity — under the species of bread and wine.',
    {
      excerpt:
        'The substance changes; the accidents remain. This is not a metaphor; it is what the Church confesses.',
      publishedAt: new Date('2026-04-28').toISOString(),
    },
  )

  payload.logger.info('Seed complete.')
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

type EnsureExtras = { excerpt?: string; publishedAt?: string }

async function ensurePage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  pageType: 'home-block' | 'manifesto' | 'credits' | 'reading-article',
  title: string,
  bodyText: string,
  extras: EnsureExtras = {},
) {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const data = {
    title,
    slug,
    pageType,
    _isSample: true,
    body: lexicalLine(bodyText),
    ...extras,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({
      collection: 'pages',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated page ${slug}`)
  } else {
    await payload.create({ collection: 'pages', data })
    payload.logger.info(`Created page ${slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
