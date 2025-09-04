import { useEffect, useRef, useState } from 'react'
import Map, { MapRef, Marker } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'
import { useMapStore } from '../../store/mapStore'
import { MAPBOX_TOKEN } from '../../utils/constants'

// TESTE DIFERITE STILURI DE HARTA
const MAP_STYLES = {
  standard: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9', 
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  custom: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg' // stilul tau original
}

export default function MapContainer() {
  const mapRef = useRef<MapRef>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentStyle, setCurrentStyle] = useState<keyof typeof MAP_STYLES>('standard')
  const [renderCount, setRenderCount] = useState(0)
  
  // Store data
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport } = useMapStore()

  // Count re-renders
  useEffect(() => {
    setRenderCount(prev => prev + 1)
  })

  console.log('🗺️ MapContainer render #', renderCount, { 
    currentUser: !!currentUser?.position, 
    otherUsers: otherUsers.length,
    mapLoaded,
    style: currentStyle
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
          console.log('📍 Map move - performance test')
          setViewport(evt.viewState)
        }}
        onLoad={() => {
          setMapLoaded(true)
          console.log('🗺️ Map loaded with style:', currentStyle)
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[currentStyle]}
        
        // CONFIGURARE ULTRA-PERFORMANCE
        pitchWithRotate={false}
        dragRotate={false}
        dragPan={true}
        scrollZoom={true}
        doubleClickZoom={false}
        touchZoomRotate={false}
        touchPitch={false}
        keyboard={false}
        attributionControl={false}
        maxZoom={16}  // Limitat pentru performance
        minZoom={10}
        antialias={false}
        optimizeForTerrain={false}
        reuseMaps={true}
      >
        {/* Current user - simplu */}
        <Marker
          longitude={currentUser.position.lng}
          latitude={currentUser.position.lat}
          anchor="center"
        >
          <div 
            className="w-10 h-10 rounded-full border-4 border-white shadow-lg"
            style={{ backgroundColor: currentUser.color }}
          />
        </Marker>

        {/* 1 singur alt user pentru test */}
        {otherUsers.slice(0, 1).map((user) => (
          user.position && (
            <Marker
              key={user.id}
              longitude={user.position.lng}
              latitude={user.position.lat}
              anchor="center"
            >
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: user.color }}
              />
            </Marker>
          )
        ))}
      </Map>

      {/* Style Switcher pentru test */}
      <div className="fixed top-4 left-4 z-50 bg-black/90 text-white p-3 rounded space-y-2">
        <div className="text-sm font-bold text-yellow-400">MAP STYLE TEST</div>
        {Object.keys(MAP_STYLES).map((style) => (
          <button
            key={style}
            onClick={() => setCurrentStyle(style as keyof typeof MAP_STYLES)}
            className={`block w-full text-left px-2 py-1 rounded text-xs ${
              currentStyle === style 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {style === 'custom' ? `${style} (YOUR STYLE)` : style}
          </button>
        ))}
      </div>

      {/* Performance info */}
      <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-3 rounded text-xs space-y-1">
        <div className="text-yellow-400 font-bold">PERFORMANCE TEST</div>
        <div>Style: <span className="text-cyan-400">{currentStyle}</span></div>
        <div>Map Loaded: {mapLoaded ? '✅' : '⏳'}</div>
        <div>Renders: <span className="text-red-400">#{renderCount}</span></div>
        <div>Users: {otherUsers.length}</div>
        <div>Zoom: {Math.round(viewport.zoom * 10) / 10}</div>
        
        <div className="border-t border-white/30 pt-2 mt-2">
          <div className="text-green-400">OPTIMIZATIONS:</div>
          <div>• No animations</div>
          <div>• No constellation lines</div>
          <div>• No particles</div>
          <div>• Max zoom: 16</div>
          <div>• Only 1 other user</div>
          <div>• No pitch/rotate</div>
        </div>

        <div className="border-t border-white/30 pt-2 mt-2 text-xs">
          <div className="text-orange-400">TEST RESULTS:</div>
          <div>🏃‍♂️ Pan speed: {mapLoaded ? 'Test by dragging' : 'Loading...'}</div>
          <div>🔍 Zoom speed: Use +/- buttons</div>
        </div>
      </div>

      {/* Simple controls */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <button 
          onClick={() => {
            console.log('🔍 Zoom IN triggered')
            mapRef.current?.zoomIn({ duration: 100 })
          }}
          className="w-12 h-12 bg-black/70 text-white rounded-full text-xl font-bold border-2 border-white/30 hover:bg-black/90"
        >
          +
        </button>
        <button 
          onClick={() => {
            console.log('🔍 Zoom OUT triggered')
            mapRef.current?.zoomOut({ duration: 100 })
          }}
          className="w-12 h-12 bg-black/70 text-white rounded-full text-xl font-bold border-2 border-white/30 hover:bg-black/90"
        >
          −
        </button>
        <button 
          onClick={() => {
            if (currentUser?.position && mapRef.current) {
              console.log('🎯 FLY TO user position')
              mapRef.current.flyTo({
                center: [currentUser.position.lng, currentUser.position.lat],
                zoom: 14,
                duration: 1000
              })
            }
          }}
          className="w-12 h-12 bg-blue-600 text-white rounded-full text-xs font-bold border-2 border-white/30 hover:bg-blue-700"
        >
          🎯
        </button>
      </div>
    </div>
  )
}
