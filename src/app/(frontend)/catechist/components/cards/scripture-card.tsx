'use client'

interface Props {
  book?: string
  chapter?: number
  verseStart?: number
  verseEnd?: number
  quotedText?: string
  chunkId?: string
}

export function ScriptureCard({ book, chapter, verseStart, verseEnd, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-lapis pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        Scripture · {book} {chapter}:{verseStart}{verseEnd ? `–${verseEnd}` : ''}
      </figcaption>
      <blockquote className="mt-1 font-display italic text-ink leading-relaxed">
        {quotedText}
      </blockquote>
      <p className="mt-1 font-mono text-[10px] text-ink-soft">Douay-Rheims</p>
    </figure>
  )
}
