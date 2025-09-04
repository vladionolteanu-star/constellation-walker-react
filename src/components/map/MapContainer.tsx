import React, { useEffect, useRef, useState, useCallback } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'

const MAPBOX_TOKEN = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [mapState, setMapState] = useState({
    longitude: 26.1025,
    latitude: 44.4268,
    zoom: 14,
    pitch: 0,
    bearing: 0
  })
  
  const { currentUser, otherUsers } = useUserStore()
  
  // Throttled map updates - CRITICAL for mobile performance
  const updateTimeout = useRef<NodeJS.Timeout | null>(null)
  const handleMapMove = useCallback((evt: any) => {
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current)
    }
    
    updateTimeout.current = setTimeout(() => {
      setMapState(evt.viewState)
    }, 200) // 200ms throttle for mobile
  }, [])

  // Auto fly to user position once
  useEffect(() => {
    if (currentUser?.position && mapRef.current) {
      console.log('🎯 Flying to user position')
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 15,
        duration: 2000
      })
    }
  }, [currentUser?.position])

  console.log('🗺️ Render count, Users:', otherUsers.length)

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...mapState}
        onMove={handleMapMove}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11" // Simple dark style
        
        // MOBILE OPTIMIZATIONS
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchZoomRotate={false}
        touchPitch={false}
        keyboard={false}
        attributionControl={false}
        
        // Performance settings
        maxZoom={18}
        minZoom={10}
        antialias={false}
        optimizeForTerrain={false}
        
        // Critical for mobile
        preserveDrawingBuffer={false}
        failIfMajorPerformanceCaveat={true}
      >
        {/* Current User */}
        {currentUser?.position && (
          <Marker
            longitude={currentUser.position.lng}
            latitude={currentUser.position.lat}
            anchor="center"
          >
            <div 
              className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
              style={{ 
                backgroundColor: currentUser.color,
                boxShadow: `0 0 20px ${currentUser.color}80`
              }}
            />
          </Marker>
        )}

        {/* Other Users - limit to 5 for mobile performance */}
        {otherUsers.slice(0, 5).map((user) => (
          user.position && (
            <Marker
              key={user.id}
              longitude={user.position.lng}
              latitude={user.position.lat}
              anchor="center"
            >
              <div 
                className="w-8 h-8 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: user.color }}
              />
            </Marker>
          )
        ))}
      </Map>

      {/* Mobile-friendly controls */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
          className="w-14 h-14 bg-black/70 text-white rounded-full text-2xl font-bold shadow-xl active:scale-95 transition-transform"
        >
          +
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
          className="w-14 h-14 bg-black/70 text-white rounded-full text-2xl font-bold shadow-xl active:scale-95 transition-transform"
        >
          −
        </button>
        {currentUser?.position && (
          <button 
            onClick={() => {
              mapRef.current?.flyTo({
                center: [currentUser.position!.lng, currentUser.position!.lat],
                zoom: 16,
                duration: 1000
              })
            }}
            className="w-14 h-14 bg-blue-600 text-white rounded-full text-xl shadow-xl active:scale-95 transition-transform"
          >
            🎯
          </button>
        )}
      </div>

      {/* Status info */}
      <div className="fixed top-6 left-6 z-50 bg-black/80 text-white p-3 rounded-lg">
        <div className="text-sm space-y-1">
          <div>👤 You: {currentUser?.position ? '📍' : '❌'}</div>
          <div>🤖 Others: {otherUsers.length}</div>
          <div>🔍 Zoom: {Math.round(mapState.zoom * 10) / 10}</div>
        </div>
      </div>
    </div>
  )
}
