// Quick-test seed for the Catechist.
//
// Creates (or updates) a single sample Source row containing a small
// hand-picked corpus of public-domain Catholic passages — enough to make
// the Catechist actually answerable without going through the full Studio
// upload + ingestion flow. Idempotent: re-running deletes prior chunks
// first so you can iterate freely.
//
// Run with:  pnpm seed:test-source
//
// Pre-requisites:
//   GOOGLE_AI_API_KEY in .env (Gemini embeddings + concept tagger)
//   pnpm seed:concepts already run (so chunks get tagged against the
//                                    curated 50-concept ontology)

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { ingestRawText } from '../catechist/ingest'

const SLUG = 'test-corpus'
const TITLE = 'Test corpus (sample passages)'

// A small, deliberately-mixed sample so a few canonical Catholic test
// questions can be answered with citation. All passages are public-domain.
// Format: chunker uses `bible` locator extraction → one chunk per verse.
const TEXT = `John 6:51 I am the living bread which came down from heaven. If any man eat of this bread, he shall live for ever; and the bread that I will give, is my flesh, for the life of the world.

John 6:53 Then Jesus said to them: Amen, amen I say unto you: Except you eat the flesh of the Son of man, and drink his blood, you shall not have life in you.

John 6:54 He that eateth my flesh, and drinketh my blood, hath everlasting life: and I will raise him up in the last day.

John 6:55 For my flesh is meat indeed: and my blood is drink indeed.

John 6:56 He that eateth my flesh, and drinketh my blood, abideth in me, and I in him.

Matthew 16:18 And I say to thee: That thou art Peter; and upon this rock I will build my church, and the gates of hell shall not prevail against it.

Matthew 16:19 And I will give to thee the keys of the kingdom of heaven. And whatsoever thou shalt bind upon earth, it shall be bound also in heaven: and whatsoever thou shalt loose on earth, it shall be loosed also in heaven.

John 20:21 He said therefore to them again: Peace be to you. As the Father hath sent me, I also send you.

John 20:22 When he had said this, he breathed on them; and he said to them: Receive ye the Holy Ghost.

John 20:23 Whose sins you shall forgive, they are forgiven them; and whose sins you shall retain, they are retained.

1 Cor 11:23 For I have received of the Lord that which also I delivered unto you, that the Lord Jesus, the same night in which he was betrayed, took bread.

1 Cor 11:24 And giving thanks, broke, and said: Take ye, and eat: this is my body, which shall be delivered for you: this do for the commemoration of me.

1 Cor 11:25 In like manner also the chalice, after he had supped, saying: This chalice is the new testament in my blood: this do ye, as often as you shall drink, for the commemoration of me.

1 Cor 11:26 For as often as you shall eat this bread, and drink the chalice, you shall shew the death of the Lord, until he come.

1 John 1:9 If we confess our sins, he is faithful and just, to forgive us our sins, and to cleanse us from all iniquity.
`

async function main() {
  const payload = await getPayload({ config })

  if (!process.env.GOOGLE_AI_API_KEY) {
    payload.logger.error(
      'GOOGLE_AI_API_KEY is not set — cannot embed test corpus. Add it to .env and re-run.',
    )
    process.exit(1)
  }

  // Idempotent: if a prior run created the source, wipe its chunks and
  // reuse the row so re-runs are cheap and predictable.
  const existing = await payload.find({
    collection: 'sources',
    where: { slug: { equals: SLUG } },
    limit: 1,
  })

  let sourceId: number
  if (existing.docs.length > 0) {
    sourceId = existing.docs[0].id as number
    payload.logger.info(`Test source already exists (id=${sourceId}); resetting chunks…`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = (payload.db as any).pool
    await pool.query(`DELETE FROM tantum.source_chunks WHERE source_id = $1`, [sourceId])
    await payload.update({
      collection: 'sources',
      id: sourceId,
      data: { ingestStatus: 'pending', chunkCount: 0, errorMessage: null },
    })
  } else {
    const created = await payload.create({
      collection: 'sources',
      data: {
        title: TITLE,
        slug: SLUG,
        author: 'Various (Douay-Rheims)',
        year: 1899,
        authorityTier: 'scripture',
        locatorFormat: 'bible',
        rightsNote: 'Public domain — Douay-Rheims Bible. Test corpus only.',
        isSample: true,
      },
      overrideAccess: true,
    })
    sourceId = created.id as number
    payload.logger.info(`Created test source (id=${sourceId})`)
  }

  payload.logger.info('Ingesting test corpus…')
  await ingestRawText(payload, sourceId, TEXT)

  payload.logger.info('')
  payload.logger.info('✓ Test corpus ready.')
  payload.logger.info('')
  payload.logger.info('Try asking the Catechist (at /catechist):')
  payload.logger.info('  • What is the Real Presence?')
  payload.logger.info('  • Why do Catholics confess to a priest?')
  payload.logger.info('  • What did Jesus say about the Eucharist?')
  payload.logger.info('  • What did Jesus give to Peter?')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
