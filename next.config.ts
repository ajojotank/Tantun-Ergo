import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Local dev — Payload serves uploaded media via /api/media/file/<filename>
      // and prefixes with NEXT_PUBLIC_SERVER_URL (http://localhost:3000 in dev).
      { protocol: 'http', hostname: 'localhost', port: '3000' },
    ],
    // Next 16 blocks `next/image` from optimizing private-IP upstreams by
    // default (SSRF protection). For local dev where Payload serves media
    // from localhost we need to opt back in. Only safe for private networks.
    dangerouslyAllowLocalIP: true,
  },
}

export default withPayload(nextConfig, {
  devBundleServerPackages: false,
})
