import { RichText } from '@payloadcms/richtext-lexical/react'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'

import { LivePreviewListener } from '../../components/live-preview-listener'
import { payload } from '@/lib/payload'

type Args = { params: Promise<{ slug: string }> }

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const res = await (await payload()).find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { pageType: { equals: 'reading-article' } }] },
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) return { title: 'Not found' }
  return {
    title: doc.title,
    description: doc.excerpt ?? undefined,
  }
}

export default async function ReadingArticle({ params }: Args) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const res = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { slug: { equals: slug } },
        { pageType: { equals: 'reading-article' } },
        ...(isDraft ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
    draft: isDraft,
    limit: 1,
  })
  const doc = res.docs[0]
  if (!doc) notFound()

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Reading{doc._isSample ? ' · [Sample]' : ''}{isDraft ? ' · Draft preview' : ''}
      </p>
      <h1 className="mt-3 font-display text-4xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {doc.title}
      </h1>
      {doc.publishedAt ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {new Date(doc.publishedAt).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      ) : null}
      {doc.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : null}
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </article>
  )
}
