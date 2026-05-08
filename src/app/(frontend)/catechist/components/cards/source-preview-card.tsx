'use client'

interface Props {
  sourceTitle?: string
  author?: string
  year?: number
  locator?: string
  quotedText?: string
  chunkId?: string
}

export function SourcePreviewCard({ sourceTitle, author, year, locator, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-gilt pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        {sourceTitle}{author ? ` · ${author}` : ''}{year ? ` · ${year}` : ''}
      </figcaption>
      <blockquote className="mt-1 font-display italic text-ink leading-relaxed">
        {quotedText}
      </blockquote>
      <p className="mt-1 font-mono text-[10px] text-ink-soft">{locator}</p>
    </figure>
  )
}
