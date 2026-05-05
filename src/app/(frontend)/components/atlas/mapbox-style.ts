// src/app/(frontend)/components/atlas/mapbox-style.ts
//
// Mapbox Standard + dusk lightPreset settings, shared by every Map mount in
// the Atlas. Standard ships 3D buildings, landmark cathedrals, dynamic sky,
// and atmosphere — exactly what we want for the sacred-Caravaggio palette.
import type { MapRef } from 'react-map-gl/mapbox'

// Standard is the default for Mapbox accounts created on/after 2024 and
// supports globe projection + 3D buildings + landmark models + lightPreset.
export const STANDARD_STYLE = 'mapbox://styles/mapbox/standard'

// 'dusk' = golden hour with warm window glow on buildings + deep blue sky.
// 'night' is too dark; 'dawn' too cold; 'day' is plain. Locked at dusk.
export const LIGHT_PRESET: 'day' | 'dawn' | 'dusk' | 'night' = 'dusk'

// Resolve the active style URL: caller-supplied override, then env override,
// then Standard. The Settings global's `mapboxStyle` is the override path.
export function resolveStyleUrl(override: string | undefined | null): string {
  const trimmed = typeof override === 'string' ? override.trim() : ''
  if (trimmed) return trimmed
  if (process.env.MAPBOX_STYLE_URL) return process.env.MAPBOX_STYLE_URL
  return STANDARD_STYLE
}

// Set the dusk preset on a Map after style.load. Safe to call when the
// active style isn't Standard — setConfigProperty no-ops on basemap imports
// that don't exist (Mapbox prints a warning we can swallow silently). For
// custom styles, the caller is responsible for their own lighting.
export function applyDuskPreset(mapRef: MapRef | null): void {
  if (!mapRef) return
  const map = mapRef.getMap()
  // setConfigProperty(import-id, property, value). Standard's basemap import
  // id is "basemap"; custom styles may not have this import.
  try {
    map.setConfigProperty('basemap', 'lightPreset', LIGHT_PRESET)
  } catch {
    // No basemap import — non-Standard style. Caller can add their own.
  }
}
