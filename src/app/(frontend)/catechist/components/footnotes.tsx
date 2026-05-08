import type { StoredCitation } from './message'

export function Footnotes({ citations }: { citations: StoredCitation[] }) {
  return (
    <ol className="mt-8 font-mono text-xs text-ink-soft space-y-1.5 list-decimal list-inside">
      {citations.map((c, i) => (
        <li key={i}>
          <span className="text-ink">{c.locator}</span>
          {c.quotedSpan && (
            <span className="ml-2 italic">
              {' '}
              &mdash; &ldquo;
              {c.quotedSpan.slice(0, 120)}
              {c.quotedSpan.length > 120 ? '…' : ''}
              &rdquo;
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
