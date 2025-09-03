import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl'
import Supercluster from 'supercluster'
import { useUserStore } from '../store/userStore'
import { useMapStore } from '../store/mapStore'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

interface PointProperties {
  cluster: boolean
  userId: string
  color: string
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>
type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>

const ConstellationMap: React.FC = () => {
  const mapRef = useRef<MapRef>(null)
  const { currentUser, otherUsers } = useUserStore()
  const { viewport, setViewport } = useMapStore()
  const [clusters, setClusters] = useState<(PointFeature | ClusterFeature)[]>([])

  // Initialize Supercluster
  const supercluster = useMemo(() => {
    return new Supercluster<PointProperties, ClusterProperties>({
      radius: 75,
      maxZoom: 20,
      minPoints: 2,
    })
  }, [])

  // Convert users to GeoJSON points
  const points = useMemo(() => {
    const allUsers = [...otherUsers]
    if (currentUser?.position) {
      allUsers.push(currentUser)
    }

    return allUsers
      .filter(user => user.position)
      .map(user => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          userId: user.id,
          color: user.color,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [user.position!.lng, user.position!.lat],
        },
      }))
  }, [currentUser, otherUsers])

  // Update clusters when viewport or points change
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current.getMap()
    const bounds = map.getBounds()
    
    if (!bounds) return

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]

    supercluster.load(points)
    const zoom = Math.floor(viewport.zoom)
    const clusteredFeatures = supercluster.getClusters(bbox, zoom)
    
    setClusters(clusteredFeatures)
  }, [viewport, points, supercluster])

  // Handle cluster click
  const handleClusterClick = useCallback((clusterId: number, lat: number, lng: number) => {
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: Math.min(zoom, 20),
        duration: 500,
      })
    }
  }, [supercluster])

  // Memoized cluster layer style
  const clusterLayerStyle = useMemo(() => ({
    id: 'clusters',
    type: 'circle' as const,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        10,
        '#f1f075',
        30,
        '#f28cb1',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        10,
        30,
        30,
        40,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
      'circle-stroke-opacity': 0.8,
    },
  }), [])

  // Memoized cluster count layer style
  const clusterCountLayerStyle = useMemo(() => ({
    id: 'cluster-count',
    type: 'symbol' as const,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#ffffff',
    },
  }), [])

  return (
    <Map
      ref={mapRef}
      {...viewport}
      onMove={evt => setViewport(evt.viewState)}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100vh' }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      maxZoom={20}
      minZoom={2}
      reuseMaps
      optimizeForTerrain
      antialias={false}
    >
      {/* Clustered points as a Source/Layer for better performance */}
      <Source
        id="users"
        type="geojson"
        data={{
          type: 'FeatureCollection',
          features: clusters,
        }}
        cluster={false}
      >
        <Layer {...clusterLayerStyle} />
        <Layer {...clusterCountLayerStyle} />
      </Source>

      {/* Individual markers only for non-clustered points */}
      {clusters
        .filter(point => !point.properties.cluster)
        .map((point) => {
          const [lng, lat] = point.geometry.coordinates
          const props = point.properties as PointProperties
          
          return (
            <Marker
              key={props.userId}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <div
                className="user-marker"
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: props.color,
                  border: '2px solid white',
                  boxShadow: `0 0 10px ${props.color}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              />
            </Marker>
          )
        })}

      {/* Cluster markers */}
      {clusters
        .filter(cluster => cluster.properties.cluster)
        .map((cluster) => {
          const [lng, lat] = cluster.geometry.coordinates
          const { cluster_id, point_count } = cluster.properties as ClusterProperties
          
          return (
            <Marker
              key={`cluster-${cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <div
                className="cluster-marker"
                onClick={() => handleClusterClick(cluster_id, lat, lng)}
                style={{
                  width: `${30 + (point_count / 10) * 10}px`,
                  height: `${30 + (point_count / 10) * 10}px`,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(81, 187, 214, 0.6)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                  e.currentTarget.style.backgroundColor = 'rgba(81, 187, 214, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.backgroundColor = 'rgba(81, 187, 214, 0.6)'
                }}
              >
                {point_count}
              </div>
            </Marker>
          )
        })}
    </Map>
  )
}

export default React.memo(ConstellationMap)
