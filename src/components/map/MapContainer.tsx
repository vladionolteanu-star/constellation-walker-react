import { useRef } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl'
import { motion } from 'framer-motion'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)

  const viewport = {
    longitude: 26.1025,
    latitude: 44.4268,
    zoom: 15,
    pitch: 60,
    bearing: 0
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="absolute inset-0"
    >
      <Map
        ref={mapRef}
        {...viewport}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        attributionControl={false}
        maxZoom={20}
        minZoom={10}
      >
        {/* Marker foarte simplu - doar să testăm */}
        <Marker
          longitude={26.1025}
          latitude={44.4268}
          anchor="center"
        >
          <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg">
          </div>
        </Marker>

        {/* Al doilea marker să fii sigur */}
        <Marker
          longitude={26.1035}
          latitude={44.4278}
          anchor="center"
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg">
          </div>
        </Marker>

        {/* Al treilea marker cu text */}
        <Marker
          longitude={26.1015}
          latitude={44.4258}
          anchor="center"
        >
          <div className="bg-yellow-400 text-black px-2 py-1 rounded text-sm font-bold">
            TEST
          </div>
        </Marker>
      </Map>

      {/* Test info */}
      <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
        <div>Map loaded ✅</div>
        <div>Markers: 3 added</div>
        <div>Coords: 44.4268, 26.1025</div>
        <div>Zoom: {viewport.zoom}</div>
      </div>
    </motion.div>
  )
}
