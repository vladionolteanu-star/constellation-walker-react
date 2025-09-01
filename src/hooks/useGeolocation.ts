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
            updatePosition({ la
