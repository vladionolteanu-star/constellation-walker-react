import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

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
          } else if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Get user color from database
            const { data: userData } = await supabase
              .from('users')
              .select('color_hash')
              .eq('id', newRecord.user_id)
              .single()

            const userColor = userData?.color_hash || generateStarColor()

            if (eventType === 'INSERT') {
              addOtherUser({
                id: newRecord.user_id,
                color: userColor,
                position: {
                  lat: newRecord.lat,
                  lng: newRecord.lng
                }
              })
            } else {
              updateOtherUser(newRecord.user_id, {
                lat: newRecord.lat,
                lng: newRecord.lng
              })
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          toast.success('🔗 Connected to constellation network')
          
          // Load initial users
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
      
      usersData.forEach((userData: any) => {
        if (userData.user_id !== currentUser.id) {
          addOtherUser({
            id: userData.user_id,
            color: userData.users.color_hash,
            position: {
              lat: userData.lat,
              lng: userData.lng
            }
          })
        }
      })

      console.log(`📍 Loaded ${usersData.length} nearby users`)
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

  return {
    startRealtime,
    stopRealtime
  }
}
