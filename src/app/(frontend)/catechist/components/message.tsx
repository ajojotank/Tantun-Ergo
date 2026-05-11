'use client'

import { useId } from 'react'

import { ScriptureCard } from './cards/scripture-card'
import { CatechismCard } from './cards/catechism-card'
import { SourcePreviewCard } from './cards/source-preview-card'
import { CitationTraceCard } from './cards/citation-trace-card'
import { Footnotes } from './footnotes'

export interface StoredCitation {
  chunkId: string
  locator: string
  quotedSpan: string
}

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations: StoredCitation[]
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  citations: StoredCitation[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolInvocations: any[]
}

// Render the prose, parsing inline [^N] footnote markers into clickable
// superscript links that scroll to the matching footnote anchor.
function ProseWithFootnotes({
  content,
  idMarker,
  maxN,
}: {
  content: string
  idMarker: string
  maxN: number
}) {
  // Split on [^N] markers, keeping the markers as separate items.
  const parts = content.split(/(\[\^\d+\])/g)
  return (
    <div className="font-display text-lg leading-relaxed text-ink whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = /^\[\^(\d+)\]$/.exec(part)
        if (!m) return <span key={i}>{part}</span>
        const n = Number(m[1])
        if (!Number.isFinite(n) || n < 1 || n > maxN) {
          return <span key={i}>{part}</span>
        }
        return (
          <a
            key={i}
            href={`#footnote-${idMarker}-${n}`}
            className="inline-block mx-0.5 align-super text-[10px] font-mono text-rubric hover:bg-rubric/10 rounded px-1 no-underline transition-colors"
            aria-label={`Footnote ${n}`}
          >
            {n}
          </a>
        )
      })}
    </div>
  )
}

export function Message({ role, content, citations, toolInvocations }: Props) {
  const idMarker = useId().replace(/:/g, '')

  if (role === 'user') {
    return (
      <div className="my-10">
        <p className="font-display italic text-2xl text-ink leading-snug pl-6 border-l-2 border-rubric">
          {content}
        </p>
      </div>
    )
  }

  return (
    <div className="my-6">
      <ProseWithFootnotes content={content} idMarker={idMarker} maxN={citations.length} />

      <div className="mt-6 space-y-3">
        {toolInvocations.map((inv, i) => {
          // ToolUIPart<TOOLS>: type is `tool-${NAME}`, args live on `input`.
          // DynamicToolUIPart: type is 'dynamic-tool', toolName + input separate.
          const toolName: string =
            inv.type === 'dynamic-tool'
              ? (inv.toolName ?? '')
              : (inv.type as string).replace(/^tool-/, '')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const args: Record<string, any> = inv.input ?? {}
          if (toolName === 'scriptureCard') return <ScriptureCard key={i} {...args} />
          if (toolName === 'catechismCard') return <CatechismCard key={i} {...args} />
          if (toolName === 'sourcePreviewCard') return <SourcePreviewCard key={i} {...args} />
          if (toolName === 'citationTraceCard') return <CitationTraceCard key={i} {...args} />
          return null
        })}
      </div>

      {citations.length > 0 && <Footnotes citations={citations} idMarker={idMarker} />}

      <hr className="border-parchment mt-8" />
    </div>
  )
}
