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
import { useRef, useState } from 'react'

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
    const v = fields?.locationName?.value
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
    setValue(null as unknown as Coords)
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
        {/* Geocode button lands in Task 19 */}
        <span className="coordinate-picker__readout--empty">
          {locationName
            ? `Location name: "${locationName}"`
            : 'Type a location name above, then a Geocode button will appear here.'}
        </span>
      </div>

      {errorMessage ? (
        <p className="coordinate-picker__error">{errorMessage}</p>
      ) : null}
    </div>
  )
}
