import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { MapRef, Marker, Source, Layer } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus, Minus, RotateCcw, Maximize2 } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useMapStore } from '../../store/mapStore'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

// Optimized marker component with memoization
const UserMarkerComponent = React.memo(({ user, isCurrentUser }: { user: any, isCurrentUser: boolean }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ 
      type: "spring",
      damping: 15,
      stiffness: 300,
      delay: isCurrentUser ? 0.3 : 0.5
    }}
    className="relative"
  >
    {/* Main marker */}
    <div
      className={`${isCurrentUser ? 'w-12 h-12 border-4' : 'w-8 h-8 border-2'} rounded-full border-white shadow-2xl relative z-10`}
      style={{
        backgroundColor: user.color,
        boxShadow: isCurrentUser 
          ? `0 0 40px ${user.color}80, 0 0 80px ${user.color}40, 0 15px 50px rgba(0,0,0,0.4)`
          : `0 0 25px ${user.color}70, 0 0 40px ${user.color}30`
      }}
    />
    
    {/* Pulse rings - reduced for performance but kept visual impact */}
    {isCurrentUser ? (
      <>
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${user.color}60` }}
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${user.color}60` }}
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5, ease: "easeOut" }}
        />
      </>
    ) : (
      user.isOnline && (
        <motion.div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${user.color}80` }}
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        />
      )
    )}
    
    {/* Center dot */}
    <div className={`absolute top-1/2 left-1/2 ${isCurrentUser ? 'w-4 h-4' : 'w-2 h-2'} rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 z-20`} />
    
    {/* Online indicator for other users */}
    {!isCurrentUser && user.isOnline && (
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white z-20"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
  </motion.div>
))

// Echo marker component
const EchoMarkerComponent = React.memo(({ echo, index }: { echo: any, index: number }) => (
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
    
    {/* Echo pulse - throttled for performance */}
    <motion.div
      className="absolute inset-0 rounded-full border"
      style={{ borderColor: echo.color }}
      animate={{
        scale: [1, 1.8],
        opacity: [echo.intensity || 0.8, 0]
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
))

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Store data
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport, markers } = useMapStore()

  // Memoized constellation lines with performance optimization
  const constellationData = useMemo(() => {
    if (!currentUser?.position || !mapLoaded) {
      return { type: 'FeatureCollection' as const, features: [] }
    }
    
    const allUsers = [currentUser, ...otherUsers].filter(user => user?.position && user.isOnline !== false)
    const features: any[] = []
    
    // Create lines between all users for full constellation effect
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const user1 = allUsers[i]
        const user2 = allUsers[j]
        
        if (!user1?.position || !user2?.position) continue
        
        // Calculate distance for styling
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
    
    console.log('🌟 Created constellation lines:', features.length)
    return { type: 'FeatureCollection' as const, features }
  }, [currentUser, otherUsers, mapLoaded])

  // Throttled map update for smooth performance
  const handleMapMove = useCallback((evt: any) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setViewport(evt.viewState)
      
      // Check if manually moved away from user
      if (currentUser?.position && isFollowing) {
        const distance = Math.sqrt(
          Math.pow(evt.viewState.longitude - currentUser.position.lng, 2) +
          Math.pow(evt.viewState.latitude - currentUser.position.lat, 2)
        )
        
        if (distance > 0.002) {
          setIsFollowing(false)
          setShowReturnButton(true)
          console.log('📍 Map moved away from user, showing return button')
        }
      }
    }, 100) // 100ms throttle for smooth performance
  }, [currentUser, isFollowing, setViewport])

  // Auto-follow user position with smooth transition
  useEffect(() => {
    if (currentUser?.position && mapRef.current && isFollowing && mapLoaded) {
      console.log('🎯 Following user position')
      
      mapRef.current.easeTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: Math.max(viewport.zoom, 16),
        pitch: 45, // Restored cinematic angle
        bearing: viewport.bearing,
        duration: 1500
      })
    }
  }, [currentUser?.position, isFollowing, mapLoaded])

  // Return to user position
  const returnToUser = useCallback(() => {
    if (currentUser?.position && mapRef.current) {
      console.log('🏠 Returning to user position')
      setIsFollowing(true)
      setShowReturnButton(false)
      
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        pitch: 45,
        bearing: 0,
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
      mapRef.current.zoomTo(Math.max(currentZoom - 1, 8), { duration: 300 })
    }
  }

  const resetView = () => {
    if (currentUser?.position && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 15,
        pitch: 45,
        bearing: 0,
        duration: 1000
      })
      setIsFollowing(true)
      setShowReturnButton(false)
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

  // Optimized auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    setShowControls(true)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000)
  }, [])

  useEffect(() => {
    const handleActivity = () => resetControlsTimeout()
    
    resetControlsTimeout()
    window.addEventListener('mousemove', handleActivity, { passive: true })
    window.addEventListener('touchstart', handleActivity, { passive: true })
    
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [resetControlsTimeout])

  if (!currentUser?.position) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white text-xl font-light mb-2"
          >
            Constellation Walker
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/60 text-sm"
          >
            Connecting to the constellation...
          </motion.p>
        </div>
      </div>
    )
  }

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
        onLoad={() => {
          setMapLoaded(true)
          console.log('🗺️ Map loaded')
        }}
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
        antialias={true}
        optimizeForTerrain={false} // Performance optimization
        fog={{
          range: [1, 20],
          color: 'rgba(0, 0, 0, 0.1)',
          'horizon-blend': 0.1
        }}
      >
        {/* Constellation Lines - Full effect with glow + core */}
        {mapLoaded && constellationData.features.length > 0 && (
          <Source id="constellation-lines" type="geojson" data={constellationData}>
            {/* Glow effect */}
            <Layer
              id="constellation-glow"
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
                  ['exponential', 1.5],
                  ['zoom'],
                  10, 6,
                  15, 12,
                  20, 20
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.3,
                  15, 0.5,
                  20, 0.7
                ],
                'line-blur': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 3,
                  15, 5,
                  20, 8
                ]
              }}
            />
            
            {/* Core line */}
            <Layer
              id="constellation-core"
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
                  ['exponential', 1.5],
                  ['zoom'],
                  10, 2,
                  15, 4,
                  20, 6
                ],
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.8,
                  15, 0.9,
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
          <UserMarkerComponent user={currentUser} isCurrentUser={true} />
        </Marker>

        {/* Other Users */}
        {otherUsers.map((user) => (
          user.position && (
            <Marker
              key={user.id}
              longitude={user.position.lng}
              latitude={user.position.lat}
              anchor="center"
            >
              <UserMarkerComponent user={user} isCurrentUser={false} />
            </Marker>
          )
        ))}

        {/* Echo Markers */}
        {markers.map((echo, index) => (
          <Marker
            key={echo.id}
            longitude={echo.position.lng}
            latitude={echo.position.lat}
            anchor="center"
          >
            <EchoMarkerComponent echo={echo} index={index} />
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
              background: `linear-gradient(135deg, ${currentUser.color}90, ${currentUser.color}70)`,
              boxShadow: `
                0 20px 40px rgba(0,0,0,0.3),
                0 0 30px ${currentUser.color}50,
                inset 0 1px 0 rgba(255,255,255,0.2)
              `
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: `
                0 25px 50px rgba(0,0,0,0.4),
                0 0 40px ${currentUser.color}70,
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

      {/* Map Controls - Restored with optimizations */}
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
              className="w-12 h-12 rounded-full backdrop-blur-2xl border border-white/20 text-white/90 flex items-center justify-center text-xl font-light shadow-lg"
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
              className="w-12 h-12 rounded-full backdrop-blur-2xl border border-white/20 text-white/90 flex items-center justify-center text-xl font-light shadow-lg"
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
              className="w-12 h-12 rounded-full backdrop-blur-2xl border border-white/20 text-white/90 flex items-center justify-center shadow-lg"
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
              className="w-12 h-12 rounded-full backdrop-blur-2xl border border-white/20 text-white/90 flex items-center justify-center shadow-lg"
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

      {/* Atmospheric Effects - Optimized particle count */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Connection energy particles - reduced count for performance */}
        {otherUsers.length > 0 && Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              backgroundColor: currentUser.color,
              boxShadow: `0 0 6px ${currentUser.color}`
            }}
            animate={{
              y: [0, -60, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0, 0.8, 0],
              scale: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'easeInOut'
            }}
          />
        ))}

        {/* Gradient overlays for atmospheric depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, ${currentUser.color}05 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(0, 212, 255, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.1) 80%)
            `
          }}
        />
      </div>

      {/* Status Info - Enhanced */}
      <div className="fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur-2xl text-white p-4 rounded-xl border border-white/10 text-sm space-y-2 shadow-2xl">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentUser.color }}
          />
          <span>You</span>
        </div>
        
        <div className="text-white/70 space-y-1">
          <div>Connected Users: {otherUsers.filter(u => u.isOnline !== false).length}</div>
          <div>Echoes: {markers.length}</div>
          <div>Zoom: {Math.round(viewport.zoom * 10) / 10}x</div>
          <div>Pitch: {Math.round(viewport.pitch)}°</div>
          <div>Following: {isFollowing ? 'Yes' : 'No'}</div>
          {currentUser.position && (
            <div className="text-xs mt-1 font-mono text-white/50">
              {currentUser.position.lat.toFixed(6)}, {currentUser.position.lng.toFixed(6)}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
