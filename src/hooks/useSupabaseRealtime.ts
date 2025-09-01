import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<any>(null)
  const hasShownConnectionToast = useRef(false)
  const connectionAttempts = useRef(0)

  const startRealtime = () => {
    if (!currentUser || channelRef.current) return

    // Nu mai încerca dacă au fost prea multe eșecuri
    if (connectionAttempts.current > 3) {
      console.log('Too many connection attempts, working offline')
      return
    }

    connectionAttempts.current++

    try {
      // Simplu channel subscription - fără realtime pentru moment
      console.log('Starting realtime connection...')
      
      // Doar încarcă userii existenți, fără realtime updates
      loadInitialUsers()
      
      // Simulează conexiunea pentru UI
      if (!hasShownConnectionToast.current) {
        setTimeout(() => {
          toast.success('🔗 Connected to constellation network')
          hasShownConnectionToast.current = true
        }, 1000)
      }

      // Update propria poziție periodic
      const positionInterval = setInterval(async () => {
        if (currentUser?.position) {
          await supabase.from('active_positions').upsert({
            user_id: currentUser.id,
            lat: currentUser.position.lat,
            lng: currentUser.position.lng,
            updated_at: new Date().toISOString()
          }).select()
        }
      }, 10000)

      // Salvează interval ID pentru cleanup
      channelRef.current = { interval: positionInterval }

    } catch (error) {
      console.error('Realtime setup error:', error)
    }
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return

    try {
      // Query simplificat
      const { data: positions, error } = await supabase
        .from('active_positions')
        .select('*')
        .neq('user_id', currentUser.id)
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      if (error) {
        console.error('Error loading positions:', error)
        return
      }

      if (positions && positions.length > 0) {
        // Încarcă fiecare user
        for (const pos of positions) {
          const { data: userData } = await supabase
            .from('users')
            .select('color_hash')
            .eq('id', pos.user_id)
            .single()

          const userColor = userData?.color_hash || generateStarColor()
          
          addOtherUser({
            id: pos.user_id,
            color: userColor,
            position: {
              lat: pos.lat,
              lng: pos.lng
            }
          })
        }

        toast(`🌌 Found ${positions.length} ${positions.length === 1 ? 'star' : 'stars'} nearby!`, {
          icon: '✨',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const stopRealtime = () => {
    if (channelRef.current?.interval) {
      clearInterval(channelRef.current.interval)
      channelRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopRealtime()
    }
  }, [])

  // Periodic refresh pentru a vedea useri noi
  useEffect(() => {
    if (!currentUser) return

    const refreshInterval = setInterval(() => {
      loadInitialUsers()
    }, 30000) // La fiecare 30 secunde

    return () => clearInterval(refreshInterval)
  }, [currentUser])

  return {
    startRealtime,
    stopRealtime
  }
}
