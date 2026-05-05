// src/app/(payload)/components/coordinate-picker.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import './coordinate-picker.scss'

import Map, {
  AttributionControl,
  Marker,
  NavigationControl,
  type MapRef,
  type MapMouseEvent,
} from 'react-map-gl/mapbox'
import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import { useRef, useState, useTransition } from 'react'

import { applyDuskPreset, STANDARD_STYLE } from '@/app/(frontend)/components/atlas/mapbox-style'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

type Coords = [number, number] // [lng, lat]

type Props = {
  path: string
  field: {
    label?: string | Record<string, string>
    required?: boolean
    admin?: { description?: string | Record<string, string> }
  }
}

export default function CoordinatePicker(props: Props) {
  const { path, field } = props
  const { value, setValue, errorMessage } = useField<Coords>({ path })
  const mapRef = useRef<MapRef | null>(null)

  // Read sibling locationName for the geocode button (Task 19 wires this).
  const locationName = useFormFields<string>(([fields]) => {
    const field = fields?.locationName
    if (process.env.NODE_ENV === 'development' && field === undefined) {
      // Schema-coupling guard: if locationName ever moves (renamed, nested
      // under a group, etc.) this picker would silently degrade to "no input
      // → Geocode disabled." Warn loudly in dev so the rename gets caught.
      console.warn(
        '[CoordinatePicker] sibling field "locationName" not found in form state. ' +
          'Did you rename or move it in the Miracles schema?',
      )
    }
    const v = field?.value
    return typeof v === 'string' ? v : ''
  })

  const hasValue = Array.isArray(value) && value.length === 2
  const lng = hasValue ? value[0] : null
  const lat = hasValue ? value[1] : null

  function handleMapClick(e: MapMouseEvent) {
    const { lng: clickedLng, lat: clickedLat } = e.lngLat
    setValue([clickedLng, clickedLat])
  }

  function handleMarkerDragEnd(e: { lngLat: { lng: number; lat: number } }) {
    setValue([e.lngLat.lng, e.lngLat.lat])
  }

  function handleClear() {
    setValue(null)
  }

  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleGeocode() {
    setGeocodeError(null)
    if (!TOKEN) {
      setGeocodeError('Mapbox token missing.')
      return
    }
    if (!locationName.trim()) {
      setGeocodeError('Type a location name above first.')
      return
    }
    startTransition(async () => {
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName.trim())}.json`,
        )
        url.searchParams.set('access_token', TOKEN)
        url.searchParams.set('limit', '1')
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
        const json = (await res.json()) as { features?: Array<{ center?: [number, number] }> }
        const center = json.features?.[0]?.center
        if (!Array.isArray(center) || center.length !== 2) {
          setGeocodeError(`No match for "${locationName}".`)
          return
        }
        setValue([center[0], center[1]])
        mapRef.current?.flyTo({
          center,
          zoom: 5,
          duration: 1200,
        })
      } catch (err) {
        setGeocodeError(err instanceof Error ? err.message : 'Geocoding failed.')
      }
    })
  }

  const labelText =
    typeof field.label === 'string'
      ? field.label
      : (field.label?.['en'] ?? 'Coordinates')

  const description =
    typeof field.admin?.description === 'string'
      ? field.admin.description
      : (field.admin?.description?.['en'] ?? '')

  return (
    <div className="coordinate-picker">
      <FieldLabel
        label={labelText}
        required={field.required}
        path={path}
      />
      {description ? <p className="coordinate-picker__description">{description}</p> : null}

      <div className="coordinate-picker__map">
        {TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={TOKEN}
            initialViewState={
              hasValue
                ? { longitude: lng!, latitude: lat!, zoom: 5 }
                : { longitude: 12, latitude: 42, zoom: 1.6 }
            }
            mapStyle={STANDARD_STYLE}
            projection={{ name: 'globe' }}
            style={{ width: '100%', height: '320px' }}
            attributionControl={false}
            onLoad={() => applyDuskPreset(mapRef.current)}
            onClick={handleMapClick}
          >
            <AttributionControl compact position="bottom-left" />
            <NavigationControl position="bottom-right" showCompass={false} />
            {hasValue ? (
              <Marker
                longitude={lng!}
                latitude={lat!}
                anchor="center"
                draggable
                onDragEnd={handleMarkerDragEnd}
              >
                <span aria-hidden className="coordinate-picker__pin" />
              </Marker>
            ) : null}
          </Map>
        ) : (
          <div className="coordinate-picker__placeholder">
            Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to render the
            coordinate picker.
          </div>
        )}
      </div>

      <div className="coordinate-picker__readout">
        {hasValue ? (
          <span>
            Pin at <strong>{lng!.toFixed(4)}, {lat!.toFixed(4)}</strong>{' '}
            (longitude, latitude)
          </span>
        ) : (
          <span className="coordinate-picker__readout--empty">
            Click on the map (or use Geocode below) to drop a pin.
          </span>
        )}
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="coordinate-picker__clear"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="coordinate-picker__geocode">
        <button
          type="button"
          onClick={handleGeocode}
          disabled={!locationName.trim() || isPending}
          className="coordinate-picker__geocode-button"
        >
          {isPending ? 'Geocoding…' : 'Geocode from location name'}
        </button>
        {locationName.trim() ? (
          <span className="coordinate-picker__readout--hint">
            Looks up &ldquo;{locationName.trim()}&rdquo; via Mapbox Geocoding.
          </span>
        ) : (
          <span className="coordinate-picker__readout--empty">
            Type a location name above to enable geocoding.
          </span>
        )}
        {geocodeError ? (
          <p className="coordinate-picker__error">{geocodeError}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="coordinate-picker__error">{errorMessage}</p>
      ) : null}
    </div>
  )
}
