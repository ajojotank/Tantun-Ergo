import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { DoctrineModules } from './collections/DoctrineModules'
import { DoctrineTracks } from './collections/DoctrineTracks'
import { DoctrineUnits } from './collections/DoctrineUnits'
import { Media } from './collections/Media'
import { Members } from './collections/Members'
import { Miracles } from './collections/Miracles'
import { Pilgrimages } from './collections/Pilgrimages'
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

// Supabase Storage (S3-compatible). When all five creds are present, uploads
// to the `media` collection route to Supabase. Otherwise we leave local disk
// as the backing store, which is fine for dev but should never ship to prod.
const s3Bucket = process.env.SUPABASE_STORAGE_BUCKET
const s3Endpoint = process.env.SUPABASE_S3_ENDPOINT
const s3Region = process.env.SUPABASE_S3_REGION
const s3AccessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
const s3SecretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY
const s3Ready = Boolean(s3Bucket && s3Endpoint && s3Region && s3AccessKeyId && s3SecretAccessKey)

// Supabase Storage exposes two distinct endpoints for the same bucket:
//   • S3-compatible API:   {project}.supabase.co/storage/v1/s3/{bucket}/{key}
//     (used by the storage-s3 plugin for PUT/GET via AWS SDK; requires creds)
//   • Public object URL:   {project}.supabase.co/storage/v1/object/public/{bucket}/{key}
//     (anonymous-readable, browser-friendly, what we want in <img src>)
// The s3Storage plugin defaults to writing the S3-API URL into media.url —
// which a browser can't fetch. Derive the project base from the S3 endpoint
// and override `generateFileURL` so docs get the public URL.
const supabasePublicBase = s3Endpoint?.replace(/\/storage\/v1\/s3\/?$/, '')

const plugins = s3Ready
  ? [
      s3Storage({
        collections: {
          media: {
            // Bucket is public + Media.read access is open, so the canonical
            // Payload pattern (per plugin-cloud-storage README) is to bypass
            // the proxy and serve directly from the cloud host.
            disablePayloadAccessControl: true,
            // Map storage-s3's default S3-API URL into Supabase's public URL
            // shape. Payload calls this once per filename per size variant.
            generateFileURL: ({ filename }) =>
              `${supabasePublicBase}/storage/v1/object/public/${s3Bucket}/${filename}`,
          },
        },
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
  collections: [
    Users,
    Members,
    Media,
    Articles,
    Miracles,
    Pilgrimages,
    DoctrineTracks,
    DoctrineModules,
    DoctrineUnits,
  ],
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
