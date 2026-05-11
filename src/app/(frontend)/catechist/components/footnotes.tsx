import type { StoredCitation } from './message'

// Each footnote gets an anchor id `footnote-{idMarker}-{n}` so the inline
// [^N] markers (rendered with matching href) can scroll the user straight
// to the source. The idMarker scopes to the message so multiple assistant
// messages on the same page don't collide.
export function Footnotes({
  citations,
  idMarker,
}: {
  citations: StoredCitation[]
  idMarker: string
}) {
  return (
    <ol className="mt-8 border-t border-parchment pt-4 font-mono text-[11px] text-ink-soft space-y-2 list-decimal list-inside">
      {citations.map((c, i) => {
        const n = i + 1
        return (
          <li key={i} id={`footnote-${idMarker}-${n}`} className="scroll-mt-20">
            <span className="text-ink font-semibold not-italic">{c.locator}</span>
            {c.quotedSpan ? (
              <span className="ml-2 italic font-display text-sm">
                &ldquo;
                {c.quotedSpan.slice(0, 200)}
                {c.quotedSpan.length > 200 ? '…' : ''}
                &rdquo;
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
