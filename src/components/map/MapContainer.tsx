import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { MapRef, Marker, Source, Layer } from 'react-map-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation2, Plus, Minus } from 'lucide-react'
import { useUserStore } from '../../store/userStore'
import { useMapStore } from '../../store/mapStore'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport, markers } = useMapStore()
  
  // Throttled map updates for performance
  const updateTimeout = useRef<NodeJS.Timeout | null>(null)
  const handleMapMove = useCallback((evt: any) => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current)
    }
    
    updateTimeout.current = setTimeout(() => {
      setViewport(evt.viewState)
      
      // Check if moved away from user
      if (currentUser?.position && isFollowing) {
        const distance = Math.sqrt(
          Math.pow(evt.viewState.longitude - currentUser.position.lng, 2) +
          Math.pow(evt.viewState.latitude - currentUser.position.lat, 2)
        )
        
        if (distance > 0.002) {
          setIsFollowing(false)
          setShowReturnButton(true)
        }
      }
    }, 150)
  }, [currentUser, isFollowing, setViewport])

  // Auto-follow user position
  useEffect(() => {
    if (currentUser?.position && mapRef.current && isFollowing && mapLoaded) {
      mapRef.current.easeTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: Math.max(viewport.zoom, 16),
        duration: 1500
      })
    }
  }, [currentUser?.position, isFollowing, mapLoaded])

  // Constellation lines data
  const constellationData = React.useMemo(() => {
    if (!currentUser?.position || !mapLoaded) {
      return { type: 'FeatureCollection' as const, features: [] }
    }
    
    const features: any[] = []
    
    // Create lines from current user to all others
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
            color: currentUser.color
          }
        })
      }
    })
    
    return { type: 'FeatureCollection' as const, features }
  }, [currentUser, otherUsers, mapLoaded])

  // Return to user
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
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })

  if (!currentUser?.position) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-light mb-2">Constellation Walker</h2>
          <p className="text-white/60 text-sm">Connecting to constellation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={handleMapMove}
        onLoad={() => {
          setMapLoaded(true)
          console.log('Map loaded')
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={true}
        dragRotate={false}
        pitchWithRotate={false}
        touchZoomRotate={false}
        touchPitch={false}
        attributionControl={false}
        maxZoom={20}
        minZoom={10}
        antialias={false}
      >
        {/* Constellation Lines */}
        {constellationData.features.length > 0 && (
          <Source id="constellation-lines" type="geojson" data={constellationData}>
            <Layer
              id="constellation-glow"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 4,
                  15, 8,
                  20, 12
                ],
                'line-opacity': 0.6,
                'line-blur': 2
              }}
            />
            <Layer
              id="constellation-core"
              type="line"
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 2,
                  15, 4,
                  20, 6
                ],
                'line-opacity': 0.9
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
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="relative"
          >
            <div
              className="w-12 h-12 rounded-full border-4 border-white shadow-2xl relative z-10"
              style={{
                backgroundColor: currentUser.color,
                boxShadow: `0 0 30px ${currentUser.color}80, 0 0 60px ${currentUser.color}40`
              }}
            />
            
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${currentUser.color}60` }}
              animate={{ scale: [1, 2], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            
            <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 z-20" />
          </motion.div>
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
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.2 }}
                className="relative"
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg relative z-10"
                  style={{
                    backgroundColor: user.color,
                    boxShadow: `0 0 20px ${user.color}70`
                  }}
                />
                
                {user.isOnline && (
                  <motion.div
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: `${user.color}80` }}
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                
                <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2 z-20" />
              </motion.div>
            </Marker>
          )
        ))}

        {/* Echo Markers */}
        {markers.map((echo) => (
          <Marker
            key={echo.id}
            longitude={echo.position.lng}
            latitude={echo.position.lat}
            anchor="center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="relative"
            >
              <div
                className="w-12 h-12 rounded-full border-2 border-dashed relative"
                style={{ 
                  borderColor: echo.color,
                  backgroundColor: `${echo.color}20`
                }}
              />
              
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: echo.color }}
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
              />
              
              <div
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 border border-white"
                style={{ backgroundColor: echo.color }}
              />
            </motion.div>
          </Marker>
        ))}
      </Map>

      {/* Return Button */}
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
      <div className="fixed top-1/2 -translate-y-1/2 right-6 z-40 flex flex-col gap-2">
        <button onClick={zoomIn} className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
          <Plus size={20} />
        </button>
        <button onClick={zoomOut} className="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
          <Minus size={20} />
        </button>
      </div>

      {/* Status Info */}
      <div className="fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur text-white p-3 rounded-lg border border-white/10 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentUser.color }} />
          <span>You</span>
        </div>
        <div className="text-white/70 text-xs space-y-1">
          <div>Connected: {otherUsers.filter(u => u.isOnline !== false).length}</div>
          <div>Echoes: {markers.length}</div>
          <div>Zoom: {Math.round(viewport.zoom * 10) / 10}x</div>
        </div>
      </div>
    </div>
  )
}
