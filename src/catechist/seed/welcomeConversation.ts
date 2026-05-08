import 'server-only'
import type { Payload } from 'payload'

export async function ensureWelcomeConversation(payload: Payload, memberId: number): Promise<string | null> {
  const existing = await payload.find({
    collection: 'catechist-conversations',
    where: { member: { equals: memberId } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return null

  const created = await payload.create({
    collection: 'catechist-conversations',
    data: {
      member: memberId,
      title: 'What is Tantum Ergo?',
      archived: false,
      messages: [
        {
          role: 'user',
          content: 'What is Tantum Ergo? What is the Catechist for?',
          createdAt: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: `Tantum Ergo is a digital home for Catholic formation — a Miracle Atlas, a Doctrine library, and this Catechist.

I am bound to citation. Every claim I make rests on a passage I can show you, drawn from Scripture, the Catechism, the Councils, the Encyclicals, the Fathers, and the Doctors of the Church.[^1]

You can ask me about doctrine, Scripture, prayer, the sacraments, moral life, the saints. I will answer plainly, with footnotes, in the depth your question warrants.

When the sources I have read do not let me answer with confidence, I will refuse and show you what I did find. I will never invent.[^2]

Ask me anything.`,
          citations: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { chunkId: 'welcome-placeholder-1', locator: 'CCC §80', quotedSpan: 'Sacred Tradition and Sacred Scripture' } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { chunkId: 'welcome-placeholder-2', locator: 'About this Catechist', quotedSpan: 'I will never invent.' } as any,
          ],
          components: [],
          createdAt: new Date().toISOString(),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
    },
    overrideAccess: true,
  })

  return String(created.id)
}
