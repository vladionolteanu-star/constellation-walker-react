import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'
import { calculateDistance, CONNECTION_DISTANCE, MAX_CONNECTIONS } from '../../utils/constants'

export default function ConstellationLines() {
  const { currentUser, otherUsers } = useUserStore()

  const constellationData = useMemo(() => {
    if (!currentUser?.position) {
      return {
        type: 'FeatureCollection',
        features: []
      }
    }

    const features: any[] = []
    const myPosition = currentUser.position

    // Get nearby users within connection distance
    const nearbyUsers = otherUsers
      .filter(user => user.position)
      .map(user => ({
        ...user,
        distance: calculateDistance(
          myPosition.lat,
          myPosition.lng,
          user.position!.lat,
          user.position!.lng
        )
      }))
      .filter(user => user.distance < CONNECTION_DISTANCE)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_CONNECTIONS)

    // Create lines from current user to nearby users
    nearbyUsers.forEach((user, index) => {
      features.push({
        type: 'Feature',
        properties: {
          distance: user.distance,
          index: index,
          color: user.color,
          primary: true
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [myPosition.lng, myPosition.lat],
            [user.position!.lng, user.position!.lat]
          ]
        }
      })
    })

    // Create connections between nearby users (triangulation)
    for (let i = 0; i < nearbyUsers.length; i++) {
      for (let j = i + 1; j < nearbyUsers.length; j++) {
        const user1 = nearbyUsers[i]
        const user2 = nearbyUsers[j]
        
        const interUserDistance = calculateDistance(
          user1.position!.lat,
          user1.position!.lng,
          user2.position!.lat,
          user2.position!.lng
        )

        if (interUserDistance < CONNECTION_DISTANCE * 0.8) { // Shorter distance for secondary connections
          features.push({
            type: 'Feature',
            properties: {
              distance: interUserDistance,
              secondary: true,
              color1: user1.color,
              color2: user2.color
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [user1.position!.lng, user1.position!.lat],
                [user2.position!.lng, user2.position!.lat]
              ]
            }
          })
        }
      }
    }

    return {
      type: 'FeatureCollection',
      features
    }
  }, [currentUser, otherUsers])

  if (!currentUser?.position || otherUsers.length === 0) {
    return null
  }

  return (
    <Source
      id="constellation-lines"
      type="geojson"
      data={constellationData}
    >
      {/* Primary constellation lines (from me to others) */}
      <Layer
        id="constellation-primary"
        type="line"
        filter={['==', ['get', 'primary'], true]}
        paint={{
          'line-color': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, '#00D4FF',
            0.5, '#FFFFFF', 
            1, ['get', 'color']
          ],
          'line-width': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            12, 2,
            16, 4,
            20, 8
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'distance'],
            0, 0.8,
            CONNECTION_DISTANCE, 0.3
          ],
          'line-blur': 1
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
      />

      {/* Glow effect for primary lines */}
      <Layer
        id="constellation-primary-glow"
        type="line"
        filter={['==', ['get', 'primary'], true]}
        paint={{
          'line-color': '#FFFFFF',
          'line-width': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            12, 8,
            16, 12,
            20, 20
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'distance'],
            0, 0.3,
            CONNECTION_DISTANCE, 0.1
          ],
          'line-blur': 8
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
      />

      {/* Secondary constellation lines (between others) */}
      <Layer
        id="constellation-secondary"
        type="line"
        filter={['==', ['get', 'secondary'], true]}
        paint={{
          'line-color': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, ['get', 'color1'],
            1, ['get', 'color2']
          ],
          'line-width': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            12, 1,
            16, 2,
            20, 4
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'distance'],
            0, 0.4,
            CONNECTION_DISTANCE * 0.8, 0.1
          ],
          'line-blur': 2
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
      />
    </Source>
  )
}
