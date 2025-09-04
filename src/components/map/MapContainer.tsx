import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { MapRef, Marker, Source, Layer } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus, Minus, Maximize2, RotateCcw } from 'lucide-react'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

// Types
interface User {
  id: string
  color: string
  position: {
    lat: number
    lng: number
  }
  lastSeen?: Date
  isOnline?: boolean
}

interface EchoMarker {
  id: string
  position: {
    lat: number
    lng: number
  }
  color: string
  message?: string
  timestamp: Date
  intensity: number
}

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Viewport state
  const [viewport, setViewport] = useState({
    longitude: 26.1025,
    latitude: 44.4268,
    zoom: 15,
    pitch: 60,
    bearing: -17.6
  })

  // Mock data - în aplicația reală vor veni din store/API
  const [currentUser] = useState<User>({
    id: 'current-user',
    color: '#00FF88',
    position: { lat: 44.4268, lng: 26.1025 },
    isOnline: true
  })

  const [otherUsers] = useState<User[]>([
    {
      id: 'user-2',
      color: '#00D4FF',
      position: { lat: 44.4278, lng: 26.1035 },
      isOnline: true
    },
    {
      id: 'user-3', 
      color: '#FF00EA',
      position: { lat: 44.4258, lng: 26.1015 },
      isOnline: true
    },
    {
      id: 'user-4',
      color: '#FFD700',
      position: { lat: 44.4288, lng: 26.1045 },
      isOnline: false
    }
  ])

  const [echoMarkers] = useState<EchoMarker[]>([
    {
      id: 'echo-1',
      position: { lat: 44.4275, lng: 26.1030 },
      color: '#A78BFA',
      message: '✨ Good vibes here',
      timestamp: new Date(),
      intensity: 0.8
    },
    {
      id: 'echo-2',
      position: { lat: 44.4265, lng: 26.1020 },
      color: '#F472B6',
      message: '🎵 Great music spot',
      timestamp: new Date(),
      intensity: 0.6
    }
  ])

  // Constellation lines data
  const createConstellationLines = useCallback(() => {
    const allUsers = [currentUser, ...otherUsers].filter(user => user.isOnline)
    const features: any[] = []
    
    // Create lines between all users
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const user1 = allUsers[i]
        const user2 = allUsers[j]
        
        // Calculate distance for line styling
        const distance = Math.sqrt(
          Math.pow(user1.position.lng - user2.position.lng, 2) +
          Math.pow(user1.position.lat - user2.position.lat, 2)
        )
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [user1.position.lng, user1.position.lat],
              [user2.position.lng, user2.position.lat]
            ]
          },
          properties: {
            user1Color: user1.color,
            user2Color: user2.color,
            distance: distance,
            isCurrentUserConnection: user1.id === currentUser.id || user2.id === currentUser.id
          }
        })
      }
    }
    
    return {
      type: 'FeatureCollection' as const,
      features
    }
  }, [currentUser, otherUsers])

  // Handle map movement
  const handleMapMove = useCallback((evt: any) => {
    setViewport(evt.viewState)
    
    // Check if user manually moved the map
    if (currentUser?.position) {
      const distance = Math.sqrt(
        Math.pow(evt.viewState.longitude - currentUser.position.lng, 2) +
        Math.pow(evt.viewState.latitude - currentUser.position.lat, 2)
      )
      
      if (distance > 0.002) {
        setIsFollowing(false)
        setShowReturnButton(true)
      }
    }
  }, [currentUser])

  // Return to user position
  const returnToUser = useCallback(() => {
    if (currentUser?.position && mapRef.current) {
      setIsFollowing(true)
      setShowReturnButton(false)
      
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        pitch: 60,
        bearing: -17.6,
        duration: 1500,
        essential: true
      })
    }
  }, [currentUser])

  // Map controls
  const zoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.zoomTo(Math.min(currentZoom + 1, 20), { duration: 300 })
    }
  }

  const zoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom()
      mapRef.current.zoomTo(Math.max(currentZoom - 1, 10), { duration: 300 })
    }
  }

  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [26.1025, 44.4268],
        zoom: 15,
        pitch: 60,
        bearing: -17.6,
        duration: 1000
      })
    }
  }

  const togglePitch = () => {
    if (mapRef.current) {
      const newPitch = viewport.pitch > 30 ? 0 : 60
      mapRef.current.flyTo({
        ...viewport,
        pitch: newPitch,
        duration: 500
      })
    }
  }

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout
    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    const handleActivity = () => resetTimeout()
    
    resetTimeout()
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('touchstart', handleActivity)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute inset-0 overflow-hidden"
    >
      <Map
        ref={mapRef}
        {...viewport}
        onMove={handleMapMove}
        onLoad={() => setMapLoaded(true)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        pitchWithRotate={true}
        dragRotate={true}
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
        touchPitch={true}
        keyboard={true}
        attributionControl={false}
        maxZoom={20}
        minZoom={8}
        fog={{
          range: [1, 20],
          color: 'rgba(0, 0, 0, 0.1)',
          'horizon-blend': 0.1
        }}
      >
        {/* Constellation Lines */}
        {mapLoaded && (
          <Source id="constellation-lines" type="geojson" data={createConstellationLines()}>
            <Layer
              id="constellation-lines-glow"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': [
                  'case',
                  ['get', 'isCurrentUserConnection'],
                  '#00FF88',
                  [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, '#00e0ff',
                    15, '#00e0ff',
                    20, '#ff00ff'
                  ]
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 4,
                  15, 6,
                  20, 8
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.2,
                  15, 0.4,
                  20, 0.6
                ],
                'line-blur': 2
              }}
            />
            <Layer
              id="constellation-lines-core"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': [
                  'case',
                  ['get', 'isCurrentUserConnection'],
                  '#00FF88',
                  [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, '#00e0ff',
                    15, '#00e0ff', 
                    20, '#ff00ff'
                  ]
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 1,
                  15, 2,
                  20, 3
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.6,
                  15, 0.8,
                  20, 1
                ]
              }}
            />
          </Source>
        )}

        {/* Current User Marker */}
        <Marker
          longitude={currentUser.position.lng}
          latitude={currentUser.position.lat}
          anchor="center"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              damping: 12,
              stiffness: 400,
              delay: 0.5
            }}
            className="relative"
          >
            {/* Main marker */}
            <div
              className="w-10 h-10 rounded-full border-3 border-white shadow-2xl relative z-10"
              style={{
                backgroundColor: currentUser.color,
                boxShadow: `
                  0 0 30px ${currentUser.color}60,
                  0 0 60px ${currentUser.color}40,
                  0 10px 40px rgba(0,0,0,0.3)
                `
              }}
            />
            
            {/* Pulse rings */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: `${currentUser.color}40` }}
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Center dot */}
            <div 
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ backgroundColor: 'white' }}
            />
          </motion.div>
        </Marker>

        {/* Other Users */}
        {otherUsers.map((user, index) => (
          <Marker
            key={user.id}
            longitude={user.position.lng}
            latitude={user.position.lat}
            anchor="center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                damping: 15,
                stiffness: 300,
                delay: 0.7 + index * 0.1
              }}
              className="relative"
            >
              {/* Main marker */}
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-lg relative z-10"
                style={{
                  backgroundColor: user.color,
                  opacity: user.isOnline ? 1 : 0.5,
                  boxShadow: user.isOnline 
                    ? `0 0 20px ${user.color}60, 0 0 40px ${user.color}30`
                    : 'none'
                }}
              />
              
              {/* Online indicator */}
              {user.isOnline && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white z-20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Subtle pulse for online users */}
              {user.isOnline && (
                <motion.div
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: `${user.color}60` }}
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
              )}
            </motion.div>
          </Marker>
        ))}

        {/* Echo Markers */}
        {echoMarkers.map((echo, index) => (
          <Marker
            key={echo.id}
            longitude={echo.position.lng}
            latitude={echo.position.lat}
            anchor="center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring",
                damping: 20,
                stiffness: 200,
                delay: 1 + index * 0.2
              }}
              className="relative"
            >
              {/* Echo ring */}
              <div
                className="w-16 h-16 rounded-full border-2 border-dashed relative"
                style={{ 
                  borderColor: echo.color,
                  backgroundColor: `${echo.color}20`
                }}
              />
              
              {/* Echo pulse */}
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: echo.color }}
                animate={{
                  scale: [1, 1.8],
                  opacity: [echo.intensity, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              
              {/* Message indicator */}
              <div
                className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                style={{ backgroundColor: echo.color }}
              />
            </motion.div>
          </Marker>
        ))}
      </Map>

      {/* Return to Position Button */}
      <AnimatePresence>
        {showReturnButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring",
              damping: 15,
              stiffness: 300
            }}
            onClick={returnToUser}
            className="fixed bottom-32 right-6 z-40 w-16 h-16 rounded-full backdrop-blur-2xl border border-white/30 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentUser.color}80, ${currentUser.color}60)`,
              boxShadow: `
                0 20px 40px rgba(0,0,0,0.3),
                0 0 30px ${currentUser.color}40,
                inset 0 1px 0 rgba(255,255,255,0.2)
              `
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: `
                0 25px 50px rgba(0,0,0,0.4),
                0 0 40px ${currentUser.color}60,
                inset 0 1px 0 rgba(255,255,255,0.3)
              `
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Navigation2 
                size={28} 
                className="text-white"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                }}
              />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Map Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 -translate-y-1/2 right-6 z-40 flex flex-col gap-3"
          >
            {/* Zoom In */}
            <motion.button
              onClick={zoomIn}
              className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/90 flex items-center justify-center text-xl font-light"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: 'rgba(255,255,255,0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={20} />
            </motion.button>

            {/* Zoom Out */}
            <motion.button
              onClick={zoomOut}
              className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/90 flex items-center justify-center text-xl font-light"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: 'rgba(255,255,255,0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Minus size={20} />
            </motion.button>

            {/* Reset View */}
            <motion.button
              onClick={resetView}
              className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/90 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: 'rgba(255,255,255,0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw size={16} />
            </motion.button>

            {/* Toggle Pitch */}
            <motion.button
              onClick={togglePitch}
              className="w-12 h-12 rounded-full backdrop-blur-xl border border-white/20 text-white/90 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
              }}
              whileHover={{ 
                scale: 1.1,
                backgroundColor: 'rgba(255,255,255,0.2)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 size={16} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.6, 0],
              scale: [0.2, 1, 0.2]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'easeInOut'
            }}
          />
        ))}

        {/* Gradient overlays */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(0, 224, 255, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(255, 0, 234, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.1) 80%)
            `
          }}
        />
      </div>

      {/* Debug Info */}
      <div className="fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur-xl text-white p-3 rounded-lg border border-white/10 text-xs space-y-1">
        <div>Users Online: {otherUsers.filter(u => u.isOnline).length + 1}</div>
        <div>Echoes: {echoMarkers.length}</div>
        <div>Zoom: {Math.round(viewport.zoom * 10) / 10}</div>
        <div>Pitch: {Math.round(viewport.pitch)}°</div>
        <div>Following: {isFollowing ? 'Yes' : 'No'}</div>
      </div>
    </motion.div>
  )
}
