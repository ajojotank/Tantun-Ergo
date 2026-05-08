'use client'

import { SourcePreviewCard } from './cards/source-preview-card'

export interface RefusalChunk {
  id: string
  locator: string
  text: string
  authorityTier?: string
}

export function Refusal({ message, top3 }: { message: string; top3: RefusalChunk[] }) {
  return (
    <div className="my-6" aria-live="polite">
      <p className="font-display italic text-ink leading-relaxed">{message}</p>
      <div className="mt-4 space-y-3">
        {top3.map((c) => (
          <SourcePreviewCard
            key={c.id}
            sourceTitle={c.locator}
            quotedText={c.text.slice(0, 240) + (c.text.length > 240 ? '…' : '')}
            locator={c.locator}
            chunkId={c.id}
          />
        ))}
      </div>
    </div>
  )
}
