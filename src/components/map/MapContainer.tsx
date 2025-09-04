import React, { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'
import { MAPBOX_TOKEN } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapState, setMapState] = useState({
    longitude: 26.1025,
    latitude: 44.4268,
    zoom: 14,
    pitch: 0,
    bearing: 0
  })
  
  const { currentUser, otherUsers } = useUserStore()

  // Auto-center on user when position is available
  useEffect(() => {
    if (currentUser?.position && mapRef.current && mapLoaded) {
      console.log('Flying to user position:', currentUser.position)
      mapRef.current.flyTo({
        center: [currentUser.position.lng, currentUser.position.lat],
        zoom: 15,
        duration: 2000
      })
    }
  }, [currentUser?.position, mapLoaded])

  console.log('MapContainer render:', { 
    hasCurrentUser: !!currentUser?.position, 
    otherUsersCount: otherUsers.length,
    mapLoaded 
  })

  // Show loading if no user position yet
  if (!currentUser?.position) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div>Finding your location...</div>
          <div className="text-white/60 text-sm mt-2">Please allow location access</div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...mapState}
        onMove={(evt) => {
          setMapState(evt.viewState)
        }}
        onLoad={() => {
          setMapLoaded(true)
          console.log('Map loaded successfully')
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11" // Simple dark style for performance
        
        // Basic controls only
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchZoomRotate={false}
        touchPitch={false}
        keyboard={false}
        attributionControl={false}
        maxZoom={20}
        minZoom={10}
        antialias={false}
      >
        {/* Current User Marker - bigger and special color */}
        <Marker
          longitude={currentUser.position.lng}
          latitude={currentUser.position.lat}
          anchor="center"
        >
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
              style={{ 
                backgroundColor: currentUser.color,
                boxShadow: `0 0 20px ${currentUser.color}80`
              }}
            />
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2" />
            {/* You label */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold bg-black/70 px-2 py-1 rounded">
              YOU
            </div>
          </div>
        </Marker>

        {/* Other Users */}
        {otherUsers.map((user, index) => (
          user.position && (
            <Marker
              key={user.id}
              longitude={user.position.lng}
              latitude={user.position.lat}
              anchor="center"
            >
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: user.color }}
                />
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2" />
                {/* User label */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black/70 px-1 py-0.5 rounded">
                  {user.id.includes('bot') ? 'BOT' : 'USER'}
                </div>
                {/* Online indicator */}
                {user.isOnline && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white" />
                )}
              </div>
            </Marker>
          )
        ))}
      </Map>

      {/* Debug Info - Enhanced */}
      <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg text-sm border border-white/20">
        <div className="space-y-2">
          <div className="text-yellow-400 font-bold">STEP 1: USERS</div>
          
          <div className="space-y-1">
            <div>Map: {mapLoaded ? '✅ Loaded' : '⏳ Loading'}</div>
            <div>Your Position: {currentUser?.position ? '✅ Found' : '❌ Missing'}</div>
            <div>Connected Users: {otherUsers.length}</div>
          </div>
          
          {currentUser?.position && (
            <div className="border-t border-white/30 pt-2 text-xs">
              <div>You: {currentUser.position.lat.toFixed(4)}, {currentUser.position.lng.toFixed(4)}</div>
            </div>
          )}
          
          {otherUsers.length > 0 && (
            <div className="border-t border-white/30 pt-2">
              <div className="text-xs text-white/80">Other Users:</div>
              {otherUsers.slice(0, 3).map(user => (
                <div key={user.id} className="text-xs flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: user.color }}
                  />
                  {user.id.slice(-6)} {user.isOnline ? '🟢' : '🔴'}
                </div>
              ))}
              {otherUsers.length > 3 && (
                <div className="text-xs text-white/60">+{otherUsers.length - 3} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simple Controls */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
          onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
          className="w-12 h-12 bg-black/70 text-white rounded-full text-xl font-bold shadow-lg active:scale-95 transition-transform"
        >
          +
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
          className="w-12 h-12 bg-black/70 text-white rounded-full text-xl font-bold shadow-lg active:scale-95 transition-transform"
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
            className="w-12 h-12 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform"
          >
            🎯
          </button>
        )}
      </div>
    </div>
  )
}
