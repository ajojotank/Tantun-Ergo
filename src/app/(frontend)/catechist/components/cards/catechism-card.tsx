'use client'

interface Props {
  catechism?: 'CCC' | 'Roman Catechism'
  paragraph?: string
  quotedText?: string
  chunkId?: string
}

export function CatechismCard({ catechism, paragraph, quotedText }: Props) {
  return (
    <figure className="my-4 border-l-2 border-rubric pl-4 py-2 bg-parchment/20">
      <figcaption className="font-mono text-xs uppercase tracking-widest text-ink-soft">
        {catechism === 'Roman Catechism' ? 'Roman Catechism' : 'Catechism'} · {paragraph}
      </figcaption>
      <blockquote className="mt-1 font-display text-ink leading-relaxed">
        {quotedText}
      </blockquote>
    </figure>
  )
}
