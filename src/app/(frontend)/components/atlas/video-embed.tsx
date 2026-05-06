// src/app/(frontend)/components/atlas/video-embed.tsx
'use client'

import { useMemo } from 'react'

import { type MiracleVideo } from './types'

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
])
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])
const VIDEO_FILE_EXTS = ['.mp4', '.webm', '.mov', '.m4v']

type Resolved =
  | { kind: 'youtube'; embedUrl: string; originalUrl: string }
  | { kind: 'vimeo'; embedUrl: string; originalUrl: string }
  | { kind: 'file'; url: string }
  | { kind: 'unknown'; url: string }

function resolveVideo(rawUrl: string): Resolved {
  let parsed: URL | null = null
  try {
    parsed = new URL(rawUrl)
  } catch {
    parsed = null
  }
  if (!parsed) return { kind: 'unknown', url: rawUrl }

  const host = parsed.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(host)) {
    // youtu.be/<id> | youtube.com/watch?v=<id> | youtube.com/embed/<id>
    let id = ''
    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1).split('/')[0] ?? ''
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.split('/')[2] ?? ''
    } else {
      id = parsed.searchParams.get('v') ?? ''
    }
    if (id) {
      // youtube-nocookie.com is the privacy-enhanced host (no cookies until
      // the user actually plays the video).
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        originalUrl: rawUrl,
      }
    }
  }

  if (VIMEO_HOSTS.has(host)) {
    // vimeo.com/<id> | vimeo.com/<id>/<hash> | player.vimeo.com/video/<id>
    const segs = parsed.pathname.split('/').filter(Boolean)
    const id = segs[0] === 'video' ? segs[1] : segs[0]
    if (id && /^\d+$/.test(id)) {
      return {
        kind: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${id}?dnt=1`,
        originalUrl: rawUrl,
      }
    }
  }

  const lowerPath = parsed.pathname.toLowerCase()
  if (VIDEO_FILE_EXTS.some((ext) => lowerPath.endsWith(ext))) {
    return { kind: 'file', url: rawUrl }
  }

  return { kind: 'unknown', url: rawUrl }
}

/**
 * Render a single video from the miracle's `videos[]` array. YouTube and
 * Vimeo URLs use privacy-enhanced iframe embeds (no cookies until play);
 * direct video files use a native <video> player. Unrecognised URLs fall
 * back to a plain link so the editor's content is never silently dropped.
 */
export function VideoEmbed({ video }: { video: MiracleVideo }) {
  const resolved = useMemo(() => resolveVideo(video.url), [video.url])

  if (resolved.kind === 'youtube' || resolved.kind === 'vimeo') {
    return (
      <figure className="flex flex-col gap-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-ink">
          <iframe
            src={resolved.embedUrl}
            title={video.label ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            loading="lazy"
          />
        </div>
        <Caption video={video} />
      </figure>
    )
  }

  if (resolved.kind === 'file') {
    return (
      <figure className="flex flex-col gap-2">
        <video
          src={resolved.url}
          controls
          preload="metadata"
          className="aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-ink"
        />
        <Caption video={video} />
      </figure>
    )
  }

  // Unknown URL — render as a labelled link so we don't silently drop content.
  return (
    <p className="font-mono text-[11px] text-ink-soft">
      <a
        href={resolved.url}
        target="_blank"
        rel="noreferrer"
        className="text-ink underline-offset-2 hover:underline"
      >
        {video.label ?? resolved.url}
      </a>
      {video.attribution ? ` — ${video.attribution}` : ''}
    </p>
  )
}

function Caption({ video }: { video: MiracleVideo }) {
  if (!video.label && !video.attribution) return null
  return (
    <figcaption className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
      {video.label}
      {video.label && video.attribution ? ' · ' : ''}
      {video.attribution}
    </figcaption>
  )
}
