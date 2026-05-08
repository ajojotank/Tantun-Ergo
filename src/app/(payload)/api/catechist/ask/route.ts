import 'server-only'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'
import { z } from 'zod'

import { retrieveContext } from '../../../../../catechist/retrieve'
import {
  CATECHIST_SYSTEM_PROMPT,
  buildRetrievalQuery,
  buildUserMessage,
} from '../../../../../catechist/prompt'
import { catechistTools } from '../../../../../catechist/tools'
import { validateCitations, type ChunkLookup } from '../../../../../catechist/validate'
import { checkAndConsume } from '../../../../../catechist/rateLimit'

const BodySchema = z.object({
  conversationId: z.string().optional(),
  question: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  // 1. Auth
  const cookieHeader = req.headers.get('cookie') ?? ''
  const auth = await payload.auth({ headers: new Headers({ cookie: cookieHeader }) })
  const user = auth.user
  if (!user || user.collection !== 'members') {
    return new Response('Unauthorized', { status: 401 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(user as any)._verified) {
    return new Response('Email not verified', { status: 403 })
  }

  // 2. Parse body
  const json = await req.json()
  const body = BodySchema.parse(json)

  // 3. Rate limit
  const rate = await checkAndConsume(payload, user.id as number, 'ask')
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', used: rate.used, limit: rate.limit }),
      { status: 429, headers: { 'content-type': 'application/json' } },
    )
  }

  // 4. Load or create conversation
  let conversationId = body.conversationId
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  if (conversationId) {
    const conv = await payload.findByID({
      collection: 'catechist-conversations',
      id: conversationId,
      overrideAccess: false,
      user,
    })
    history = (conv.messages ?? []).slice(-4).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  } else {
    const created = await payload.create({
      collection: 'catechist-conversations',
      data: {
        member: user.id as number,
        title: body.question.slice(0, 60),
        messages: [],
        archived: false,
      },
      overrideAccess: false,
      user,
    })
    conversationId = String(created.id)
  }

  // 5. Build retrieval query (question + recent context)
  const retrievalQuery = buildRetrievalQuery(body.question, history)

  // 6. Retrieve
  const chunks = await retrieveContext(payload, { questionWithContext: retrievalQuery })

  // 7. Build prompt
  const userMessage = buildUserMessage({ chunks, history, question: body.question })

  // 8. Build chunk lookup for validation post-stream
  const lookup: ChunkLookup = {}
  for (const c of chunks) lookup[c.id] = { text: c.text, locator: c.locator }

  // 9. Stream
  // NOTE: In ai@6, toolCalls items use `toolName` (not `name`) and `input` (not `args`).
  // The defensive fallback below handles both to be safe.
  const result = streamText({
    model: google('gemini-2.5-pro'),
    system: CATECHIST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    tools: catechistTools,
    temperature: 0.3,
    onFinish: async ({ text, toolCalls }) => {
      // Per-tool locator derivation
      function deriveLocator(toolName: string, args: Record<string, unknown>): string {
        if (toolName === 'scriptureCard') {
          const { book, chapter, verseStart, verseEnd } = args as {
            book: string
            chapter: number
            verseStart: number
            verseEnd?: number
          }
          return `${book} ${chapter}:${verseStart}${verseEnd ? `–${verseEnd}` : ''}`
        }
        if (toolName === 'catechismCard') {
          const { catechism, paragraph } = args as { catechism: string; paragraph: string }
          return catechism === 'Roman Catechism' ? `Roman Catechism, ${paragraph}` : `CCC §${paragraph}`
        }
        if (toolName === 'sourcePreviewCard') {
          return (args.locator as string) ?? 'unknown'
        }
        return 'unknown'
      }

      const citations: { chunkId: string; locator: string; quotedSpan: string }[] = []
      for (const call of toolCalls ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = call as any
        // In ai@6: toolName, input. Fallback to older name/args shape defensively.
        const toolName: string = c.toolName ?? c.name ?? ''
        const args: Record<string, unknown> = c.input ?? c.args ?? {}
        if (toolName === 'citationTraceCard') continue
        if (typeof args.chunkId === 'string' && typeof args.quotedText === 'string') {
          citations.push({
            chunkId: args.chunkId,
            locator: deriveLocator(toolName, args),
            quotedSpan: args.quotedText,
          })
        }
      }

      const validation = validateCitations(citations, lookup)

      // Persist messages
      const conv = await payload.findByID({
        collection: 'catechist-conversations',
        id: conversationId!,
        overrideAccess: true,
      })
      const newMessages = [
        ...(conv.messages ?? []),
        {
          role: 'user' as const,
          content: body.question,
          citations: null,
          components: null,
          createdAt: new Date().toISOString(),
        },
        {
          role: 'assistant' as const,
          content: text,
          citations: validation.ok ? citations : [],
          components: toolCalls ?? [],
          createdAt: new Date().toISOString(),
        },
      ]
      await payload.update({
        collection: 'catechist-conversations',
        id: conversationId!,
        data: { messages: newMessages },
        overrideAccess: true,
      })

      // Log refusals
      if (!validation.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (payload.db as any).pool
        await p.query(
          `INSERT INTO tantum.catechist_refusals (member_id, question, retrieval_top3, reason) VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            body.question,
            JSON.stringify(
              chunks
                .slice(0, 3)
                .map((c) => ({ id: c.id, locator: c.locator, text: c.text.slice(0, 400) })),
            ),
            validation.reason,
          ],
        )
      }
    },
  })

  // In ai@6, StreamTextResult does NOT have toDataStreamResponse().
  // The available streaming response methods are:
  //   - toUIMessageStreamResponse() — streams the full UI message protocol (text + tool calls)
  //   - toTextStreamResponse()      — streams plain text only (no tool call data)
  //
  // We use toUIMessageStreamResponse() so Task 28's useChat() receives tool-call chunks.
  const response = result.toUIMessageStreamResponse()
  response.headers.set('x-conversation-id', conversationId!)
  return response
}
