import React from 'react'
import Map, { Marker } from 'react-map-gl'

const MAPBOX_TOKEN = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g'

export default function MapContainer() {
  console.log('🗺️ MapContainer rendering...')

  return (
    <div className="absolute inset-0">
      <Map
        longitude={26.1025}
        latitude={44.4268}
        zoom={14}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12" // Standard Mapbox style
      >
        <Marker longitude={26.1025} latitude={44.4268} anchor="center">
          <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white" />
        </Marker>
      </Map>

      <div className="fixed top-4 left-4 z-50 bg-black text-white p-3 rounded">
        <div>ULTRA SIMPLE MAP TEST</div>
        <div>Should show red marker in Bucharest</div>
      </div>
    </div>
  )
}
