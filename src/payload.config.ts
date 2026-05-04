import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import { initRawTables } from './db/init-raw-tables'
import { CreditsPage } from './globals/CreditsPage'
import { HomePage } from './globals/HomePage'
import { ManifestoPage } from './globals/ManifestoPage'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

const smtpHost = process.env.SMTP_HOST
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const smtpFromAddress = process.env.SMTP_FROM_ADDRESS || smtpUser || 'no-reply@tantumergo.co.za'
const smtpFromName = process.env.SMTP_FROM_NAME || 'Tantum Ergo'
const smtpReady =
  Boolean(smtpHost && smtpUser && smtpPass) &&
  !smtpPass?.startsWith('replace-with')

const email = smtpReady
  ? nodemailerAdapter({
      defaultFromAddress: smtpFromAddress,
      defaultFromName: smtpFromName,
      transportOptions: {
        host: smtpHost!,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser!, pass: smtpPass! },
      },
    })
  : undefined

// Supabase Storage (S3-compatible). When all four creds are present, uploads
// to the `media` collection route to Supabase. Otherwise we leave local disk
// as the backing store, which is fine for dev but should never ship to prod.
const s3Bucket = process.env.SUPABASE_STORAGE_BUCKET
const s3Endpoint = process.env.SUPABASE_S3_ENDPOINT
const s3Region = process.env.SUPABASE_S3_REGION
const s3AccessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
const s3SecretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY
const s3Ready = Boolean(s3Bucket && s3Endpoint && s3Region && s3AccessKeyId && s3SecretAccessKey)

const plugins = s3Ready
  ? [
      s3Storage({
        collections: { media: true },
        bucket: s3Bucket!,
        config: {
          endpoint: s3Endpoint!,
          region: s3Region!,
          credentials: {
            accessKeyId: s3AccessKeyId!,
            secretAccessKey: s3SecretAccessKey!,
          },
          // Supabase's S3 endpoint requires path-style addressing.
          forcePathStyle: true,
        },
      }),
    ]
  : []

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Tantum Ergo Studio',
      description: 'Editorial control room for the Tantum Ergo formation platform.',
      titleSuffix: ' — Tantum Ergo',
    },
    components: {
      graphics: {
        Logo: '/app/(payload)/components/StudioLogo',
        Icon: '/app/(payload)/components/StudioIcon',
      },
    },
  },
  collections: [Users, Media, Articles],
  globals: [Settings, HomePage, ManifestoPage, CreditsPage],
  plugins,
  cors: [serverURL].filter(Boolean),
  csrf: [serverURL].filter(Boolean),
  editor: lexicalEditor(),
  email,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    schemaName: 'payload',
  }),
  sharp,
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  upload: {
    limits: {
      fileSize: 25_000_000,
    },
  },
  onInit: async (payload) => {
    await initRawTables(payload)
  },
})
