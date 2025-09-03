import { useEffect, useRef, useState } from 'react'
import Map, { Marker, MapRef } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, Navigation2 } from 'lucide-react'
import { useMapStore } from '../../store/mapStore'
import { useUserStore } from '../../store/userStore'
import UserMarker from './UserMarker'
import EchoMarker from '../Echo/EchoMarker'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const { viewport, setViewport, markers } = useMapStore()
  const { currentUser, otherUsers } = useUserStore()
  const [isFollowing, setIsFollowing] = useState(true)
  const [showReturnButton, setShowReturnButton] = useState(false)

  // Fly to user position when first loaded
  useEffect(() => {
    if (currentUser?.position && mapRef.current && isFollowing) {
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 2000
      })
    }
  }, [currentUser?.position])

  // Return to my position
  const returnToMyPosition = () => {
    if (currentUser?.position && mapRef.current) {
      setIsFollowing(true)
      setShowReturnButton(false)
      
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 1500,
        essential: true
      })
    }
  }

  // Handle manual map movement
  const handleMapMove = (evt: any) => {
    setViewport(evt.viewState)
    
    // Detectează dacă user-ul a mișcat manual harta
    if (currentUser?.position) {
      const mapCenter = evt.viewState
      const userLng = currentUser.position.lng
      const userLat = currentUser.position.lat
      
      const distance = Math.sqrt(
        Math.pow(mapCenter.longitude - userLng, 2) + 
        Math.pow(mapCenter.latitude - userLat, 2)
      )
      
      // Dacă harta e la mai mult de 0.001 grade de user, arată butonul
      if (distance > 0.001) {
        setIsFollowing(false)
        setShowReturnButton(true)
      }
    }
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
        onMove={handleMapMove}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        pitchWithRotate={true}
        dragRotate={true}
        touchZoomRotate={true}
        touchPitch={true}
        attributionControl={false}
        maxZoom={20}
        minZoom={10}
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

      {/* Return to Position Button */}
      <AnimatePresence>
        {showReturnButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring",
              damping: 15,
              stiffness: 300
            }}
            onClick={returnToMyPosition}
            className="absolute bottom-32 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
              boxShadow: `
                0 10px 30px rgba(102, 126, 234, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.3)
              `
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: `
                0 15px 40px rgba(102, 126, 234, 0.7),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Icon with glow */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="relative"
            >
              <Navigation2 
                size={24} 
                className="text-white"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))'
                }}
              />
            </motion.div>

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-40 flex flex-col gap-2">
        {/* Zoom In */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            if (mapRef.current) {
              const currentZoom = mapRef.current.getZoom()
              mapRef.current.zoomTo(Math.min(currentZoom + 1, 20), {
                duration: 300
              })
            }
          }}
          className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/80 text-xl font-light flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          +
        </motion.button>

        {/* Zoom Out */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => {
            if (mapRef.current) {
              const currentZoom = mapRef.current.getZoom()
              mapRef.current.zoomTo(Math.max(currentZoom - 1, 10), {
                duration: 300
              })
            }
          }}
          className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/80 text-xl font-light flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          −
        </motion.button>
      </div>

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
