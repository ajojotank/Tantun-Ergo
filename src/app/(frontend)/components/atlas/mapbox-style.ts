// src/app/(frontend)/components/atlas/mapbox-style.ts
//
// Mapbox Standard + dusk lightPreset settings, shared by every Map mount in
// the Atlas. Standard ships 3D buildings, landmark cathedrals, dynamic sky,
// and atmosphere — exactly what we want for the sacred-Caravaggio palette.
//
// This module runs in client bundles only. Server-side env resolution
// (process.env.MAPBOX_STYLE_URL) happens in the page components (atlas/page.tsx,
// atlas/pilgrimages/[slug]/page.tsx) which then pass the resolved URL down via
// the `styleUrl` prop. Don't reach into process.env from here — it would be
// dead code in the browser.
import type { MapRef } from 'react-map-gl/mapbox'

// Standard is the default for Mapbox accounts created on/after 2024 and
// supports globe projection + 3D buildings + landmark models + lightPreset.
export const STANDARD_STYLE = 'mapbox://styles/mapbox/standard'

// 'dusk' = golden hour with warm window glow on buildings + deep blue sky.
// 'night' is too dark; 'dawn' too cold; 'day' is plain. Locked at dusk.
export const LIGHT_PRESET: 'day' | 'dawn' | 'dusk' | 'night' = 'dusk'

// Resolve the active style URL: caller-supplied override (from server-resolved
// Settings.mapboxStyle or env), then STANDARD as the default.
export function resolveStyleUrl(override: string | undefined | null): string {
  const trimmed = typeof override === 'string' ? override.trim() : ''
  if (trimmed) return trimmed
  return STANDARD_STYLE
}

// Set the dusk preset on a Map after style.load. Standard's basemap import id
// is "basemap"; custom styles may not have this import — Mapbox throws when
// you try to setConfigProperty on a non-existent import id. We catch that and
// surface a dev-mode warning so a steward who pastes a custom style URL into
// Settings.mapboxStyle gets actionable feedback instead of a silent miss.
export function applyDuskPreset(mapRef: MapRef | null): void {
  if (!mapRef) return
  const map = mapRef.getMap()
  try {
    map.setConfigProperty('basemap', 'lightPreset', LIGHT_PRESET)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[atlas] dusk lightPreset skipped — active style has no `basemap` import. ' +
          'If you set a custom Settings.mapboxStyle, either add a Standard import to ' +
          'that style or set lighting directly in your style definition.',
        err,
      )
    }
  }
}
