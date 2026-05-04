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
      footerCopy: lexicalLine(
        'Tantum Ergo is a citation-bound formation surface. Mobile-first. Built to last centuries.',
      ),
      catechistRateLimit: { requestsPerHour: 20 },
      showSampleBadges: true,
    },
  })

  payload.logger.info('Seeding HomePage global…')
  await payload.updateGlobal({
    slug: 'home-page',
    data: {
      hero: {
        eyebrow: 'In Hoc Signo · MMXXVI',
        headlineLine1: 'A digital',
        headlineItalic: 'Sistine Chapel',
        headlineLine2: 'for Catholic formation.',
        subheadline:
          'Tantum Ergo holds three instruments inside one reverent surface — a cartographic Miracle Atlas, a long-form Doctrine LMS, and an AI Catechist bound to citation. Mobile-first. Scroll-scrubbed. Built to last centuries.',
        ctaPrimaryLabel: 'Begin pilgrimage',
        ctaPrimaryHref: '/atlas',
        ctaSecondaryLabel: 'Read the manifesto',
        ctaSecondaryHref: '/manifesto',
      },
      manifestoSequence: {
        enabled: true,
        frames: [
          { eyebrow: 'I. Threshold', caption: lexicalLine('We begin not with information, but with reverence.') },
          { eyebrow: 'II. Witness', caption: lexicalLine('Two thousand years of testimony, mapped to the centuries.') },
          { eyebrow: 'III. Page', caption: lexicalLine('Doctrine, paced like a breviary — read, watched, listened to.') },
          { eyebrow: 'IV. Voice', caption: lexicalLine('A catechist that cites; that never invents.') },
        ],
      },
      pillars: {
        eyebrow: 'Three pillars',
        headlineLine1: 'Cartography. Formation.',
        headlineItalic: 'Dialogue.',
        atlas: {
          title: 'Atlas',
          intent:
            'A 3D cartography of approved miracles — Eucharistic, Marian, healings — anchored to coordinates, dates, and the ecclesial record.',
          href: '/atlas',
        },
        doctrine: {
          title: 'Doctrine',
          intent: 'A breviary-paced LMS over councils, encyclicals, the Catechism.',
          href: '/doctrine',
        },
        catechist: {
          title: 'Catechist',
          intent: 'An interlocutor bound to citation. Cites; never invents.',
          href: '/catechist',
        },
      },
      readingBand: {
        eyebrow: 'From the reading room',
        emptyMessage: 'Reading room opens soon.',
        limit: 6,
      },
    },
  })

  payload.logger.info('Seeding ManifestoPage global…')
  await payload.updateGlobal({
    slug: 'manifesto-page',
    data: {
      eyebrow: 'Manifesto',
      title: 'A digital Sistine Chapel.',
      body: lexicalLine(
        'Tantum Ergo is a vow disguised as a website. Three instruments — Atlas, Doctrine, Catechist — held under one threshold. Mobile-first. Scroll-scrubbed. Cited; never invented.',
      ),
    },
  })

  payload.logger.info('Seeding CreditsPage global…')
  await payload.updateGlobal({
    slug: 'credits-page',
    data: {
      eyebrow: 'Credits',
      title: 'Sources & ecclesial review',
      body: lexicalLine(
        'Sources, attributions, and ecclesial review notes will appear here as the content team curates them. The Catechism (Vatican English) is © Libreria Editrice Vaticana; explicit educational-use permission must be confirmed before public launch. Bible filler in the Catechist corpus uses the Douay-Rheims translation (public domain).',
      ),
    },
  })

  await ensureArticle(payload, {
    slug: 'lumen-de-lumine',
    title: 'Lumen de Lumine [Sample]',
    excerpt:
      'The Nicene fathers chose homoousios — “of one substance” — over the gentler homoiousios. One iota; an empire of meaning.',
    bodyText:
      'Light from light, true God from true God — a brief reading on the Nicene confession of the Son’s consubstantiality with the Father.',
    publishedAt: '2026-04-21',
  })
  await ensureArticle(payload, {
    slug: 'on-the-eucharistic-real-presence',
    title: 'On the Eucharistic Real Presence [Sample]',
    excerpt:
      'The substance changes; the accidents remain. This is not a metaphor; it is what the Church confesses.',
    bodyText:
      'A primer on the Catholic teaching of the substantial presence of Christ — Body, Blood, soul, and divinity — under the species of bread and wine.',
    publishedAt: '2026-04-28',
  })

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

type ArticleSeed = {
  slug: string
  title: string
  excerpt: string
  bodyText: string
  publishedAt: string
}

async function ensureArticle(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: ArticleSeed,
) {
  const existing = await payload.find({
    collection: 'articles',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })
  const data = {
    title: seed.title,
    slug: seed.slug,
    excerpt: seed.excerpt,
    body: lexicalLine(seed.bodyText),
    publishedAt: new Date(seed.publishedAt).toISOString(),
    _isSample: true,
    _status: 'published' as const,
  }
  if (existing.docs[0]) {
    await payload.update({
      collection: 'articles',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated article ${seed.slug}`)
  } else {
    await payload.create({ collection: 'articles', data })
    payload.logger.info(`Created article ${seed.slug}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
