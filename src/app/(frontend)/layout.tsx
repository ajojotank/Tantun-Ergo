import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ),
  title: {
    default: 'Tantum Ergo — Catholic formation, rendered in the round',
    template: '%s · Tantum Ergo',
  },
  description:
    'A digital Sistine Chapel. The Miracle Atlas, a doctrine LMS, and an AI catechist — held inside one reverent surface.',
  applicationName: 'Tantum Ergo',
  authors: [{ name: 'Tantum Ergo Studio' }],
  openGraph: {
    title: 'Tantum Ergo',
    description:
      'Catholic formation rendered in the round — Miracle Atlas, doctrine LMS, AI catechist.',
    type: 'website',
    locale: 'en_ZA',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf6ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a08' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
}

export default function FrontendRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-vellum text-ink selection:bg-rubric/20 selection:text-rubric">
        {children}
      </body>
    </html>
  )
}
