import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const hasShownConnectionToast = useRef(false)

  const startRealtime = () => {
    if (!currentUser || channelRef.current) return

    // Create realtime channel
    const channel = supabase
      .channel('constellation-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_positions'
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          // Skip own position updates
          if (newRecord?.user_id === currentUser.id || oldRecord?.user_id === currentUser.id) {
            return
          }

          if (eventType === 'DELETE') {
            removeOtherUser(oldRecord.user_id)
            toast(`⭐ A star has left the constellation`, {
              icon: '💫',
              duration: 2000
            })
          } else if (eventType === 'INSERT') {
            // Get user color from database or generate new one
            const { data: userData } = await supabase
              .from('users')
              .select('color_hash')
              .eq('id', newRecord.user_id)
              .single()

            const userColor = userData?.color_hash || generateStarColor()

            addOtherUser({
              id: newRecord.user_id,
              color: userColor,
              position: {
                lat: newRecord.lat,
                lng: newRecord.lng
              }
            })

            // Anunță când apare un user nou
            toast(`✨ A new star has entered your constellation!`, {
              icon: '🌟',
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }
            })
          } else if (eventType === 'UPDATE') {
            updateOtherUser(newRecord.user_id, {
              lat: newRecord.lat,
              lng: newRecord.lng
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          if (!hasShownConnectionToast.current) {
            toast.success('🔗 Connected to constellation network')
            hasShownConnectionToast.current = true
          }
          loadInitialUsers()
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection failed')
          toast.error('Failed to connect to constellation network')
        }
      })

    channelRef.current = channel
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return

    try {
      const usersData = await getUsersInArea()
      
      let loadedCount = 0
      usersData.forEach((userData: any) => {
        if (userData.user_id !== currentUser.id) {
          // Verifică că avem datele necesare
          const userColor = userData.users?.color_hash || generateStarColor()
          
          addOtherUser({
            id: userData.user_id,
            color: userColor,
            position: {
              lat: userData.lat,
              lng: userData.lng
            }
          })
          loadedCount++
        }
      })

      if (loadedCount > 0) {
        toast(`🌌 Found ${loadedCount} ${loadedCount === 1 ? 'star' : 'stars'} nearby!`, {
          icon: '✨',
          duration: 3000
        })
      }

      console.log(`🔍 Loaded ${loadedCount} nearby users`)
    } catch (error) {
      console.error('Failed to load initial users:', error)
    }
  }

  const stopRealtime = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealtime()
    }
  }, [])

  // Auto-cleanup old positions
  useEffect(() => {
    if (!currentUser) return

    const cleanup = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      await supabase
        .from('active_positions')
        .delete()
        .lt('updated_at', fiveMinutesAgo)
    }

    // Cleanup every minute
    const interval = setInterval(cleanup, 60000)
    
    return () => clearInterval(interval)
  }, [currentUser])

  // Broadcast own position periodically pentru a fi siguri că suntem vizibili
  useEffect(() => {
    if (!currentUser?.position) return

    const broadcastPosition = async () => {
      await supabase.from('active_positions').upsert({
        user_id: currentUser.id,
        lat: currentUser.position!.lat,
        lng: currentUser.position!.lng,
        updated_at: new Date().toISOString()
      })
    }

    // Broadcast imediat
    broadcastPosition()

    // Apoi la fiecare 10 secunde
    const interval = setInterval(broadcastPosition, 10000)

    return () => clearInterval(interval)
  }, [currentUser?.position])

  return {
    startRealtime,
    stopRealtime
  }
}
