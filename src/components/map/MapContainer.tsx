import { useEffect, useRef } from 'react'
import Map, { Marker, MapRef } from 'react-map-gl'
import { motion } from 'framer-motion'
import { useMapStore } from '../../store/mapStore'
import { useUserStore } from '../../store/userStore'
import UserMarker from './UserMarker'
import ConstellationLines from './ConstellationLines'
import EchoMarker from '../Echo/EchoMarker'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { viewport, setViewport, markers } = useMapStore()
  const { currentUser, otherUsers } = useUserStore()

  // Fly to user position when first loaded
  useEffect(() => {
    if (currentUser?.position && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 2000
      })
    }
  }, [currentUser?.position])

  // Follow user position smoothly (but not every update)
  useEffect(() => {
    if (currentUser?.position && mapRef.current) {
      // Only follow occasionally to avoid constant movement
      if (Math.random() > 0.8) {
        mapRef.current.easeTo({
          center: [currentUser.position.lng, currentUser.position.lat],
          duration: 3000,
          essential: false
        })
      }
    }
  }, [currentUser?.position])

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
        onMove={(evt) => setViewport(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        pitchWithRotate={false}
        dragRotate={true}
        touchZoomRotate={false}
        attributionControl={false}
      >
        {/* Constellation Lines - Render first so they appear behind markers */}
        <ConstellationLines />

        {/* Current User Marker */}
        {currentUser?.position && (
          <UserMarker
            user={currentUser}
            isCurrentUser={true}
          />
        )}

        {/* Other Users */}
        {otherUsers.map(user => (
          user.position && (
            <UserMarker
              key={user.id}
              user={user}
              isCurrentUser={false}
            />
          )
        ))}

        {/* Echo Markers */}
        {markers.map(echo => (
          <EchoMarker key={echo.id} echo={echo} />
        ))}
      </Map>

      {/* Overlay gradient for noir effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.1) 70%),
            linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.2) 100%)
          `
        }}
      />
    </motion.div>
  )
}
