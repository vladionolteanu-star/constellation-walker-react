import { useEffect, useCallback, useRef } from 'react'
import { useUserStore } from '../store/userStore'
import { POSITION_UPDATE_INTERVAL } from '../utils/constants'
import toast from 'react-hot-toast'

export function useGeolocation() {
  const { updatePosition, currentUser } = useUserStore()
  const watchIdRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const hasShownLocationToast = useRef(false) // Previne spam-ul

  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this browser')
      return false
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'denied') {
        toast.error('Location permission denied. Please enable in browser settings.')
        return false
      }

      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            updatePosition({ lat: latitude, lng: longitude })
            
            // Arată toast-ul DOAR o dată
            if (!hasShownLocationToast.current) {
              toast.success('📍 Location found - you are now visible on the map')
              hasShownLocationToast.current = true
            }
            
            resolve(true)
          },
          (error) => {
            console.error('Geolocation error:', error)
            let errorMessage = 'Failed to get location'
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location unavailable'
                break
              case error.TIMEOUT:
                errorMessage = 'Location request timeout'
                break
            }
            
            toast.error(errorMessage)
            resolve(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })
    } catch (error) {
      console.error('Permission error:', error)
      toast.error('Failed to request location permission')
      return false
    }
  }, [updatePosition])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !currentUser) return

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now()
        
        if (now - lastUpdateRef.current < POSITION_UPDATE_INTERVAL) {
          return
        }
        
        lastUpdateRef.current = now
        
        const { latitude, longitude } = position.coords
        updatePosition({ lat: latitude, lng: longitude })
      },
      (error) => {
        console.error('Watch position error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 15000
      }
    )
  }, [updatePosition, currentUser])

  useEffect(() => {
    if (currentUser) {
      startWatching()
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [currentUser, startWatching])

  return { 
    requestPermission,
    startWatching
  }
}
