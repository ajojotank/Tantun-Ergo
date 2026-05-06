import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google'

import { ScrollRubric } from './components/scroll-rubric'
import { SiteChromeHide } from './components/site-chrome-hide'
import { SiteFooter } from './components/site-footer'
import { SiteHeader } from './components/site-header'
import { payload } from '@/lib/payload'

import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})
const geist = Geist({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await (await payload()).findGlobal({ slug: 'settings' })
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    ),
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description: settings.siteTagline,
    applicationName: settings.siteTitle,
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteTagline ?? undefined,
      type: 'website',
      locale: 'en_ZA',
    },
    twitter: { card: 'summary_large_image' },
  }
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
      style={{ position: 'relative' }}
      suppressHydrationWarning
    >
      <body
        className="min-h-[100dvh] bg-vellum text-ink selection:bg-rubric/20 selection:text-rubric"
        style={{ position: 'relative' }}
      >
        <ScrollRubric />
        <SiteChromeHide>
          <SiteHeader />
        </SiteChromeHide>
        {children}
        <SiteChromeHide>
          <SiteFooter />
        </SiteChromeHide>
      </body>
    </html>
  )
}
