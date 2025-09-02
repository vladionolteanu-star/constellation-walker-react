import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<any>(null)
  const hasShownConnectionToast = useRef(false)
  const updateIntervalRef = useRef<any>(null)

  const startRealtime = () => {
    if (!currentUser) {
      console.log('No current user, skipping realtime')
      return
    }

    console.log('🚀 Starting realtime for user:', currentUser.id)

    // Încarcă userii existenți IMEDIAT
    loadInitialUsers()

    // Update propria poziție IMEDIAT
    if (currentUser.position) {
      supabase.from('active_positions').upsert({
        user_id: currentUser.id,
        lat: currentUser.position.lat,
        lng: currentUser.position.lng,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error('Error updating position:', error)
        else console.log('✅ Position updated in DB')
      })
    }

    // Polling pentru alți useri (mai sigur decât realtime)
    updateIntervalRef.current = setInterval(() => {
      loadInitialUsers()
      
      // Update și propria poziție
      if (currentUser.position) {
        supabase.from('active_positions').upsert({
          user_id: currentUser.id,
          lat: currentUser.position.lat,
          lng: currentUser.position.lng,
          updated_at: new Date().toISOString()
        })
      }
    }, 3000) // Check every 3 seconds

    // Arată toast doar o dată
    if (!hasShownConnectionToast.current) {
      setTimeout(() => {
        toast.success('🔗 Connected to constellation network')
        hasShownConnectionToast.current = true
      }, 1000)
    }
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return

    try {
      // Query pentru TOȚI userii activi (inclusiv tine pentru debug)
      const { data: positions, error } = await supabase
        .from('active_positions')
        .select('*')
        .gte('updated_at', new Date(Date.now() - 60 * 1000).toISOString()) // Ultimul minut

      if (error) {
        console.error('❌ Error loading positions:', error)
        return
      }

      console.log(`📍 Found ${positions?.length || 0} active positions in DB`)

      if (positions && positions.length > 0) {
        // Procesează fiecare poziție
        for (const pos of positions) {
          // Skip propriul user
          if (pos.user_id === currentUser.id) {
            console.log('Skipping own position')
            continue
          }

          // Ia culoarea userului
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('color_hash')
            .eq('id', pos.user_id)
            .single()

          if (userError) {
            console.error('Error fetching user data:', userError)
          }

          const userColor = userData?.color_hash || generateStarColor()
          
          console.log(`Adding/updating user: ${pos.user_id.slice(0, 8)}... at ${pos.lat}, ${pos.lng}`)
          
          // Adaugă sau update user
          addOtherUser({
            id: pos.user_id,
            color: userColor,
            position: {
              lat: pos.lat,
              lng: pos.lng
            }
          })
        }

        // Toast doar pentru useri noi
        const otherUsersCount = positions.length - 1 // Minus tu
        if (otherUsersCount > 0) {
          console.log(`🌟 ${otherUsersCount} other stars visible`)
        }
      } else {
        console.log('No other users found in database')
      }
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }

  const stopRealtime = () => {
    console.log('Stopping realtime...')
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopRealtime()
    }
  }, [])

  return {
    startRealtime,
    stopRealtime
  }
}
