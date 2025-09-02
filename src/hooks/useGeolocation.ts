import { useEffect, useCallback, useRef } from 'react'
import { useUserStore } from '../store/userStore'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

export function useGeolocation() {
  const { updatePosition, currentUser } = useUserStore()
  const watchIdRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const hasShownLocationToast = useRef(false)

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
          async (position) => {
            const { latitude, longitude } = position.coords
            console.log('📍 Got GPS position:', latitude, longitude)
            
            // Update local state
            await updatePosition({ lat: latitude, lng: longitude })
            
            // Update database IMMEDIATELY
            if (currentUser) {
              const { error } = await supabase.from('active_positions').upsert({
                user_id: currentUser.id,
                lat: latitude,
                lng: longitude,
                updated_at: new Date().toISOString()
              })
              
              if (!error) {
                console.log('✅ Initial position saved to DB')
              } else {
                console.error('❌ Failed to save position:', error)
              }
            }
            
            if (!hasShownLocationToast.current) {
              toast.success('📍 Location found - you are now visible')
              hasShownLocationToast.current = true
            }
            
            resolve(true)
          },
          (error) => {
            console.error('Geolocation error:', error)
            toast.error('Failed to get location')
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
  }, [updatePosition, currentUser])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !currentUser) return

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    console.log('👁️ Starting position watch...')

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now()
        
        // Update every 5 seconds
        if (now - lastUpdateRef.current < 5000) {
          return
        }
        
        lastUpdateRef.current = now
        
        const { latitude, longitude } = position.coords
        console.log('📍 Position update:', latitude, longitude)
        
        // Update local
        updatePosition({ lat: latitude, lng: longitude })
        
        // Update database
        if (currentUser) {
          await supabase.from('active_positions').upsert({
            user_id: currentUser.id,
            lat: latitude,
            lng: longitude,
            updated_at: new Date().toISOString()
          })
        }
      },
      (error) => {
        console.error('Watch position error:', error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
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
