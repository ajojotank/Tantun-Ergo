'use client'

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

export function Message({ role, content, citations, toolInvocations }: Props) {
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
      <div className="font-display text-lg leading-relaxed text-ink whitespace-pre-wrap">
        {content}
      </div>

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

      {citations.length > 0 && <Footnotes citations={citations} />}

      <hr className="border-parchment mt-8" />
    </div>
  )
}
