import { useRef } from 'react'
import Map, { MapRef } from 'react-map-gl'
import { motion } from 'framer-motion'
import UserMarker from './UserMarker'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)

  // Test user hardcoded
  const testUser = {
    id: 'test-user',
    color: '#00D4FF',
    position: {
      lat: 44.4268,
      lng: 26.1025
    }
  }

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
        {/* Test User Marker */}
        <UserMarker
          user={testUser}
          isCurrentUser={true}
        />
      </Map>

      {/* Test info */}
      <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
        <div>Map loaded</div>
        <div>User: {testUser.id}</div>
        <div>Position: {testUser.position.lat}, {testUser.position.lng}</div>
      </div>
    </motion.div>
  )
}
