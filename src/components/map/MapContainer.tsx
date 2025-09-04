import { useRef } from 'react'
import Map from 'react-map-gl'

const MAPBOX_TOKEN = "pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g"

export default function MapContainer() {
  const mapRef = useRef(null)

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        longitude={26.1025}
        latitude={44.4268}
        zoom={14}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg"
      />
    </div>
  )
}
