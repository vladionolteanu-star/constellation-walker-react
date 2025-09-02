import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl'
import { useUserStore } from '../../store/userStore'
import { calculateDistance } from '../../utils/constants'

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

    // Connect to all users with position
    const connectedUsers = otherUsers.filter(user => user.position)

    // Create light ray connections to all users
    connectedUsers.forEach((user, index) => {
      features.push({
        type: 'Feature',
        properties: {
          distance: calculateDistance(
            myPosition.lat,
            myPosition.lng,
            user.position!.lat,
            user.position!.lng
          ),
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

    // Create interconnections between all users
    for (let i = 0; i < connectedUsers.length; i++) {
      for (let j = i + 1; j < connectedUsers.length; j++) {
        const user1 = connectedUsers[i]
        const user2 = connectedUsers[j]
        
        features.push({
          type: 'Feature',
          properties: {
            distance: calculateDistance(
              user1.position!.lat,
              user1.position!.lng,
              user2.position!.lat,
              user2.position!.lng
            ),
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
      {/* Enhanced light ray effect for primary connections */}
      <Layer
        id="constellation-primary"
        type="line"
        filter={['==', ['get', 'primary'], true]}
        paint={{
          'line-color': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0, '#FFFFFF',
            0.5, ['get', 'color'],
            1, '#FFFFFF'
          ],
          'line-width': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            12, 3,
            16, 6,
            20, 12
          ],
          'line-opacity': 0.8,
          'line-blur': 3
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
      />

      {/* Outer glow effect for primary connections */}
      <Layer
        id="constellation-primary-glow"
        type="line"
        filter={['==', ['get', 'primary'], true]}
        paint={{
          'line-color': ['get', 'color'],
          'line-width': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            12, 8,
            16, 16,
            20, 24
          ],
          'line-opacity': 0.2,
          'line-blur': 15
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
      />

      {/* Secondary connections */}
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
            12, 2,
            16, 4,
            20, 8
          ],
          'line-opacity': 0.4,
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
