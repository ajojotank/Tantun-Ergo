// src/app/(frontend)/manifesto/page.tsx
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payload } from '@/lib/payload'

export const metadata = { title: 'Manifesto' }

export default async function Manifesto() {
  const res = await (await payload()).find({
    collection: 'pages',
    where: {
      and: [
        { pageType: { equals: 'manifesto' } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
  })
  const doc = res.docs[0]

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        Manifesto
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-7xl">
        {doc?.title ?? 'A digital Sistine Chapel.'}
      </h1>
      {doc?.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          The manifesto is being written.
        </p>
      )}
    </main>
  )
}
