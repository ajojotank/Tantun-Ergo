import 'server-only'
import { GoogleGenAI, Type } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY
let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!_client) {
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

const MODEL = 'gemini-2.5-flash'

export interface ConceptDef {
  id: number
  name: string
  definition: string
  synonyms: string[]
}

export interface TaggedChunk {
  chunkId: string
  conceptIds: number[]
  confidences: number[]
}

export async function tagChunks(
  chunks: Array<{ id: string; text: string }>,
  concepts: ConceptDef[],
): Promise<TaggedChunk[]> {
  if (chunks.length === 0) return []

  const conceptList = concepts
    .map(
      (c) =>
        `${c.id}: ${c.name} — ${c.definition}${c.synonyms.length ? ' (also: ' + c.synonyms.join(', ') + ')' : ''}`,
    )
    .join('\n')

  const systemPrompt = `You are a Catholic doctrinal classifier. Given a passage, identify which concepts from the list it discusses.

CONCEPT LIST:
${conceptList}

For each input passage, return up to 7 concept IDs that the passage substantively discusses, with a confidence (0-1) for each. Skip concepts that are merely mentioned in passing. If no concept clearly applies, return empty arrays.`

  const userMessage = chunks.map((c, i) => `[${i}] ${c.text}`).join('\n\n---\n\n')

  const result = await client().models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagged: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.NUMBER },
                conceptIds: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                confidences: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              },
              required: ['index', 'conceptIds', 'confidences'],
            },
          },
        },
        required: ['tagged'],
      },
      temperature: 0.1,
    },
  })

  // GenerateContentResponse.text is a native getter on the response class
  const text = result.text ?? ''
  const parsed = JSON.parse(text) as {
    tagged: Array<{ index: number; conceptIds: number[]; confidences: number[] }>
  }

  return parsed.tagged.map((t) => ({
    chunkId: chunks[t.index].id,
    conceptIds: t.conceptIds,
    confidences: t.confidences,
  }))
}
