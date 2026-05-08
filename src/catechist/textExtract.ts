import 'server-only'
import pdfParse = require('pdf-parse')
import mammoth from 'mammoth'

export type ExtractFormat = 'pdf' | 'docx' | 'txt'

export interface ExtractResult {
  text: string
  pageCount?: number
}

export function detectFormat(filename: string): ExtractFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'txt'
  throw new Error(`Unsupported file type: ${filename} (supported: .pdf, .docx, .txt, .md)`)
}

export async function extractText(buf: Buffer, format: ExtractFormat): Promise<ExtractResult> {
  if (format === 'pdf') {
    const out = await pdfParse(buf)
    return { text: out.text, pageCount: out.numpages }
  }
  if (format === 'docx') {
    const out = await mammoth.extractRawText({ buffer: buf })
    return { text: out.value }
  }
  return { text: buf.toString('utf-8') }
}
