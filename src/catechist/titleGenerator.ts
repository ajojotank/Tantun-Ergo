import { GoogleGenAI } from '@google/genai'

// Summarize a Catechist question into a short conversation title (3-6 words)
// so the sidebar reads like a list of topics, not a list of "New inquiry"s.
// Returns a safe fallback (first 60 chars of the question) if Gemini fails
// or returns empty — the function never throws.

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
const MAX_LEN = 80

function safeFallback(question: string): string {
  const trimmed = question.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'New inquiry'
  return trimmed.length > 60 ? trimmed.slice(0, 60).trimEnd() + '…' : trimmed
}

export async function generateTitle(question: string): Promise<string> {
  const trimmed = question.trim()
  if (!trimmed) return 'New inquiry'

  try {
    const result = await client().models.generateContent({
      model: MODEL,
      contents: `Summarize the following Catholic-formation question as a concise conversation title.

Rules:
- 3 to 6 words
- Sentence case (first word capitalized, rest lowercase except proper nouns)
- No surrounding quotes
- No trailing punctuation
- Capture the doctrinal subject, not the question form. e.g. "What is the Real Presence?" → "The Real Presence"; "Why do Catholics confess to a priest?" → "Confession to a priest"

Return only the title, nothing else.

Question: ${trimmed}`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 32,
      },
    })

    const raw = (result.text ?? '').trim()
    if (!raw) return safeFallback(question)

    // Strip surrounding quotes/curly-quotes if the model added them.
    const cleaned = raw
      .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleaned) return safeFallback(question)
    return cleaned.length > MAX_LEN ? cleaned.slice(0, MAX_LEN).trimEnd() + '…' : cleaned
  } catch {
    return safeFallback(question)
  }
}
