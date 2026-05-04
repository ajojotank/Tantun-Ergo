import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
