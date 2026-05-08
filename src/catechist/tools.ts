import 'server-only'
import { tool } from 'ai'
import { z } from 'zod'

export const scriptureCardTool = tool({
  description:
    'Render an inline Scripture card when citing a Bible verse. Use whenever the answer cites Scripture.',
  inputSchema: z.object({
    book: z.string().describe('Book name, e.g. "John"'),
    chapter: z.number(),
    verseStart: z.number(),
    verseEnd: z.number().optional().describe('If quoting a range'),
    quotedText: z.string().describe('The verse text as cited'),
    chunkId: z.string().describe('The source_chunks.id this card derives from'),
  }),
})

export const catechismCardTool = tool({
  description:
    'Render an inline Catechism card when citing CCC §nnnn or a Roman Catechism passage.',
  inputSchema: z.object({
    catechism: z.enum(['CCC', 'Roman Catechism']),
    paragraph: z.string().describe('e.g. "1374" or "Part II, Q. 7"'),
    quotedText: z.string(),
    chunkId: z.string(),
  }),
})

export const sourcePreviewCardTool = tool({
  description:
    'Render an inline source preview card when citing a council, encyclical, Father, or Aquinas.',
  inputSchema: z.object({
    sourceTitle: z.string(),
    author: z.string().optional(),
    year: z.number().optional(),
    locator: z.string().describe('e.g. "Veritatis Splendor §54"'),
    quotedText: z.string(),
    chunkId: z.string(),
  }),
})

export const citationTraceCardTool = tool({
  description:
    'Render an inline citation lineage card when the chain matters (e.g. a Council interpreting Scripture, a Catechism citing a Father).',
  inputSchema: z.object({
    chain: z
      .array(z.object({ locator: z.string(), note: z.string().optional() }))
      .min(2)
      .describe('Ordered chain of locators, root to leaf'),
  }),
})

export const catechistTools = {
  scriptureCard: scriptureCardTool,
  catechismCard: catechismCardTool,
  sourcePreviewCard: sourcePreviewCardTool,
  citationTraceCard: citationTraceCardTool,
}

export type CatechistToolName = keyof typeof catechistTools
