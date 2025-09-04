import { useState, useEffect, useCallback } from 'react'

interface Position {
  lat: number
  lng: number
}

interface GeolocationState {
  position: Position | null
  error: string | null
  isLoading: boolean
  isPermissionGranted: boolean
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
    isPermissionGranted: false
  })

  const updatePosition = useCallback((position: GeolocationPosition) => {
    const newPos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    
    console.log('📍 Location updated:', newPos)
    
    setState(prev => ({
      ...prev,
      position: newPos,
      isLoading: false,
      error: null,
      isPermissionGranted: true
    }))
  }, [])

  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('❌ Geolocation error:', error.message)
    
    let errorMessage = 'Unknown location error'
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable'
        break
      case error.TIMEOUT:
        errorMessage = 'Location request timed out'
        break
    }
    
    setState(prev => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      isPermissionGranted: false
    }))
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported by this browser',
        isPermissionGranted: false
      }))
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request permission first
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'denied') {
        setState(prev => ({
          ...prev,
          error: 'Location permission denied',
          isLoading: false,
          isPermissionGranted: false
        }))
        return false
      }

      // Get current position
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )

      return true
    } catch (error) {
      handleError({
        code: 3,
        message: 'Permission request failed',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError)
      return false
    }
  }, [updatePosition, handleError])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !state.isPermissionGranted) {
      console.warn('⚠️ Cannot start watching - no permission or support')
      return null
    }

    console.log('👀 Starting location watch...')
    
    const watchId = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    )

    return watchId
  }, [updatePosition, handleError, state.isPermissionGranted])

  const stopWatching = useCallback((watchId: number | null) => {
    if (watchId !== null && navigator.geolocation) {
      console.log('⏹️ Stopping location watch')
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Auto-request permission on mount
  useEffect(() => {
    if (!state.position && !state.error && !state.isLoading) {
      requestPermission()
    }
  }, [requestPermission, state])

  return {
    ...state,
    requestPermission,
    startWatching,
    stopWatching
  }
}
