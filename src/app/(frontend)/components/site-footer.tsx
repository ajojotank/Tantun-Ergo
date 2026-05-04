// src/app/(frontend)/_components/site-footer.tsx
import Link from 'next/link'

import { payload } from '@/lib/payload'

const PLATFORM_LABEL: Record<string, string> = {
  x: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  email: 'Email',
}

export async function SiteFooter() {
  const settings = await (await payload()).findGlobal({ slug: 'settings' })

  return (
    <footer className="mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-6 border-t border-ink/10 pt-8 sm:flex-row sm:items-end">
        <div>
          <p className="font-display text-2xl italic text-ink">{settings.siteTitle}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            {settings.siteTagline}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {(settings.socials ?? []).map((s, i) => (
              <li key={i}>
                <Link
                  href={s.url}
                  className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft hover:text-ink"
                >
                  {PLATFORM_LABEL[s.platform] ?? s.platform}
                </Link>
              </li>
            ))}
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
            © {new Date().getFullYear()} · Tantum Ergo · ZA
          </p>
        </div>
      </div>
      <p className="mt-6 font-display text-sm italic text-ink-soft">
        Genitori, Genitoque · laus et jubilatio.
      </p>
    </footer>
  )
}
