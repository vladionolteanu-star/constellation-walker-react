import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Map, { MapRef, Marker, Source, Layer } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus, Minus, RotateCcw } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useMapStore } from '../../store/mapStore'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

// Memoized marker component for performance
const UserMarkerComponent = ({ user, isCurrentUser }: { user: any, isCurrentUser: boolean }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 15, stiffness: 300 }}
    className="relative"
  >
    {/* Main marker */}
    <div
      className={`${isCurrentUser ? 'w-12 h-12 border-4' : 'w-8 h-8 border-2'} rounded-full border-white shadow-2xl relative z-10`}
      style={{
        backgroundColor: user.color,
        boxShadow: isCurrentUser 
          ? `0 0 40px ${user.color}80, 0 0 80px ${user.color}40`
          : `0 0 25px ${user.color}70`
      }}
    />
    
    {/* Pulse rings only for current user */}
    {isCurrentUser && (
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
    )}
    
    {/* Center dot */}
    <div className={`absolute top-1/2 left-1/2 ${isCurrentUser ? 'w-4 h-4' : 'w-2 h-2'} rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 z-20`} />
  </motion.div>
)

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Store data
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport, markers } = useMapStore()

  // Memoized constellation lines for performance
  const constellationData = useMemo(() => {
    if (!currentUser?.position || !mapLoaded) {
      return { type: 'FeatureCollection' as const, features: [] }
    }
    
    const allUsers = [currentUser, ...otherUsers].filter(user => user?.position && user.isOnline !== false)
    const features: any[] = []
    
    // Only create lines from current user to others (simpler, better performance)
    otherUsers.forEach(otherUser => {
      if (otherUser?.position && otherUser.isOnline !== false) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [currentUser.position.lng, currentUser.position.lat],
              [otherUser.position.lng, otherUser.position.lat]
            ]
          },
          properties: {
            color: currentUser.color,
            targetColor: otherUser.color
          }
        })
      }
    })
    
    console.log('🌟 Created constellation lines:', features.length)
    return { type: 'FeatureCollection' as const, features }
  }, [currentUser, otherUsers, mapLoaded])

  // Debounced map update for performance
  const debouncedHandleMapMove = useCallback((evt: any) => {
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
        
        if (distance > 0.001) {
          setIsFollowing(false)
          setShowReturnButton(true)
        }
      }
    }, 100) // 100ms debounce
  }, [currentUser, isFollowing, setViewport])

  // Auto-follow user position
  useEffect(() => {
    if (currentUser?.position && mapRef.current && isFollowing && mapLoaded) {
      console.log('🎯 Following user position')
      
      mapRef.current.easeTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: Math.max(viewport.zoom, 16),
        duration: 1000
      })
    }
  }, [currentUser?.position, isFollowing, mapLoaded])

  // Return to user position
  const returnToUser = useCallback(() => {
    if (currentUser?.position && mapRef.current) {
      setIsFollowing(true)
      setShowReturnButton(false)
      
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 16,
        duration: 1000
      })
    }
  }, [currentUser])

  // Map controls
  const zoomIn = () => mapRef.current?.zoomTo(Math.min(mapRef.current.getZoom() + 1, 20), { duration: 200 })
  const zoomOut = () => mapRef.current?.zoomTo(Math.max(mapRef.current.getZoom() - 1, 8), { duration: 200 })
  const resetView = () => {
    if (currentUser?.position && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 15,
        pitch: 0,
        bearing: 0,
        duration: 800
      })
      setIsFollowing(true)
      setShowReturnButton(false)
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
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handleActivity)
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    }
  }, [])

  if (!currentUser?.position) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Waiting for location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={debouncedHandleMapMove}
        onLoad={() => {
          setMapLoaded(true)
          console.log('🗺️ Map loaded')
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        pitchWithRotate={false} // Disable for performance
        dragRotate={false}      // Disable for performance
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={true}
        touchZoomRotate={false} // Disable for performance
        touchPitch={false}      // Disable for performance
        keyboard={true}
        attributionControl={false}
        maxZoom={20}
        minZoom={10}
        antialias={false}       // Disable for performance
      >
        {/* Constellation Lines - simplified for performance */}
        {constellationData.features.length > 0 && (
          <Source id="constellation-lines" type="geojson" data={constellationData}>
            <Layer
              id="constellation-core"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': [
                  'get', 'color'
                ],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 2,
                  15, 3,
                  20, 4
                ],
                'line-opacity': 0.8
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

        {/* Other Users - memoized */}
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
      </Map>

      {/* Return to Position Button */}
      <AnimatePresence>
        {showReturnButton && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={returnToUser}
            className="fixed bottom-32 right-6 z-40 w-16 h-16 rounded-full backdrop-blur-2xl border border-white/30 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentUser.color}90, ${currentUser.color}70)`,
              boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px ${currentUser.color}40`
            }}
          >
            <Navigation2 size={28} className="text-white" />
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
            className="fixed top-1/2 -translate-y-1/2 right-6 z-40 flex flex-col gap-2"
          >
            <button onClick={zoomIn} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center">
              <Plus size={16} />
            </button>
            <button onClick={zoomOut} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center">
              <Minus size={16} />
            </button>
            <button onClick={resetView} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center">
              <RotateCcw size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Info - optimized */}
      <div className="fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur text-white p-3 rounded-lg border border-white/10 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentUser.color }} />
          <span>You</span>
        </div>
        <div className="text-white/70 text-xs">
          <div>Connected: {otherUsers.filter(u => u.isOnline !== false).length}</div>
          <div>Zoom: {Math.round(viewport.zoom * 10) / 10}x</div>
        </div>
      </div>
    </div>
  )
}
