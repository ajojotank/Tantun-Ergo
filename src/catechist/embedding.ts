import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GOOGLE_AI_API_KEY

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!_client) {
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set')
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}

const MODEL = 'gemini-embedding-001'
const DIMS = 1536

export type EmbedTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY'
export const EMBED_DIMS: number = DIMS

export async function embed(texts: string[], taskType: EmbedTask): Promise<number[][]> {
  if (texts.length === 0) return []
  const result = await client().models.embedContent({
    model: MODEL,
    // ContentListUnion accepts string[] (PartUnion[])
    contents: texts,
    config: { outputDimensionality: DIMS, taskType },
  })
  // EmbedContentResponse.embeddings is ContentEmbedding[] where each has values?: number[]
  const embeddings = result.embeddings ?? []
  return embeddings.map((e) => e.values ?? [])
}

export async function embedOne(text: string, taskType: EmbedTask): Promise<number[]> {
  const [v] = await embed([text], taskType)
  return v
}
