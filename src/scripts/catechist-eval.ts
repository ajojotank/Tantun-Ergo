import 'dotenv/config'
import { getPayload } from 'payload'
import { readFile } from 'fs/promises'
import path from 'path'
import config from '../payload.config'
import { retrieveContext } from '../catechist/retrieve'

interface EvalQuestion { q: string; expected: string[] }

function parseEvalSet(md: string): EvalQuestion[] {
  const questions: EvalQuestion[] = []
  for (const line of md.split('\n')) {
    const m = line.match(/^\s*\d+\.\s+(.+?)\s+\|\s+(.+?)\s+\|\s+(.+?)\s*$/)
    if (!m) continue
    const [, q, , slugs] = m
    questions.push({ q, expected: slugs.split(',').map((s) => s.trim()) })
  }
  return questions
}

async function main() {
  const payload = await getPayload({ config })
  const md = await readFile(path.resolve('docs/superpowers/handoffs/catechist-eval-set.md'), 'utf-8')
  const questions = parseEvalSet(md)
  payload.logger.info(`Loaded ${questions.length} eval questions.`)

  let passed = 0
  for (let i = 0; i < questions.length; i++) {
    const { q, expected } = questions[i]
    const top = await retrieveContext(payload, { questionWithContext: q, topK: 3 })
    const slugsInResult = new Set<string>()
    for (const c of top) {
      const src = await payload.findByID({ collection: 'sources', id: c.sourceId, depth: 0 })
      slugsInResult.add(src.slug)
    }
    const ok = expected.some((s) => slugsInResult.has(s))
    console.log(`${ok ? '✓' : '✗'} [${i + 1}] ${q}`)
    if (!ok) console.log(`     expected any of: ${expected.join(', ')}; got: ${[...slugsInResult].join(', ')}`)
    if (ok) passed += 1
  }

  const pct = (passed / questions.length) * 100
  console.log(`\n${passed}/${questions.length} (${pct.toFixed(0)}%) passed.`)
  process.exit(pct >= 80 ? 0 : 1)
}

main().catch((err) => { console.error(err); process.exit(1) })
