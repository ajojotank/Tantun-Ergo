import 'server-only'
import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText } from 'ai'
import { z } from 'zod'

// Keep one env var across the project: GOOGLE_AI_API_KEY (also read by
// @google/genai for embeddings/concept-tagger). The AI SDK's default
// provider expects GOOGLE_GENERATIVE_AI_API_KEY, so build our own.
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
})

import { getMember } from '@/lib/auth'
import { payload as getPayloadInstance } from '@/lib/payload'

import { retrieveContext } from '../../../../../catechist/retrieve'
import {
  CATECHIST_SYSTEM_PROMPT,
  buildRetrievalQuery,
  buildUserMessage,
} from '../../../../../catechist/prompt'
import { catechistTools } from '../../../../../catechist/tools'
import { validateCitations, type ChunkLookup } from '../../../../../catechist/validate'
import { checkAndConsume, checkOnly } from '../../../../../catechist/rateLimit'
import { generateTitle } from '../../../../../catechist/titleGenerator'

const BodySchema = z.object({
  conversationId: z.string().optional(),
  question: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  // 1. Auth
  const user = await getMember()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const payload = await getPayloadInstance()

  // 2. Parse body
  const json = await req.json()
  const body = BodySchema.parse(json)

  // 3. Rate limit (check only — actual increment happens AFTER we confirm
  // we'll do real work, so failed no-corpus calls don't burn the user's budget).
  const rateCheck = await checkOnly(payload, user.id as number, 'ask')
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'rate_limited', used: rateCheck.used, limit: rateCheck.limit }),
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

  // 6a. Refuse early when there is no corpus to ground answers in. We do
  // NOT persist anything (the user's question or a ghost assistant reply)
  // — that produced confusing duplicate-message stacks during the period
  // before content team has uploaded sources. Surface a clear, actionable
  // error instead.
  if (chunks.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'no_corpus',
        message:
          "The Catechist has no sources ingested yet. An editor must upload corpus documents (Scripture, Catechism, etc.) in the Studio before answers can be grounded in citation.",
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  }

  // 6b. Now that we know we'll actually call the model, consume one
  // unit from the rate-limit window. Lazy-create the conversation here too
  // when the client didn't send a conversationId (avoids orphan empty
  // conversations from failed pre-flight checks).
  await checkAndConsume(payload, user.id as number, 'ask')

  // 7. Build prompt
  const userMessage = buildUserMessage({ chunks, history, question: body.question })

  // 8. Build chunk lookup for validation post-stream
  const lookup: ChunkLookup = {}
  for (const c of chunks) lookup[c.id] = { text: c.text, locator: c.locator }

  // 9. Stream
  // NOTE: In ai@6, toolCalls items use `toolName` (not `name`) and `input` (not `args`).
  // The defensive fallback below handles both to be safe.
  const result = streamText({
    // gemini-2.5-pro is paid-tier-only; the free key returns 429 with
    // limit: 0. Flash is free-tier eligible and works for the Catechist
    // prompt — quality is bounded by the citation contract, not model
    // size. Bump back to pro once billing is enabled.
    model: google('gemini-2.5-flash'),
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

      // Persist messages. Capture whether this was the first turn BEFORE
      // mutating — used below to decide if we should AI-generate a title.
      const conv = await payload.findByID({
        collection: 'catechist-conversations',
        id: conversationId!,
        overrideAccess: true,
      })
      const isFirstTurn = (conv.messages ?? []).length === 0
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

      // First turn: AI-generate a clean title from the question so the
      // sidebar reads as topics, not "New inquiry" rows. Failures are
      // swallowed inside generateTitle (returns a sensible fallback), so
      // this never blocks the conversation persistence above.
      if (isFirstTurn) {
        const aiTitle = await generateTitle(body.question)
        await payload.update({
          collection: 'catechist-conversations',
          id: conversationId!,
          data: { title: aiTitle },
          overrideAccess: true,
        })
      }

      // The sidebar (rendered by the catechist layout) needs to pick up
      // the new title + message count. Invalidate the layout's data — the
      // client's router.refresh() in onFinish then re-renders with fresh
      // data instead of a stale Server Component cache.
      revalidatePath('/catechist', 'layout')

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
