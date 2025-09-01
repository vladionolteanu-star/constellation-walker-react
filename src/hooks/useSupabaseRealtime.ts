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

    const channel = supabase
      .channel('constellation-realtime')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'active_positions'
        },
        async (payload) => {
  console.log('PAYLOAD RECEIVED:', payload)
  // Temporar - skip tot pentru a vedea structura
  return
}

          if (eventType === 'DELETE' && oldUserId) {
            removeOtherUser(oldUserId)
          } else if ((eventType === 'INSERT' || eventType === 'UPDATE') && newUserId) {
            const { data: userData } = await supabase
              .from('users')
              .select('color_hash')
              .eq('id', newUserId)
              .single()

            const userColor = userData?.color_hash || generateStarColor()

            if (eventType === 'INSERT') {
              addOtherUser({
                id: newUserId,
                color: userColor,
                position: {
                  lat: (newRecord as any).lat,
                  lng: (newRecord as any).lng
                }
              })
            } else {
              updateOtherUser(newUserId, {
                lat: (newRecord as any).lat,
                lng: (newRecord as any).lng
              })
            }
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          toast.success('🔗 Connected to constellation network')
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
          const userColor = userData.users?.color_hash || generateStarColor()
          addOtherUser({
            id: userData.user_id,
            color: userColor,
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

  useEffect(() => {
    return () => {
      stopRealtime()
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    const cleanup = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      
      await supabase
        .from('active_positions')
        .delete()
        .lt('updated_at', fiveMinutesAgo)
    }

    const interval = setInterval(cleanup, 60000)
    return () => clearInterval(interval)
  }, [currentUser])

  return {
    startRealtime,
    stopRealtime
  }
}
