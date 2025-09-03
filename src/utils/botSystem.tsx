import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import 'mapbox-gl/dist/mapbox-gl.css'

interface User {
  user_id: string
  color: string
  position: {
    lat: number
    lng: number
  }
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)

  const [users, setUsers] = useState<Record<string, User>>({})
  const markers = useRef<Record<string, any>>({})
  const userId = useRef(`user-${Date.now()}`)
  const channel = useRef<any>(null)

  // 🔹 Debounce helper
  function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 🔹 Update connections between users
  const updateConnections = useCallback(
    debounce((userList: User[]) => {
      if (!mapRef.current || userList.length < 2) return

      const features = []
      for (let i = 0; i < userList.length; i++) {
        for (let j = i + 1; j < userList.length; j++) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [userList[i].position.lng, userList[i].position.lat],
                [userList[j].position.lng, userList[j].position.lat],
              ],
            },
          })
        }
      }

      const source = mapRef.current.getSource('connections')
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features,
        })
      }
    }, 200),
    []
  )

  // 🔹 Setup map layers
  const setupMapLayers = useCallback(() => {
    if (!mapRef.current) return

    if (!mapRef.current.getSource('connections')) {
      mapRef.current.addSource('connections', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })

      mapRef.current.addLayer({
        id: 'connections',
        type: 'line',
        source: 'connections',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#00ffff',
          'line-width': 2,
          'line-opacity': 0.6,
        },
      })
    }
  }, [])

  // 🔹 Marker element
  const createMarkerElement = useCallback((user: User) => {
    const el = document.createElement('div')
    el.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      background-color: ${
        user.user_id === userId.current
          ? '#00ff00'
          : user.user_id.includes('bot')
          ? '#ff00ff'
          : '#00ffff'
      };
      box-shadow: 0 0 20px ${
        user.user_id === userId.current
          ? '#00ff00'
          : user.user_id.includes('bot')
          ? '#ff00ff'
          : '#00ffff'
      };
    `
    return el
  }, [])

  // 🔹 Add user marker
  const addUserToMap = useCallback(
    (user: User) => {
      if (!mapRef.current || !mapboxgl) return

      if (markers.current[user.user_id]) {
        markers.current[user.user_id].remove()
      }

      const el = createMarkerElement(user)
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([user.position.lng, user.position.lat])
        .addTo(mapRef.current)

      markers.current[user.user_id] = marker
    },
    [mapboxgl, createMarkerElement]
  )

  // 🔹 Update user pos
  const updateUserPosition = useCallback((user: User) => {
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].setLngLat([
        user.position.lng,
        user.position.lat,
      ])
    }
    setUsers((prev) => ({ ...prev, [user.user_id]: user }))
  }, [])

  // 🔹 Setup realtime
  const setupRealtime = useCallback(() => {
    if (channel.current) {
      channel.current.unsubscribe()
    }

    channel.current = supabase
      .channel('user-tracking')
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((user: User) => {
          if (user.user_id !== userId.current) {
            addUserToMap(user)
            setUsers((prev) => ({ ...prev, [user.user_id]: user }))
          }
        })
      })
      .subscribe()
  }, [addUserToMap])

  // 🔹 Init map
  useEffect(() => {
    const init = async () => {
      const mapbox = await import('mapbox-gl')
      mapbox.accessToken =
        'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g'
      setMapboxgl(mapbox)

      if (mapContainer.current && !mapRef.current) {
        mapRef.current = new mapbox.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
          center: [26.1025, 44.4268],
          zoom: 14,
          pitch: 45,
        })

        mapRef.current.on('load', () => {
          setupMapLayers()

          // Static bots + self
          const staticUsers: Record<string, User> = {
            'bot-alpha': {
              user_id: 'bot-alpha',
              color: '#ff00ff',
              position: { lat: 44.4268, lng: 26.1025 },
            },
            'bot-beta': {
              user_id: 'bot-beta',
              color: '#ff00ff',
              position: { lat: 44.425, lng: 26.105 },
            },
            [userId.current]: {
              user_id: userId.current,
              color: '#00ff00',
              position: { lat: 44.427, lng: 26.107 },
            },
          }

          Object.values(staticUsers).forEach(addUserToMap)
          setUsers(staticUsers)

          setupRealtime()

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const updatedUser: User = {
                  user_id: userId.current,
                  color: '#00ff00',
                  position: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  },
                }
                updateUserPosition(updatedUser)
                if (channel.current) {
                  channel.current.track(updatedUser)
                }
              },
              undefined,
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            )
          }
        })
      }
    }

    init()

    return () => {
      if (channel.current) channel.current.unsubscribe()
      Object.values(markers.current).forEach((m) => m.remove())
      markers.current = {}
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [setupMapLayers, addUserToMap, updateUserPosition, setupRealtime])

  // 🔹 Draw connections
  useEffect(() => {
    const userList = Object.values(users)
    if (userList.length >= 2) {
      updateConnections(userList)
    }
  }, [users, updateConnections])

  return <div ref={mapContainer} className="w-full h-screen bg-black" />
}

export default MapContainer
