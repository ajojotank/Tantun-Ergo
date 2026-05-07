// src/scripts/seed-doctrine.ts
//
// Idempotent seed for the Doctrine LMS. Creates 3 tracks, 6 modules, 18
// units. Every doc is `_isSample: true`. Run with `pnpm seed:doctrine`.
//
// Re-running upserts on slug. Tracks are upserted by slug; modules are
// upserted by (track-id, slug); units by (module-id, slug).
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config'

type UnitSeed = {
  slug: string
  title: string
  order: number
  reading: string
  masteryPrompt: string
  options: Array<{ text: string; isCorrect: boolean; affirmation: string }>
}

type ModuleSeed = {
  slug: string
  title: string
  summary: string
  order: number
  units: UnitSeed[]
}

type TrackSeed = {
  slug: string
  title: string
  summary: string
  order: number
  modules: ModuleSeed[]
}

const SEEDS: TrackSeed[] = [
  {
    slug: 'the-eucharist',
    title: 'The Eucharist [Sample]',
    summary:
      'A pilgrimage through what the Church believes about the Bread of Life — the source and summit of the Christian life.',
    order: 0,
    modules: [
      {
        slug: 'the-real-presence',
        title: 'The Real Presence [Sample]',
        summary:
          'How the Church reads "This is my body" — the inheritance of the early councils through Trent and Vatican II.',
        order: 0,
        units: [
          {
            slug: 'this-is-my-body',
            title: '"This is my body"',
            order: 0,
            reading:
              'When Jesus speaks the words of institution at the Last Supper, the Church receives them as more than metaphor. The earliest Christian writings — including the Didache and Justin Martyr — describe the bread and wine of the Eucharist in language that assumes substantive transformation. The doctrine of the Real Presence is the patient unfolding of that first reception.',
            masteryPrompt: 'Do you remember where the words of institution first appear in Scripture?',
            options: [
              {
                text: 'In the Synoptic Gospels and 1 Corinthians 11.',
                isCorrect: true,
                affirmation: 'Yes — three Gospel accounts and Paul\'s, all converging.',
              },
              {
                text: 'Only in the Gospel of John.',
                isCorrect: false,
                affirmation: 'John records the bread of life discourse, but the institution words sit in the Synoptics and Paul.',
              },
              {
                text: 'Only in the Acts of the Apostles.',
                isCorrect: false,
                affirmation: 'Acts records the breaking of bread; the institution words come earlier in the Gospels and Paul.',
              },
            ],
          },
          {
            slug: 'transubstantiation',
            title: 'Transubstantiation, briefly',
            order: 1,
            reading:
              'The word transubstantiation took its precise form at the Fourth Lateran Council in 1215 and was restated at Trent. It does not claim to explain the mystery — it names what the Church has always confessed: that the substance of the bread and wine becomes the substance of the body and blood of Christ, while the appearances remain.',
            masteryPrompt: 'Do you remember which council formally adopted the term?',
            options: [
              {
                text: 'The Fourth Lateran Council, 1215.',
                isCorrect: true,
                affirmation: 'Yes — Lateran IV under Innocent III.',
              },
              {
                text: 'The First Council of Nicaea, 325.',
                isCorrect: false,
                affirmation: 'Nicaea defined the divinity of Christ; the Eucharistic term came later.',
              },
              {
                text: 'The Council of Constance, 1414.',
                isCorrect: false,
                affirmation: 'Constance addressed other matters; Lateran IV was the council that adopted this term.',
              },
            ],
          },
          {
            slug: 'eucharistic-miracles-as-witness',
            title: 'Eucharistic miracles as witness',
            order: 2,
            reading:
              'Eucharistic miracles — Lanciano, Bolsena, Buenos Aires — do not constitute the doctrine. The Church\'s teaching does not depend on them. But the Church receives them as a kind of pastoral confirmation, a lived "you are not believing alone" given to those who already accept the words of institution.',
            masteryPrompt: 'Do you remember the relationship between Eucharistic miracles and the doctrine of the Real Presence?',
            options: [
              {
                text: 'The miracles confirm a doctrine the Church already holds on apostolic and scriptural grounds.',
                isCorrect: true,
                affirmation: 'Yes — pastoral confirmation, not foundation.',
              },
              {
                text: 'The doctrine depends on the historical authenticity of these miracles.',
                isCorrect: false,
                affirmation: 'Apostolic teaching and Scripture are the foundation; the miracles confirm but do not constitute.',
              },
              {
                text: 'The Church requires every Catholic to accept the historical record of every reported miracle.',
                isCorrect: false,
                affirmation: 'The Church judges miracles individually; only some are formally approved.',
              },
            ],
          },
        ],
      },
      {
        slug: 'sacrifice-and-meal',
        title: 'Sacrifice and meal [Sample]',
        summary:
          'The two faces of the Mass — re-presentation of Calvary, table of communion — and how they hold together.',
        order: 1,
        units: [
          {
            slug: 'one-sacrifice-many-altars',
            title: 'One sacrifice, many altars',
            order: 0,
            reading:
              'The Council of Trent insisted that the Mass is the same sacrifice as Calvary, made present sacramentally. Not a repetition — a re-presentation. Hebrews emphasises that Christ offered himself once for all; the Mass does not add to that offering. It draws every altar into it.',
            masteryPrompt: 'Do you remember what Trent denied when teaching about the Mass and Calvary?',
            options: [
              {
                text: 'That the Mass is a separate sacrifice that adds to Calvary.',
                isCorrect: true,
                affirmation: 'Yes — Trent guarded the once-for-all of Hebrews.',
              },
              {
                text: 'That the Mass commemorates the Last Supper.',
                isCorrect: false,
                affirmation: 'The commemoration is real; what Trent denied was that the Mass is a separate sacrifice.',
              },
              {
                text: 'That the priest presides at the Eucharistic celebration.',
                isCorrect: false,
                affirmation: 'Trent affirmed the priest\'s role; that wasn\'t the disputed point.',
              },
            ],
          },
          {
            slug: 'communion-as-meal',
            title: 'Communion as meal',
            order: 1,
            reading:
              'The Eucharist is sacrifice and meal at once. The meal language is not decorative — it carries the whole grammar of fellowship and incorporation. To receive communion is to be drawn into the body that is offered, not just to remember it from a distance.',
            masteryPrompt: 'Do you remember what "communion" most directly names?',
            options: [
              {
                text: 'A shared participation in the body of Christ.',
                isCorrect: true,
                affirmation: 'Yes — koinonia, fellowship, incorporation.',
              },
              {
                text: 'A private devotion between an individual and Christ.',
                isCorrect: false,
                affirmation: 'Communion is by its nature shared; the word itself names participation.',
              },
              {
                text: 'A symbolic gesture without substantive meaning.',
                isCorrect: false,
                affirmation: 'The Church teaches that communion is real participation, not symbolic only.',
              },
            ],
          },
          {
            slug: 'who-may-receive',
            title: 'Who may receive',
            order: 2,
            reading:
              'The Church\'s discipline of communion — the requirement of being in a state of grace, the practice of confession, the integrity of full communion with the Catholic Church — flows from the seriousness of what is received. It is not a barrier to grace but a recognition of it.',
            masteryPrompt: 'Do you remember why the Church requires preparation before receiving communion?',
            options: [
              {
                text: 'Because of what is actually received — the body and blood of Christ.',
                isCorrect: true,
                affirmation: 'Yes — the discipline flows from the sacrament\'s reality.',
              },
              {
                text: 'To exclude those who haven\'t earned it.',
                isCorrect: false,
                affirmation: 'No one earns communion; the discipline is about reverence, not merit.',
              },
              {
                text: 'For purely cultural reasons.',
                isCorrect: false,
                affirmation: 'The discipline is doctrinal — it flows from what the sacrament is.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'mariology',
    title: 'Mariology [Sample]',
    summary:
      'The Church\'s teaching about Mary — what is held de fide, what is devotion, and how the two relate.',
    order: 1,
    modules: [
      {
        slug: 'four-marian-dogmas',
        title: 'The four Marian dogmas [Sample]',
        summary:
          'Mother of God, Perpetual Virginity, Immaculate Conception, Assumption — what each means and when it was defined.',
        order: 0,
        units: [
          {
            slug: 'theotokos',
            title: 'Theotokos — God-bearer',
            order: 0,
            reading:
              'The Council of Ephesus in 431 affirmed that Mary is rightly called Theotokos — God-bearer. The point of the title is Christological: it guards the unity of Christ\'s person. To call Mary the Mother of God is to refuse to split the one Christ into two persons. Mariology, in its earliest dogma, exists for the sake of the Son.',
            masteryPrompt: 'Do you remember why the Church teaches Mary as Theotokos?',
            options: [
              {
                text: 'To affirm that Christ is one person, fully divine and fully human.',
                isCorrect: true,
                affirmation: 'Yes — the title guards Christ\'s unity.',
              },
              {
                text: 'To elevate Mary above her Son.',
                isCorrect: false,
                affirmation: 'The title is Christological; it never separates Mary from her dependence on Christ.',
              },
              {
                text: 'As a popular devotion without doctrinal weight.',
                isCorrect: false,
                affirmation: 'It is dogma — Ephesus 431 — and it is doctrinal in its core meaning.',
              },
            ],
          },
          {
            slug: 'immaculate-conception',
            title: 'The Immaculate Conception',
            order: 1,
            reading:
              'Defined by Pius IX in 1854 in Ineffabilis Deus, the Immaculate Conception teaches that Mary, from the first instant of her conception, was preserved free from original sin by the merits of Christ. The dogma is about her being prepared for her vocation, not about a separate path to grace.',
            masteryPrompt: 'Do you remember what the Immaculate Conception teaches?',
            options: [
              {
                text: 'That Mary was preserved from original sin from the moment of her conception, by the merits of Christ.',
                isCorrect: true,
                affirmation: 'Yes — preservation in view of Christ\'s saving work.',
              },
              {
                text: 'That Jesus was conceived without sin.',
                isCorrect: false,
                affirmation: 'That is a separate truth (Christ\'s sinlessness); the Immaculate Conception is about Mary.',
              },
              {
                text: 'That Mary did not need redemption.',
                isCorrect: false,
                affirmation: 'The dogma explicitly includes "by the merits of Christ" — she was redeemed in a unique way.',
              },
            ],
          },
          {
            slug: 'the-assumption',
            title: 'The Assumption',
            order: 2,
            reading:
              'Defined by Pius XII in 1950 in Munificentissimus Deus, the Assumption teaches that Mary, at the end of her earthly life, was taken up body and soul into heavenly glory. The Church does not bind a position on whether she died before being assumed; the dogma is about the destination, not the mechanism.',
            masteryPrompt: 'Do you remember what the Church requires Catholics to hold about whether Mary died before her Assumption?',
            options: [
              {
                text: 'Nothing is binding either way — the dogma defines the Assumption itself, not the manner.',
                isCorrect: true,
                affirmation: 'Yes — Munificentissimus Deus left this open.',
              },
              {
                text: 'Catholics must hold that she did not die.',
                isCorrect: false,
                affirmation: 'The dogma is silent on this; the Eastern tradition speaks of the Dormition.',
              },
              {
                text: 'Catholics must hold that she died.',
                isCorrect: false,
                affirmation: 'The dogma is silent here; some saints have held either position.',
              },
            ],
          },
        ],
      },
      {
        slug: 'devotion-and-discernment',
        title: 'Devotion and discernment [Sample]',
        summary:
          'How the Church distinguishes private revelation from public revelation, and how Marian apparitions are weighed.',
        order: 1,
        units: [
          {
            slug: 'private-revelation',
            title: 'Private revelation',
            order: 0,
            reading:
              'Public revelation closed with the death of the last apostle. Private revelation — including Marian apparitions — is never required for belief. When the Church approves an apparition, she does so cautiously, with the language of "worthy of belief," meaning the faithful may give it credence without obligation.',
            masteryPrompt: 'Do you remember the difference between public and private revelation?',
            options: [
              {
                text: 'Public revelation closed with the apostles; private revelation is never required for belief.',
                isCorrect: true,
                affirmation: 'Yes — that\'s the Church\'s clear distinction.',
              },
              {
                text: 'They are interchangeable categories.',
                isCorrect: false,
                affirmation: 'They are distinct: public is binding for faith, private is not.',
              },
              {
                text: 'Private revelations supersede the apostolic deposit.',
                isCorrect: false,
                affirmation: 'The Church teaches the opposite — they may not contradict the deposit of faith.',
              },
            ],
          },
          {
            slug: 'fatima-and-lourdes',
            title: 'Fatima and Lourdes',
            order: 1,
            reading:
              'Two of the most widely received Marian apparitions — Lourdes in 1858 and Fatima in 1917 — have shaped popular devotion in profound ways. Both have been formally approved by the Church. Both leave individual reception, however, voluntary. The Church\'s role is to discern, not to compel.',
            masteryPrompt: 'Do you remember what "approved" means for an apparition?',
            options: [
              {
                text: 'The Church judges the apparition free of error and worthy of belief.',
                isCorrect: true,
                affirmation: 'Yes — and individual reception remains voluntary.',
              },
              {
                text: 'The Church requires every Catholic to accept its content as binding.',
                isCorrect: false,
                affirmation: 'No private revelation is binding for faith.',
              },
              {
                text: 'The Church guarantees its historical accuracy in every detail.',
                isCorrect: false,
                affirmation: 'Approval is about doctrinal content and discernment, not detail-level history.',
              },
            ],
          },
          {
            slug: 'marian-prayer',
            title: 'Marian prayer',
            order: 2,
            reading:
              'The rosary, the Memorare, the Hail Mary — these are the Church\'s shared Marian patrimony. The grammar is always intercessory: we ask Mary to pray with us and for us, never to take the place of her Son. Devotion that obscures Christ is not Catholic devotion.',
            masteryPrompt: 'Do you remember the basic grammar of Marian prayer?',
            options: [
              {
                text: 'Intercession — we ask Mary to pray with us and for us.',
                isCorrect: true,
                affirmation: 'Yes — that is the constant Catholic grammar.',
              },
              {
                text: 'Direct worship of Mary as we worship Christ.',
                isCorrect: false,
                affirmation: 'The Church distinguishes worship (latria) from veneration (hyperdulia).',
              },
              {
                text: 'A replacement for prayer to Christ.',
                isCorrect: false,
                affirmation: 'Marian prayer is always ordered toward Christ, never a replacement.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'liturgical-year',
    title: 'Liturgical Year [Sample]',
    summary:
      'The seasons and feasts that shape Catholic time — Advent, Christmas, Lent, Easter, Ordinary Time — and what each is for.',
    order: 2,
    modules: [
      {
        slug: 'advent-and-christmas',
        title: 'Advent and Christmas [Sample]',
        summary:
          'The first season of the year — preparation, expectation, and the feast of the Incarnation.',
        order: 0,
        units: [
          {
            slug: 'advent-as-preparation',
            title: 'Advent as preparation',
            order: 0,
            reading:
              'Advent has two horizons. It looks back to the centuries of Israel\'s expectation, and forward to Christ\'s return. The season is not a countdown to Christmas — it is a re-formation of attention. Purple vestments, the Advent wreath, the O Antiphons in the final week: each is a way of waking up to the meaning of waiting.',
            masteryPrompt: 'Do you remember the two horizons Advent holds together?',
            options: [
              {
                text: 'Israel\'s expectation of the Messiah, and the Church\'s expectation of Christ\'s return.',
                isCorrect: true,
                affirmation: 'Yes — the past and the future bound by the present feast.',
              },
              {
                text: 'Just the four weeks before Christmas, no further meaning.',
                isCorrect: false,
                affirmation: 'The season carries both horizons — that\'s what makes it more than a countdown.',
              },
              {
                text: 'Lent and Easter.',
                isCorrect: false,
                affirmation: 'Those are different seasons with different shapes.',
              },
            ],
          },
          {
            slug: 'incarnation',
            title: 'The Incarnation',
            order: 1,
            reading:
              'Christmas celebrates not just Christ\'s birth, but the doctrine that the Word became flesh. John 1 is the Christmas reading the early Church chose for itself. The Incarnation is not a one-time event — it is the fact that gives every other Christian doctrine its shape.',
            masteryPrompt: 'Do you remember the prologue most associated with the Christmas liturgy?',
            options: [
              {
                text: 'John 1 — "the Word became flesh."',
                isCorrect: true,
                affirmation: 'Yes — the prologue of John, read at Mass on Christmas Day.',
              },
              {
                text: 'Genesis 1.',
                isCorrect: false,
                affirmation: 'Genesis 1 is read at the Easter Vigil; Christmas Day takes John 1.',
              },
              {
                text: 'Romans 8.',
                isCorrect: false,
                affirmation: 'Romans 8 belongs to other liturgical contexts.',
              },
            ],
          },
          {
            slug: 'epiphany',
            title: 'Epiphany',
            order: 2,
            reading:
              'Epiphany — January 6, or the nearest Sunday — celebrates the manifestation of Christ to the nations. The visit of the Magi is the iconic image, but the feast is also bound to the baptism of the Lord and the wedding at Cana. Three "epiphanies" of the same mystery: God revealed, God acknowledged, God provident.',
            masteryPrompt: 'Do you remember the three traditional events celebrated under "Epiphany"?',
            options: [
              {
                text: 'The visit of the Magi, the baptism of Christ, and the wedding at Cana.',
                isCorrect: true,
                affirmation: 'Yes — three manifestations of the one Christ.',
              },
              {
                text: 'Only the visit of the Magi.',
                isCorrect: false,
                affirmation: 'The Magi are the iconic image, but the feast traditionally holds all three.',
              },
              {
                text: 'The Crucifixion and Resurrection.',
                isCorrect: false,
                affirmation: 'Those belong to the Paschal Triduum.',
              },
            ],
          },
        ],
      },
      {
        slug: 'lent-and-easter',
        title: 'Lent and Easter [Sample]',
        summary:
          'The forty days of conversion, the Triduum, and the great fifty days of Eastertide.',
        order: 1,
        units: [
          {
            slug: 'lenten-disciplines',
            title: 'Lenten disciplines',
            order: 0,
            reading:
              'Prayer, fasting, almsgiving — the three classical Lenten disciplines, drawn directly from the Sermon on the Mount. The point is not deprivation as virtue. It is conversion: a re-ordering of the affections so that what is given up, what is given away, and what is given attention to are all rightly tuned by Easter.',
            masteryPrompt: 'Do you remember the three classical Lenten disciplines?',
            options: [
              {
                text: 'Prayer, fasting, and almsgiving.',
                isCorrect: true,
                affirmation: 'Yes — the three from Matthew 6.',
              },
              {
                text: 'Prayer alone.',
                isCorrect: false,
                affirmation: 'The Sermon on the Mount names three; the Church holds them together.',
              },
              {
                text: 'Reading, study, and reflection.',
                isCorrect: false,
                affirmation: 'Those are good disciplines, but the classical three are prayer, fasting, almsgiving.',
              },
            ],
          },
          {
            slug: 'the-triduum',
            title: 'The Paschal Triduum',
            order: 1,
            reading:
              'Holy Thursday, Good Friday, and the Easter Vigil are not three separate liturgies but one liturgy in three movements. The bell at the Gloria of Holy Thursday silences until the Vigil; the altar is stripped; the Vigil opens with the new fire. The shape is ancient, and intentional.',
            masteryPrompt: 'Do you remember whether the three days of the Triduum are one liturgy or three?',
            options: [
              {
                text: 'One liturgy in three movements.',
                isCorrect: true,
                affirmation: 'Yes — that\'s the Church\'s own description.',
              },
              {
                text: 'Three independent liturgies.',
                isCorrect: false,
                affirmation: 'They are intentionally bound — there is no dismissal at the end of Holy Thursday.',
              },
              {
                text: 'A series of devotions, not liturgies.',
                isCorrect: false,
                affirmation: 'The Triduum is the highest liturgical celebration of the year.',
              },
            ],
          },
          {
            slug: 'eastertide',
            title: 'The fifty days',
            order: 2,
            reading:
              'Easter is a season, not a day. The Church celebrates fifty days from Easter Sunday to Pentecost — longer than Lent, longer than Advent. The point is structural: joy is meant to be sustained, not glanced at. The Paschal candle stays lit through the whole season.',
            masteryPrompt: 'Do you remember how long the Easter season lasts?',
            options: [
              {
                text: 'Fifty days, from Easter Sunday to Pentecost.',
                isCorrect: true,
                affirmation: 'Yes — and longer than Lent.',
              },
              {
                text: 'Just one Sunday.',
                isCorrect: false,
                affirmation: 'Easter Day is the highest feast, but the season carries the joy further.',
              },
              {
                text: 'Forty days, like Lent.',
                isCorrect: false,
                affirmation: 'Eastertide is fifty days; the Church chose a longer span deliberately.',
              },
            ],
          },
        ],
      },
    ],
  },
]

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

async function main() {
  const payload = await getPayload({ config })

  for (const trackSeed of SEEDS) {
    const trackId = await ensureTrack(payload, trackSeed)
    for (const moduleSeed of trackSeed.modules) {
      const moduleId = await ensureModule(payload, trackId, moduleSeed)
      for (const unitSeed of moduleSeed.units) {
        await ensureUnit(payload, moduleId, unitSeed)
      }
    }
  }

  payload.logger.info(
    `Doctrine seed complete (${SEEDS.length} tracks, ${SEEDS.reduce(
      (s, t) => s + t.modules.length,
      0,
    )} modules, ${SEEDS.reduce(
      (s, t) =>
        s +
        t.modules.reduce((ss, m) => ss + m.units.length, 0),
      0,
    )} units).`,
  )
  process.exit(0)
}

async function ensureTrack(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: TrackSeed,
): Promise<number> {
  const data = {
    title: seed.title,
    slug: seed.slug,
    summary: seed.summary,
    order: seed.order,
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-tracks',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-tracks',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine track ${seed.slug}`)
    return existing.docs[0].id as number
  }
  const created = await payload.create({
    collection: 'doctrine-tracks',
    data,
  })
  payload.logger.info(`Created doctrine track ${seed.slug}`)
  return created.id as number
}

async function ensureModule(
  payload: Awaited<ReturnType<typeof getPayload>>,
  trackId: number,
  seed: ModuleSeed,
): Promise<number> {
  const data = {
    track: trackId,
    title: seed.title,
    slug: seed.slug,
    summary: seed.summary,
    order: seed.order,
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-modules',
    where: {
      and: [
        { slug: { equals: seed.slug } },
        { track: { equals: trackId } },
      ],
    },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-modules',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine module ${seed.slug} (track ${trackId})`)
    return existing.docs[0].id as number
  }
  const created = await payload.create({
    collection: 'doctrine-modules',
    data,
  })
  payload.logger.info(`Created doctrine module ${seed.slug} (track ${trackId})`)
  return created.id as number
}

async function ensureUnit(
  payload: Awaited<ReturnType<typeof getPayload>>,
  moduleId: number,
  seed: UnitSeed,
): Promise<void> {
  const data = {
    module: moduleId,
    title: seed.title,
    slug: seed.slug,
    order: seed.order,
    lanes: {
      reading: lexicalLine(seed.reading),
    },
    masteryCheck: {
      prompt: seed.masteryPrompt,
      options: seed.options,
    },
    _isSample: true,
    _status: 'published' as const,
  }
  const existing = await payload.find({
    collection: 'doctrine-units',
    where: {
      and: [
        { slug: { equals: seed.slug } },
        { module: { equals: moduleId } },
      ],
    },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'doctrine-units',
      id: existing.docs[0].id,
      data,
    })
    payload.logger.info(`Updated doctrine unit ${seed.slug} (module ${moduleId})`)
    return
  }
  await payload.create({ collection: 'doctrine-units', data })
  payload.logger.info(`Created doctrine unit ${seed.slug} (module ${moduleId})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
