// src/scripts/seed-doctrine.ts
//
// Idempotent seed for the Doctrine LMS. Creates 3 DoctrineCourses documents,
// each with 2 modules × 3 units = 6 units per course (18 total).
// Every doc is `_isSample: true`. Run with `pnpm seed:doctrine`.
//
// Re-running is safe: media is checked by filename, courses by slug.
import 'dotenv/config'
import { getPayload } from 'payload'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import config from '../payload.config'
import type { Media } from '../payload-types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SeedMediaSpec = {
  filename: string
  altText: string
  mimeType: string
}

type SeedResourceSpec =
  | { kind: 'download'; label: string; description: string; mediaKey: string }
  | { kind: 'link'; label: string; description: string; url: string }
  | { kind: 'citation'; label: string; description: string; citation: string; citationUrl?: string }

type SeedUnitSpec = {
  title: string
  slug: string
  estimatedMinutes: number
  introduction: SerializedRichText
  reading: SerializedRichText
  watchVideoMediaKey?: string
  listenAudioMediaKey?: string
  resources: SeedResourceSpec[]
  masteryCheck?: {
    prompt: string
    options: { text: string; isCorrect: boolean; affirmation?: string }[]
  }
}

type SeedModuleSpec = {
  title: string
  slug: string
  summary: string
  units: SeedUnitSpec[]
}

type SeedCourseSpec = {
  title: string
  slug: string
  tagline: string
  summary: string
  longDescription: SerializedRichText
  coverPlateMediaKey?: string
  learnPoints: string[]
  order: number
  modules: SeedModuleSpec[]
}

// Lexical serialized format — minimal paragraph + text nodes.
type SerializedRichText = {
  root: {
    type: 'root'
    format: ''
    indent: 0
    version: 1
    children: Array<{
      type: 'paragraph'
      format: ''
      indent: 0
      version: 1
      direction: 'ltr'
      textFormat: 0
      textStyle: ''
      children: Array<{
        type: 'text'
        format: 0
        style: ''
        mode: 'normal'
        text: string
        version: 1
        detail: 0
      }>
    }>
    direction: 'ltr'
  }
}

function p(text: string): SerializedRichText {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              format: 0,
              style: '',
              mode: 'normal',
              text,
              version: 1,
              detail: 0,
            },
          ],
        },
      ],
    },
  }
}

// ---------------------------------------------------------------------------
// Media specs
// ---------------------------------------------------------------------------

const MEDIA_SPECS: Record<string, SeedMediaSpec> = {
  chant: {
    filename: 'chant.mp3',
    altText: 'Sample Gregorian chant audio',
    mimeType: 'audio/mpeg',
  },
  catechesis: {
    filename: 'catechesis.mp4',
    altText: 'Sample Catholic catechesis video',
    mimeType: 'video/mp4',
  },
  cccExcerpt: {
    filename: 'ccc-excerpt.pdf',
    altText: 'Catechism of the Catholic Church §1324 excerpt',
    mimeType: 'application/pdf',
  },
  prayerCard: {
    filename: 'prayer-card.pdf',
    altText: 'Anima Christi prayer card',
    mimeType: 'application/pdf',
  },
}

// ---------------------------------------------------------------------------
// Course specs
// ---------------------------------------------------------------------------

const COURSE_SPECS: SeedCourseSpec[] = [
  // =========================================================================
  // Course 1: The Most Holy Eucharist
  // =========================================================================
  {
    title: 'The Most Holy Eucharist',
    slug: 'eucharist',
    tagline: 'Source and summit of the Christian life.',
    summary:
      'Three modules tracing what the Eucharist is, what it does, and how the Church has handed it down.',
    longDescription: p(
      'This course offers a careful introduction to the Eucharist as the centre of Catholic life — what the Church believes about the Real Presence, how the Mass enacts the once-for-all sacrifice of Calvary, and how the centuries of theological reflection have deepened our understanding without changing the substance of the mystery. Each unit pairs a short reading with a brief mastery check, and most carry recorded chant and supplementary readings for prayerful study.',
    ),
    coverPlateMediaKey: undefined,
    learnPoints: [
      'Distinguish transubstantiation from consubstantiation and symbolic readings.',
      'Trace the Eucharistic prayer from its Jewish berakah roots to the Roman Canon.',
      'Articulate why the Church understands the Mass as a true sacrifice.',
      'Recognise the four ends of the Mass: adoration, thanksgiving, propitiation, petition.',
      'Explain the development of Eucharistic adoration outside Mass.',
      'Identify key magisterial documents from Lateran IV through Sacramentum Caritatis.',
    ],
    order: 0,
    modules: [
      {
        title: 'What the Eucharist Is',
        slug: 'what-it-is',
        summary: 'Real presence, transubstantiation, and the sacramental sign.',
        units: [
          {
            title: 'The Real Presence',
            slug: 'real-presence',
            estimatedMinutes: 8,
            introduction: p(
              'The Catholic Church teaches that in the Eucharist, Jesus Christ is truly, really, and substantially present under the appearances of bread and wine.',
            ),
            reading: p(
              'From the earliest centuries the Church has held that the bread and wine of the Eucharist, after the consecration, are no longer bread and wine but the Body and Blood of Jesus Christ. This is not a metaphor or mere symbol — it is a substantial change. St. Justin Martyr around AD 150 already speaks of this teaching as common Christian belief: "Not as common bread or common drink do we receive these, but… we have been taught that the food which is blessed by the prayer of His word… is the flesh and blood of that Jesus who was made flesh." The doctrine is not a medieval invention; it is the apostolic faith.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'Catechism §1374',
                description: 'On the Real Presence as "the most exalted of the sacraments"',
                citation: 'CCC §1374',
                citationUrl: 'https://www.vatican.va/archive/ENG0015/__P40.HTM',
              },
              {
                kind: 'link',
                label: 'Sacramentum Caritatis',
                description: 'Pope Benedict XVI on the sacrament of charity',
                url: 'https://www.vatican.va/content/benedict-xvi/en/apost_exhortations/documents/hf_ben-xvi_exh_20070222_sacramentum-caritatis.html',
              },
              {
                kind: 'download',
                label: 'CCC §1324 — A Foundational Excerpt',
                description: 'Printable one-page reflection on the Eucharist as source and summit',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'Which best describes the Catholic teaching on the Eucharist?',
              options: [
                { text: 'A symbolic reminder of the Last Supper', isCorrect: false },
                {
                  text: 'A substantial change of bread and wine into the Body and Blood of Christ',
                  isCorrect: true,
                  affirmation: 'Yes — this is the doctrine of transubstantiation.',
                },
                { text: 'A subjective spiritual experience of grace', isCorrect: false },
              ],
            },
          },
          {
            title: 'Transubstantiation',
            slug: 'transubstantiation',
            estimatedMinutes: 10,
            introduction: p(
              'The Council of Trent gave the technical term — but the reality it describes is older than the word.',
            ),
            reading: p(
              'The word "transubstantiation" was coined in the high middle ages, gathering and clarifying centuries of teaching about how the bread and wine become the Body and Blood of Christ. The substance — what something most fundamentally is — changes, while the accidents (appearance, taste, weight) remain those of bread and wine. The Council of Trent (1551) defined this dogmatically: "by the consecration of the bread and wine, a conversion is made of the whole substance of the bread into the substance of the Body of Christ Our Lord, and of the whole substance of the wine into the substance of His Blood; which conversion is, by the holy Catholic Church, suitably and properly called transubstantiation."',
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'citation',
                label: 'Council of Trent, Session 13',
                description: 'On the Real Presence and Transubstantiation, 1551',
                citation: 'Trent, Sess. 13, ch. 4',
              },
              {
                kind: 'link',
                label: 'Mysterium Fidei',
                description: 'Paul VI on the mystery of faith',
                url: 'https://www.vatican.va/content/paul-vi/en/encyclicals/documents/hf_p-vi_enc_03091965_mysterium.html',
              },
            ],
            masteryCheck: {
              prompt: 'In transubstantiation, what changes?',
              options: [
                { text: 'The accidents (appearance, taste)', isCorrect: false },
                {
                  text: 'The substance — what the bread and wine most fundamentally are',
                  isCorrect: true,
                  affirmation: 'Yes — substance changes; accidents remain.',
                },
                { text: 'Both substance and accidents', isCorrect: false },
              ],
            },
          },
          {
            title: 'The Sacramental Sign',
            slug: 'sacramental-sign',
            estimatedMinutes: 6,
            introduction: p(
              "The Eucharist is a sign that effects what it signifies — the Church's phrase for true sacramentality.",
            ),
            reading: p(
              'Sacraments are signs, but unlike ordinary signs they accomplish what they point to. A wedding ring is a sign of marriage; the Eucharist is the marriage of Christ and his Church, made present and operative. The bread and wine remain perceptible — that is the sign — but what they are has changed. The signs of bread and wine were not arbitrarily chosen: they signify nourishment and joy, the body sustained and the heart gladdened. The Eucharist nourishes the supernatural life and gladdens the soul not figuratively but in fact.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1131',
                description: 'On sacraments as efficacious signs',
                citation: 'CCC §1131',
              },
              {
                kind: 'download',
                label: 'Anima Christi',
                description: 'Traditional prayer of preparation and thanksgiving for Holy Communion',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'What distinguishes a sacramental sign from an ordinary sign?',
              options: [
                { text: 'An ordinary sign is more meaningful', isCorrect: false },
                {
                  text: 'A sacramental sign accomplishes what it signifies',
                  isCorrect: true,
                  affirmation: 'Yes — the sacrament effects the grace it symbolises.',
                },
                { text: 'Sacramental signs are purely decorative', isCorrect: false },
              ],
            },
          },
        ],
      },
      {
        title: 'What the Eucharist Does',
        slug: 'what-it-does',
        summary: "Sacrifice, communion, and the Church's memorial.",
        units: [
          {
            title: 'A True Sacrifice',
            slug: 'true-sacrifice',
            estimatedMinutes: 9,
            introduction: p(
              'The Mass is not a new sacrifice — it is the one sacrifice of Calvary made present.',
            ),
            reading: p(
              'The Letter to the Hebrews insists Christ "offered for all time a single sacrifice for sins." The Catholic Church does not contradict this — she affirms it. The Mass does not add to Calvary; it makes Calvary present in time. The same priest (Christ), the same victim (Christ), the same offering — only the manner differs. At Calvary the offering was bloody; in the Mass it is unbloody, sacramental, by the words and signs of the Eucharist. This is why the Church can call the Mass a true sacrifice without compromising the once-for-all character of the Cross.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'Hebrews 10:12',
                description: 'On the once-for-all sacrifice of Christ',
                citation: 'Heb 10:12',
              },
              {
                kind: 'download',
                label: 'Anima Christi',
                description: 'Traditional prayer of preparation and thanksgiving for Holy Communion',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'How is the Mass related to the sacrifice of Calvary?',
              options: [
                { text: 'It is a separate, new sacrifice', isCorrect: false },
                {
                  text: 'It is the same sacrifice of Calvary made present sacramentally',
                  isCorrect: true,
                  affirmation: 'Yes — same priest, same victim, different manner.',
                },
                { text: 'It is only a memorial banquet, not a sacrifice', isCorrect: false },
              ],
            },
          },
          {
            title: 'Holy Communion',
            slug: 'holy-communion',
            estimatedMinutes: 7,
            introduction: p(
              'To receive the Eucharist is to be drawn into the life of the Trinity itself.',
            ),
            reading: p(
              'St. Thomas Aquinas calls the Eucharist "the sacrament of charity." To receive worthily — that is, in a state of grace and with right intention — is to receive Christ himself, and through Christ to be drawn into the life of the Trinity. The fruits the tradition names are forgiveness of venial sin, strengthening against future sin, deepening of charity, growth in union with Christ, and pledge of future glory. This is not a list of separate gifts: they are facets of one gift, which is communion with the living God.',
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'link',
                label: 'Ecclesia de Eucharistia',
                description: 'St. John Paul II on the Eucharist as the heart of the Church',
                url: 'https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_20030417_ecclesia_eucharistia.html',
              },
              {
                kind: 'citation',
                label: 'CCC §1391–1401',
                description: 'The fruits of Holy Communion',
                citation: 'CCC §1391–1401',
              },
            ],
            masteryCheck: {
              prompt: 'What does St. Thomas Aquinas call the Eucharist?',
              options: [
                { text: 'The sacrament of penance', isCorrect: false },
                {
                  text: 'The sacrament of charity',
                  isCorrect: true,
                  affirmation: 'Yes — because it unites us to the God who is love.',
                },
                { text: 'The sacrament of confirmation', isCorrect: false },
              ],
            },
          },
          {
            title: 'The Memorial of the Lord',
            slug: 'memorial',
            estimatedMinutes: 6,
            introduction: p(
              'The Greek word "anamnesis" carries weight no English word quite captures.',
            ),
            reading: p(
              'When Jesus said "Do this in memory of me," the Greek word translated as "memory" is anamnesis. It does not mean "remember" the way we remember a dead friend — a backwards mental reaching. Anamnesis means making-present, drawing the past event into now. The Passover Seder is anamnesis: every generation says, "When the Lord brought us out of Egypt." Christ\'s words at the Last Supper take that biblical pattern and bring it to its fulfilment. The Mass is anamnesis of Calvary: not a recollection but a real making-present.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1363',
                description: 'On anamnesis and the Eucharistic memorial',
                citation: 'CCC §1363',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §47',
                description: 'Vatican II on the Eucharist as memorial of the Paschal mystery',
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
            ],
            masteryCheck: {
              prompt: 'What does "anamnesis" mean in the context of the Mass?',
              options: [
                { text: 'A backwards mental recollection of a past event', isCorrect: false },
                {
                  text: 'A real making-present of the saving event',
                  isCorrect: true,
                  affirmation: 'Yes — the Mass draws Calvary into the present moment.',
                },
                { text: 'A purely symbolic gesture of remembrance', isCorrect: false },
              ],
            },
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Course 2: Mariology
  // =========================================================================
  {
    title: 'Mariology',
    slug: 'mariology',
    tagline: "The Church's teaching about the Mother of God.",
    summary:
      "The Church's teaching about Mary — what is held de fide, what is devotion, and how the two relate.",
    longDescription: p(
      'Mariology is often reduced to piety or dismissed as excess. This course traces the four Marian dogmas — Theotokos, Perpetual Virginity, Immaculate Conception, and Assumption — through their scriptural roots, conciliar definitions, and theological weight. The second module examines how private revelation, approved apparitions, and the great Marian prayers fit within the Catholic framework of faith and devotion. Each unit is a close reading of the tradition, with resources drawn from magisterial documents and the Catechism.',
    ),
    coverPlateMediaKey: undefined,
    learnPoints: [
      'Explain why "Theotokos" is a Christological rather than merely Mariological title.',
      'Distinguish the Immaculate Conception from the Virgin Birth.',
      "Identify what the dogma of the Assumption binds — and what it leaves open.",
      'Articulate the difference between public revelation and private revelation.',
      "Describe the grammar of Marian intercession and how it differs from worship.",
      'Locate the main Marian documents from Ephesus 431 through Lumen Gentium ch. 8.',
    ],
    order: 1,
    modules: [
      {
        title: 'The Four Marian Dogmas',
        slug: 'four-marian-dogmas',
        summary:
          'Mother of God, Perpetual Virginity, Immaculate Conception, Assumption — what each means and when it was defined.',
        units: [
          {
            title: 'Theotokos — God-bearer',
            slug: 'theotokos',
            estimatedMinutes: 8,
            introduction: p(
              "The Council of Ephesus in 431 defined Mary as Theotokos — and in doing so, it was guarding a truth about Christ, not primarily about Mary.",
            ),
            reading: p(
              "The Council of Ephesus in 431 affirmed that Mary is rightly called Theotokos — God-bearer. The point of the title is Christological: it guards the unity of Christ's person. To call Mary the Mother of God is to refuse to split the one Christ into two persons. Mariology, in its earliest dogma, exists for the sake of the Son.",
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §495',
                description: 'On Mary as Theotokos and the Christological significance of the title',
                citation: 'CCC §495',
                citationUrl: 'https://www.vatican.va/archive/ENG0015/__P16.HTM',
              },
              {
                kind: 'link',
                label: 'Lumen Gentium, ch. 8',
                description: "Vatican II's treatment of Mary in the mystery of Christ and the Church",
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19641121_lumen-gentium_en.html#Chapter_VIII',
              },
              {
                kind: 'download',
                label: 'Marian Prayer Card',
                description: 'Anima Christi and Memorare for devotional use',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: "Do you remember why the Church teaches Mary as Theotokos?",
              options: [
                {
                  text: 'To affirm that Christ is one person, fully divine and fully human.',
                  isCorrect: true,
                  affirmation: "Yes — the title guards Christ's unity.",
                },
                {
                  text: 'To elevate Mary above her Son.',
                  isCorrect: false,
                  affirmation:
                    'The title is Christological; it never separates Mary from her dependence on Christ.',
                },
                {
                  text: 'As a popular devotion without doctrinal weight.',
                  isCorrect: false,
                  affirmation:
                    'It is dogma — Ephesus 431 — and it is doctrinal in its core meaning.',
                },
              ],
            },
          },
          {
            title: 'The Immaculate Conception',
            slug: 'immaculate-conception',
            estimatedMinutes: 9,
            introduction: p(
              "Defined in 1854, the Immaculate Conception is about Mary's preparation for her vocation — and about the reach of Christ's saving grace.",
            ),
            reading: p(
              'Defined by Pius IX in 1854 in Ineffabilis Deus, the Immaculate Conception teaches that Mary, from the first instant of her conception, was preserved free from original sin by the merits of Christ. The dogma is about her being prepared for her vocation, not about a separate path to grace.',
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §491–492',
                description: 'On the Immaculate Conception and its relation to the Redemption',
                citation: 'CCC §491–492',
                citationUrl: 'https://www.vatican.va/archive/ENG0015/__P15.HTM',
              },
              {
                kind: 'link',
                label: 'Ineffabilis Deus (1854)',
                description:
                  "Pius IX's definition of the Immaculate Conception — full text at the Holy See",
                url: 'https://www.papalencyclicals.net/pius09/p9ineff.htm',
              },
              {
                kind: 'download',
                label: 'CCC Excerpt — Mary in the Plan of Salvation',
                description: 'Printable excerpt from CCC §484–507',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'What does the Immaculate Conception teach?',
              options: [
                {
                  text: 'That Mary was preserved from original sin from the moment of her conception, by the merits of Christ.',
                  isCorrect: true,
                  affirmation: "Yes — preservation in view of Christ's saving work.",
                },
                {
                  text: 'That Jesus was conceived without sin.',
                  isCorrect: false,
                  affirmation:
                    "That is a separate truth (Christ's sinlessness); the Immaculate Conception is about Mary.",
                },
                {
                  text: 'That Mary did not need redemption.',
                  isCorrect: false,
                  affirmation:
                    'The dogma explicitly includes "by the merits of Christ" — she was redeemed in a unique way.',
                },
              ],
            },
          },
          {
            title: 'The Assumption',
            slug: 'the-assumption',
            estimatedMinutes: 7,
            introduction: p(
              'Defined in 1950 by Pius XII, the Assumption is the final chapter of the doctrine of Mary — and a pledge of the resurrection for every member of Christ.',
            ),
            reading: p(
              'Defined by Pius XII in 1950 in Munificentissimus Deus, the Assumption teaches that Mary, at the end of her earthly life, was taken up body and soul into heavenly glory. The Church does not bind a position on whether she died before being assumed; the dogma is about the destination, not the mechanism.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §966',
                description: "On Mary's Assumption as the perfection of her participation in Christ's Resurrection",
                citation: 'CCC §966',
              },
              {
                kind: 'link',
                label: 'Munificentissimus Deus (1950)',
                description:
                  "Pius XII's definition of the Assumption — full text",
                url: 'https://www.vatican.va/content/pius-xii/en/apost_constitutions/documents/hf_p-xii_apc_19501101_munificentissimus-deus.html',
              },
              {
                kind: 'download',
                label: 'Marian Prayer Card',
                description: 'Anima Christi and Memorare for devotional use',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: "Do you remember what the Church requires Catholics to hold about whether Mary died before her Assumption?",
              options: [
                {
                  text: 'Nothing is binding either way — the dogma defines the Assumption itself, not the manner.',
                  isCorrect: true,
                  affirmation: 'Yes — Munificentissimus Deus left this open.',
                },
                {
                  text: 'Catholics must hold that she did not die.',
                  isCorrect: false,
                  affirmation:
                    'The dogma is silent on this; the Eastern tradition speaks of the Dormition.',
                },
                {
                  text: 'Catholics must hold that she died.',
                  isCorrect: false,
                  affirmation: 'The dogma is silent here; some saints have held either position.',
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Devotion and Discernment',
        slug: 'devotion-and-discernment',
        summary:
          'How the Church distinguishes private revelation from public revelation, and how Marian apparitions are weighed.',
        units: [
          {
            title: 'Private Revelation',
            slug: 'private-revelation',
            estimatedMinutes: 7,
            introduction: p(
              'Public revelation closed with the death of the last apostle. Private revelation — including Marian apparitions — never adds to that deposit, but it may confirm and illuminate it.',
            ),
            reading: p(
              'Public revelation closed with the death of the last apostle. Private revelation — including Marian apparitions — is never required for belief. When the Church approves an apparition, she does so cautiously, with the language of "worthy of belief," meaning the faithful may give it credence without obligation.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §67',
                description:
                  "On private revelations and their relationship to the deposit of faith",
                citation: 'CCC §67',
              },
              {
                kind: 'link',
                label: 'Redemptoris Mater',
                description:
                  "St. John Paul II on Mary's role in the mystery of Christ and the Church",
                url: 'https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_25031987_redemptoris-mater.html',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the difference between public and private revelation?',
              options: [
                {
                  text: 'Public revelation closed with the apostles; private revelation is never required for belief.',
                  isCorrect: true,
                  affirmation: "Yes — that's the Church's clear distinction.",
                },
                {
                  text: 'They are interchangeable categories.',
                  isCorrect: false,
                  affirmation: 'They are distinct: public is binding for faith, private is not.',
                },
                {
                  text: 'Private revelations supersede the apostolic deposit.',
                  isCorrect: false,
                  affirmation:
                    'The Church teaches the opposite — they may not contradict the deposit of faith.',
                },
              ],
            },
          },
          {
            title: 'Fatima and Lourdes',
            slug: 'fatima-and-lourdes',
            estimatedMinutes: 8,
            introduction: p(
              'Of the hundreds of reported Marian apparitions, only a handful have received formal Church approval. Fatima and Lourdes are the most widely received.',
            ),
            reading: p(
              "Two of the most widely received Marian apparitions — Lourdes in 1858 and Fatima in 1917 — have shaped popular devotion in profound ways. Both have been formally approved by the Church. Both leave individual reception, however, voluntary. The Church's role is to discern, not to compel.",
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'link',
                label: 'Marialis Cultus',
                description:
                  "Paul VI on the correct ordering of Marian devotion",
                url: 'https://www.vatican.va/content/paul-vi/en/apost_exhortations/documents/hf_p-vi_exh_19740202_marialis-cultus.html',
              },
              {
                kind: 'citation',
                label: 'CCC §484–507',
                description: 'Mary in the mystery of Christ — Catechism paragraphs on the Blessed Virgin',
                citation: 'CCC §484–507',
              },
              {
                kind: 'download',
                label: 'CCC Excerpt — Mary and the Gospel',
                description: 'Printable excerpt summarising key Marian paragraphs from the Catechism',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember what "approved" means for an apparition?',
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
                  affirmation:
                    'Approval is about doctrinal content and discernment, not detail-level history.',
                },
              ],
            },
          },
          {
            title: 'Marian Prayer',
            slug: 'marian-prayer',
            estimatedMinutes: 6,
            introduction: p(
              "The rosary, the Memorare, the Hail Mary — the Church's Marian patrimony is vast. What holds it all together is a single grammar: intercession.",
            ),
            reading: p(
              "The rosary, the Memorare, the Hail Mary — these are the Church's shared Marian patrimony. The grammar is always intercessory: we ask Mary to pray with us and for us, never to take the place of her Son. Devotion that obscures Christ is not Catholic devotion.",
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §2673–2679',
                description: "On prayer to Mary and the Hail Mary's theology",
                citation: 'CCC §2673–2679',
              },
              {
                kind: 'link',
                label: 'Rosarium Virginis Mariae',
                description:
                  "St. John Paul II's apostolic letter on the Rosary as a school of contemplation",
                url: 'https://www.vatican.va/content/john-paul-ii/en/apost_letters/2002/documents/hf_jp-ii_apl_20021016_rosarium-virginis-mariae.html',
              },
              {
                kind: 'download',
                label: 'Marian Prayer Card',
                description: 'Anima Christi and Memorare for devotional use',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the basic grammar of Marian prayer?',
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
          },
        ],
      },
    ],
  },

  // =========================================================================
  // Course 3: The Liturgical Year
  // =========================================================================
  {
    title: 'The Liturgical Year',
    slug: 'liturgical-year',
    tagline: 'Sacred time and the Paschal mystery.',
    summary:
      'The seasons and feasts that shape Catholic time — Advent, Christmas, Lent, Easter, Ordinary Time — and what each is for.',
    longDescription: p(
      'The liturgical year is not a religious calendar bolted onto ordinary time — it is a yearly immersion in the mystery of Christ from Advent expectation through Pentecost and the long season of Ordinary Time. This course traces the structure and theology of the Catholic year: how the Paschal mystery shapes the whole, what Advent holds together that a mere countdown does not, how Lent and the Triduum are one unified movement toward Easter, and what the Church means when she says that Easter is fifty days, not one.',
    ),
    coverPlateMediaKey: undefined,
    learnPoints: [
      'Identify the Paschal mystery as the heart around which the liturgical year turns.',
      'Distinguish the two horizons Advent holds together: past expectation and future hope.',
      'Explain why the Triduum is one liturgy in three movements, not three separate rites.',
      'Articulate why Eastertide is longer than Lent and what this structure communicates.',
      'Describe the purpose of Ordinary Time and the Sundays of the year.',
      'Recognise how the calendar of saints relates to the feasts of Christ.',
    ],
    order: 2,
    modules: [
      {
        title: 'Advent and Christmas',
        slug: 'advent-and-christmas',
        summary: 'The first season of the year — preparation, expectation, and the feast of the Incarnation.',
        units: [
          {
            title: 'Advent as Preparation',
            slug: 'advent-as-preparation',
            estimatedMinutes: 7,
            introduction: p(
              'Advent has two horizons. It looks back to the centuries of Israel\'s expectation, and forward to Christ\'s return.',
            ),
            reading: p(
              'Advent has two horizons. It looks back to the centuries of Israel\'s expectation, and forward to Christ\'s return. The season is not a countdown to Christmas — it is a re-formation of attention. Purple vestments, the Advent wreath, the O Antiphons in the final week: each is a way of waking up to the meaning of waiting.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1095',
                description: 'On Advent as a preparation for the Messiah\'s first and second coming',
                citation: 'CCC §1095',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §102',
                description: 'Vatican II on the liturgical year as an unfolding of the mystery of Christ',
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'Advent Chant — O Antiphons',
                description: 'Gregorian chant audio resource for the O Antiphons of Advent',
                mediaKey: 'chant',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the two horizons Advent holds together?',
              options: [
                {
                  text: "Israel's expectation of the Messiah, and the Church's expectation of Christ's return.",
                  isCorrect: true,
                  affirmation: 'Yes — the past and the future bound by the present feast.',
                },
                {
                  text: 'Just the four weeks before Christmas, no further meaning.',
                  isCorrect: false,
                  affirmation:
                    "The season carries both horizons — that's what makes it more than a countdown.",
                },
                {
                  text: 'Lent and Easter.',
                  isCorrect: false,
                  affirmation: 'Those are different seasons with different shapes.',
                },
              ],
            },
          },
          {
            title: 'The Incarnation',
            slug: 'incarnation',
            estimatedMinutes: 8,
            introduction: p(
              'Christmas celebrates not just the birth of a child but the entry of the eternal Word into history.',
            ),
            reading: p(
              "Christmas celebrates not just Christ's birth, but the doctrine that the Word became flesh. John 1 is the Christmas reading the early Church chose for itself. The Incarnation is not a one-time event — it is the fact that gives every other Christian doctrine its shape.",
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §461–463',
                description: 'On the Incarnation — the Word became flesh',
                citation: 'CCC §461–463',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §5–8',
                description: 'Vatican II on the liturgy as a celebration of the Paschal mystery',
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'CCC Excerpt — The Liturgical Year',
                description: 'Printable excerpt from CCC §1163–1178 on the liturgical year',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the prologue most associated with the Christmas liturgy?',
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
          },
          {
            title: 'Epiphany',
            slug: 'epiphany',
            estimatedMinutes: 6,
            introduction: p(
              'Epiphany is not just a feast of the Magi — it is the feast of manifestation itself, with three distinct events all called "epiphany" in the tradition.',
            ),
            reading: p(
              'Epiphany — January 6, or the nearest Sunday — celebrates the manifestation of Christ to the nations. The visit of the Magi is the iconic image, but the feast is also bound to the baptism of the Lord and the wedding at Cana. Three "epiphanies" of the same mystery: God revealed, God acknowledged, God provident.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1171',
                description: 'On the sanctoral cycle and how the calendar of saints relates to the feasts of Christ',
                citation: 'CCC §1171',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §108',
                description: 'Vatican II on the liturgical year and the feasts of the Lord',
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'Marian Prayer Card',
                description: 'Anima Christi and Memorare for devotional use',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the three traditional events celebrated under "Epiphany"?',
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
          },
        ],
      },
      {
        title: 'Lent and Easter',
        slug: 'lent-and-easter',
        summary: 'The forty days of conversion, the Triduum, and the great fifty days of Eastertide.',
        units: [
          {
            title: 'Lenten Disciplines',
            slug: 'lenten-disciplines',
            estimatedMinutes: 7,
            introduction: p(
              'Prayer, fasting, almsgiving — the three classical Lenten disciplines, drawn directly from the Sermon on the Mount.',
            ),
            reading: p(
              'Prayer, fasting, almsgiving — the three classical Lenten disciplines, drawn directly from the Sermon on the Mount. The point is not deprivation as virtue. It is conversion: a re-ordering of the affections so that what is given up, what is given away, and what is given attention to are all rightly tuned by Easter.',
            ),
            listenAudioMediaKey: 'chant',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1434–1439',
                description: 'On the interior penance and the forms of the penitential life',
                citation: 'CCC §1434–1439',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §109–110',
                description: "Vatican II on the spirit and practice of Lenten observance",
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'CCC Excerpt — The Liturgical Year',
                description: 'CCC §1163–1178 on sacred time and Lenten observance',
                mediaKey: 'cccExcerpt',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember the three classical Lenten disciplines?',
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
                  affirmation:
                    'Those are good disciplines, but the classical three are prayer, fasting, almsgiving.',
                },
              ],
            },
          },
          {
            title: 'The Paschal Triduum',
            slug: 'the-triduum',
            estimatedMinutes: 10,
            introduction: p(
              'Holy Thursday, Good Friday, and the Easter Vigil are not three separate liturgies but one liturgy in three movements.',
            ),
            reading: p(
              "Holy Thursday, Good Friday, and the Easter Vigil are not three separate liturgies but one liturgy in three movements. The bell at the Gloria of Holy Thursday silences until the Vigil; the altar is stripped; the Vigil opens with the new fire. The shape is ancient, and intentional.",
            ),
            watchVideoMediaKey: 'catechesis',
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1168–1169',
                description: 'On the Easter Vigil as the "mother of all holy vigils"',
                citation: 'CCC §1168–1169',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §5',
                description: 'Vatican II on the Paschal mystery as the heart of the liturgical year',
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'Anima Christi',
                description: 'Traditional prayer for meditation during the Triduum',
                mediaKey: 'prayerCard',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember whether the three days of the Triduum are one liturgy or three?',
              options: [
                {
                  text: 'One liturgy in three movements.',
                  isCorrect: true,
                  affirmation: "Yes — that's the Church's own description.",
                },
                {
                  text: 'Three independent liturgies.',
                  isCorrect: false,
                  affirmation:
                    'They are intentionally bound — there is no dismissal at the end of Holy Thursday.',
                },
                {
                  text: 'A series of devotions, not liturgies.',
                  isCorrect: false,
                  affirmation: 'The Triduum is the highest liturgical celebration of the year.',
                },
              ],
            },
          },
          {
            title: 'The Fifty Days',
            slug: 'eastertide',
            estimatedMinutes: 6,
            introduction: p(
              'Easter is a season, not a day. The Church deliberately gives joy a longer span than sorrow.',
            ),
            reading: p(
              'Easter is a season, not a day. The Church celebrates fifty days from Easter Sunday to Pentecost — longer than Lent, longer than Advent. The point is structural: joy is meant to be sustained, not glanced at. The Paschal candle stays lit through the whole season.',
            ),
            resources: [
              {
                kind: 'citation',
                label: 'CCC §1166–1167',
                description: 'On Sunday as the original feast day and the weekly Easter',
                citation: 'CCC §1166–1167',
              },
              {
                kind: 'link',
                label: 'Sacrosanctum Concilium §106',
                description: "Vatican II on Sunday as the primary day of the Church's liturgical celebration",
                url: 'https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19631204_sacrosanctum-concilium_en.html',
              },
              {
                kind: 'download',
                label: 'Easter Chant — Alleluia',
                description: 'Gregorian chant audio resource for Eastertide',
                mediaKey: 'chant',
              },
            ],
            masteryCheck: {
              prompt: 'Do you remember how long the Easter season lasts?',
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
          },
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Media upload helper
// ---------------------------------------------------------------------------

async function uploadMediaIfMissing(
  payload: Awaited<ReturnType<typeof getPayload>>,
  spec: SeedMediaSpec,
): Promise<Media> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: spec.filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) return existing.docs[0] as Media

  const filePath = resolve(process.cwd(), 'src/scripts/seed-assets', spec.filename)
  const fileBuffer = await readFile(filePath)

  const created = await payload.create({
    collection: 'media',
    data: { alt: spec.altText },
    file: {
      data: fileBuffer,
      mimetype: spec.mimeType,
      name: spec.filename,
      size: fileBuffer.byteLength,
    },
    overrideAccess: true,
  })
  return created as Media
}

// ---------------------------------------------------------------------------
// Course seeder
// ---------------------------------------------------------------------------

async function seedCourse(
  payload: Awaited<ReturnType<typeof getPayload>>,
  spec: SeedCourseSpec,
  mediaMap: Map<string, Media>,
): Promise<void> {
  const existing = await payload.find({
    collection: 'doctrineCourses',
    where: { slug: { equals: spec.slug } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    console.log(`  ↺ skipping ${spec.slug} (already seeded)`)
    return
  }

  const modules = spec.modules.map((m) => ({
    title: m.title,
    slug: m.slug,
    summary: m.summary,
    units: m.units.map((u) => {
      const watchMediaId = u.watchVideoMediaKey
        ? mediaMap.get(u.watchVideoMediaKey)?.id
        : undefined
      const listenMediaId = u.listenAudioMediaKey
        ? mediaMap.get(u.listenAudioMediaKey)?.id
        : undefined
      return {
        title: u.title,
        slug: u.slug,
        estimatedMinutes: u.estimatedMinutes,
        introduction: u.introduction as never,
        lanes: {
          reading: u.reading as never,
          watchVideo: watchMediaId ?? null,
          listenAudio: listenMediaId ?? null,
        },
        resources: u.resources.map((r) => {
          if (r.kind === 'download') {
            return {
              kind: 'download' as const,
              label: r.label,
              description: r.description,
              file: mediaMap.get(r.mediaKey)?.id ?? null,
            }
          }
          if (r.kind === 'link') {
            return {
              kind: 'link' as const,
              label: r.label,
              description: r.description,
              url: r.url,
            }
          }
          return {
            kind: 'citation' as const,
            label: r.label,
            description: r.description,
            citation: r.citation,
            citationUrl: r.citationUrl ?? null,
          }
        }),
        masteryCheck: u.masteryCheck
          ? {
              prompt: u.masteryCheck.prompt,
              options: u.masteryCheck.options,
            }
          : undefined,
      }
    }),
  }))

  await payload.create({
    collection: 'doctrineCourses',
    data: {
      title: spec.title,
      slug: spec.slug,
      tagline: spec.tagline,
      summary: spec.summary,
      longDescription: spec.longDescription as never,
      coverPlate: spec.coverPlateMediaKey ? mediaMap.get(spec.coverPlateMediaKey)?.id : null,
      learnPoints: spec.learnPoints.map((point) => ({ point })),
      order: spec.order,
      _isSample: true,
      _status: 'published',
      modules,
    },
    overrideAccess: true,
  })

  console.log(`  ✓ created ${spec.slug}`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const payload = await getPayload({ config })

  console.log('Uploading seed media…')
  const mediaMap = new Map<string, Media>()
  for (const [key, spec] of Object.entries(MEDIA_SPECS)) {
    const m = await uploadMediaIfMissing(payload, spec)
    mediaMap.set(key, m)
    console.log(`  ✓ ${key} → ${m.filename}`)
  }

  console.log('Seeding courses…')
  for (const spec of COURSE_SPECS) {
    await seedCourse(payload, spec, mediaMap)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
