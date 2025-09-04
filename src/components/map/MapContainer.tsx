import { useEffect, useRef, useState } from 'react'
import Map, { MapRef } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2 } from 'lucide-react'
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
  }, [currentUser?.position, isFollowing])

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

  const zoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.zoomTo(Math.min(currentZoom + 1, 20), {
        duration: 300
      })
    }
  }

  const zoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.zoomTo(Math.max(currentZoom - 1, 10), {
        duration: 300
      })
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
            className="fixed bottom-32 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 bg-gradient-to-br from-blue-500/80 to-purple-600/80 shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Navigation2 size={24} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="fixed top-1/2 -translate-y-1/2 right-4 z-40 flex flex-col gap-2">
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={zoomIn}
          className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/80 text-xl font-light flex items-center justify-center bg-black/20 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          +
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          onClick={zoomOut}
          className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/80 text-xl font-light flex items-center justify-center bg-black/20 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          −
        </motion.button>
      </div>

      {/* Overlay gradient */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.1) 70%)'
        }}
      />

      {/* Simple particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
