// Uploads everything in ./media (the Payload local upload dir) to the
// Supabase Storage bucket configured via env. Idempotent: re-running just
// re-uploads, overwriting existing keys. Run AFTER filling S3 creds in .env.
//
//   pnpm migrate:media
//
// What it does:
//   1. Reads ./media/* from disk.
//   2. Uploads each file to s3://$SUPABASE_STORAGE_BUCKET/<filename> with
//      the right Content-Type so Supabase serves it correctly.
//   3. Reports what was uploaded.
//
// What it does NOT do:
//   - It doesn't touch payload.media DB rows. Payload's s3Storage adapter
//     looks files up by filename in the bucket at request time, so the
//     existing rows continue to work as long as the filenames match.
//   - It doesn't delete local files. After verifying the migration worked,
//     you can remove ./media yourself.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const MEDIA_DIR = path.resolve(process.cwd(), 'media')

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    console.error(`✗ ${name} is not set in .env`)
    process.exit(1)
  }
  return v
}

async function main() {
  // Lazy-load env so the file paths don't matter
  const { config } = await import('dotenv')
  config()

  const bucket = requireEnv('SUPABASE_STORAGE_BUCKET')
  const endpoint = requireEnv('SUPABASE_S3_ENDPOINT')
  const region = requireEnv('SUPABASE_S3_REGION')
  const accessKeyId = requireEnv('SUPABASE_S3_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('SUPABASE_S3_SECRET_ACCESS_KEY')

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })

  let entries: string[]
  try {
    entries = await readdir(MEDIA_DIR)
  } catch {
    console.log(`No ./media directory — nothing to migrate.`)
    return
  }

  if (entries.length === 0) {
    console.log(`./media is empty — nothing to migrate.`)
    return
  }

  console.log(`Migrating ${entries.length} file(s) to s3://${bucket}/`)

  let uploaded = 0
  let skipped = 0
  for (const name of entries) {
    const full = path.join(MEDIA_DIR, name)
    const st = await stat(full)
    if (!st.isFile()) {
      skipped++
      continue
    }
    const ext = path.extname(name).toLowerCase()
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream'
    const body = await readFile(full)
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: name,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    uploaded++
    console.log(`  ↑ ${name}  (${(st.size / 1024).toFixed(0)} KB, ${contentType})`)
  }

  console.log(`\nDone — ${uploaded} uploaded, ${skipped} skipped.`)
  console.log(`Test one in your browser:`)
  console.log(`  ${endpoint.replace('/storage/v1/s3', '')}/storage/v1/object/public/${bucket}/${entries[0]}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
