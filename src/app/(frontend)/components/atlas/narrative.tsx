// src/app/(frontend)/components/atlas/narrative.tsx
//
// Permissive Lexical walker — paragraphs and inline text only. Used by both
// MiracleDetail (the in-column miracle view on /atlas) and PilgrimageBook's
// chapter pane (the paged walker on /atlas/pilgrimages/{slug}). Anything
// that isn't a paragraph silently degrades to nothing.
//
// Switch to @payloadcms/richtext-lexical/react's <RichText/> when richer
// narrative formatting (headings, lists, links) is needed.

export function NarrativeBlock({ node }: { node: unknown }) {
  const root = (node as { root?: { children?: unknown[] } } | null)?.root
  const children = Array.isArray(root?.children) ? root!.children : []
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink lg:text-lg">
      {children.map((c, i) => (
        <Paragraph key={i} node={c} />
      ))}
    </div>
  )
}

function Paragraph({ node }: { node: unknown }) {
  const n = node as {
    type?: string
    children?: Array<{ text?: string; type?: string }>
  } | null
  if (!n || n.type !== 'paragraph') return null
  const text = (n.children ?? [])
    .map((c) => (typeof c?.text === 'string' ? c.text : ''))
    .join('')
  if (!text) return null
  return <p>{text}</p>
}
