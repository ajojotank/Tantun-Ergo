// src/app/(frontend)/components/atlas/orbit.ts
//
// Slow-rotate the map's bearing around its current center after a flyTo
// settles — gives the cinematic "360 rotoscope" feel for selected miracles
// (atlas-shell.tsx) and for active chapters in a pilgrimage walker
// (pilgrimage-shell.tsx). Stops on any user map interaction (drag/wheel/
// pinch). Returns a handle so callers can stop it manually when the
// selection or chapter changes.
import { type MapRef } from 'react-map-gl/mapbox'

type MapboxMap = ReturnType<MapRef['getMap']>

export type OrbitHandle = {
  stop: () => void
}

export function startOrbit(
  map: MapboxMap,
  options: { durationMs?: number; onStop?: () => void } = {},
): OrbitHandle {
  const { durationMs = 60000, onStop } = options
  let active = true
  let rafId = 0
  const startTime = performance.now()
  const initialBearing = map.getBearing()

  function step(now: number) {
    if (!active) return
    const elapsed = now - startTime
    const bearing = (initialBearing + (elapsed / durationMs) * 360) % 360
    map.setBearing(bearing)
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)

  function onUserInteract() {
    stop()
  }

  // Mapbox surfaces drag/zoom/touch via these events. `dragstart` fires for
  // pan; `wheel`/`touchstart` cover zoom and pinch.
  map.on('dragstart', onUserInteract)
  map.on('wheel', onUserInteract)
  map.on('touchstart', onUserInteract)

  function stop() {
    if (!active) return
    active = false
    cancelAnimationFrame(rafId)
    map.off('dragstart', onUserInteract)
    map.off('wheel', onUserInteract)
    map.off('touchstart', onUserInteract)
    onStop?.()
  }

  return { stop }
}
