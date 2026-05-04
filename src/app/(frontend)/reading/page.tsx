import Link from 'next/link'
import { draftMode } from 'next/headers'

import { LivePreviewListener } from '../components/live-preview-listener'
import { payload } from '@/lib/payload'

export const metadata = {
  title: 'Reading',
  description: 'Editorial articles and meditations from the Tantum Ergo studio.',
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function ReadingIndex() {
  const { isEnabled: isDraft } = await draftMode()

  const articles = await (await payload()).find({
    collection: 'articles',
    where: isDraft ? {} : { _status: { equals: 'published' } },
    draft: isDraft,
    limit: 50,
    sort: '-publishedAt',
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Reading room{isDraft ? ' · Draft preview' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        Articles &amp; meditations
      </h1>

      {articles.docs.length === 0 ? (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          Reading room opens soon.
        </p>
      ) : (
        <ul className="mt-16 divide-y divide-ink/10">
          {articles.docs.map((a) => (
            <li key={a.id} className="py-8">
              <Link href={`/reading/${a.slug}`} className="group block">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : ''}
                  {a._isSample ? ' · [Sample]' : ''}
                </p>
                <h2 className="mt-2 font-display text-3xl italic text-ink transition-colors group-hover:text-rubric-deep md:text-4xl">
                  {a.title}
                </h2>
                {a.excerpt ? (
                  <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-soft">
                    {a.excerpt}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}
