import { RichText } from '@payloadcms/richtext-lexical/react'
import { draftMode } from 'next/headers'

import { LivePreviewListener } from '../components/live-preview-listener'
import { payload } from '@/lib/payload'

export const metadata = { title: 'Credits' }

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function Credits() {
  const { isEnabled: isDraft } = await draftMode()
  const doc = await (await payload()).findGlobal({
    slug: 'credits-page',
    draft: isDraft,
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 md:py-28">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-rubric">
        {doc.eyebrow ?? 'Credits'}{isDraft ? ' · Draft preview' : ''}
      </p>
      <h1 className="mt-3 font-display text-5xl italic leading-tight tracking-tight text-ink md:text-6xl">
        {doc.title ?? 'Sources & ecclesial review'}
      </h1>
      {doc.body ? (
        <div className="mt-12 max-w-[65ch] space-y-6 text-lg leading-relaxed text-ink">
          <RichText data={doc.body as never} />
        </div>
      ) : (
        <p className="mt-16 font-display text-2xl italic text-ink-soft">
          Acknowledgements pending.
        </p>
      )}
      {isDraft ? <LivePreviewListener serverURL={SERVER_URL} /> : null}
    </main>
  )
}
