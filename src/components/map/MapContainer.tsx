import { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'
import { useMapStore } from '../../store/mapStore'
import { MAPBOX_TOKEN, MAPBOX_STYLE } from '../../utils/constants'

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Store data
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport } = useMapStore()

  console.log('🗺️ MapContainer render:', { 
    currentUser: !!currentUser?.position, 
    otherUsers: otherUsers.length,
    mapLoaded 
  })

  if (!currentUser?.position) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Waiting for location...</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => {
          console.log('📍 Map move event')
          setViewport(evt.viewState)
        }}
        onLoad={() => {
          setMapLoaded(true)
          console.log('🗺️ Map loaded')
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_STYLE}
        
        // TOATE CONTROALELE DEZACTIVATE PENTRU TEST
        pitchWithRotate={false}
        dragRotate={false}
        dragPan={true}        // Doar pan pentru test
        scrollZoom={true}     // Doar zoom pentru test
        doubleClickZoom={false}
        touchZoomRotate={false}
        touchPitch={false}
        keyboard={false}
        
        attributionControl={false}
        maxZoom={18}
        minZoom={12}
        antialias={false}     // Dezactivat pentru performance
        optimizeForTerrain={false}
      >
        {/* DOAR CURRENT USER - simplu */}
        <Marker
          longitude={currentUser.position.lng}
          latitude={currentUser.position.lat}
          anchor="center"
        >
          <div 
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: currentUser.color }}
          />
        </Marker>

        {/* ADAUGĂ CÂTE UN USER PE RÂND PENTRU TEST */}
        {otherUsers.slice(0, 1).map((user) => (
          user.position && (
            <Marker
              key={user.id}
              longitude={user.position.lng}
              latitude={user.position.lat}
              anchor="center"
            >
              <div 
                className="w-6 h-6 rounded-full border-2 border-white"
                style={{ backgroundColor: user.color }}
              />
            </Marker>
          )
        ))}
      </Map>

      {/* Debug info */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded text-xs space-y-1">
        <div>Map Loaded: {mapLoaded ? 'Yes' : 'No'}</div>
        <div>Users: {otherUsers.length}</div>
        <div>Zoom: {Math.round(viewport.zoom * 10) / 10}</div>
        <div>Lat: {currentUser.position.lat.toFixed(4)}</div>
        <div>Lng: {currentUser.position.lng.toFixed(4)}</div>
        <div className="border-t border-white/30 pt-2 mt-2">
          <div className="text-yellow-400">DEBUG MODE</div>
          <div>No animations</div>
          <div>No constellation lines</div>
          <div>No particles</div>
          <div>Only 1 other user shown</div>
        </div>
      </div>

      {/* Simple controls */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <button 
          onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
          className="w-8 h-8 bg-white/20 text-white rounded text-lg"
        >
          +
        </button>
        <button 
          onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
          className="w-8 h-8 bg-white/20 text-white rounded text-lg"
        >
          -
        </button>
      </div>
    </div>
  )
}
