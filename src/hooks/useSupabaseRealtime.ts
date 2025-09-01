import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

type RecordType = {
  user_id?: string
  lat?: number
  lng?: number
  users?: {
    color_hash?: string
  }
  [key: string]: any
}

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const startRealtime = () => {
    if (!currentUser || channelRef.current) return
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
          const newRecord = payload.new as RecordType
          const oldRecord = payload.old as RecordType

          if ((newRecord.user_id && newRecord.user_id === currentUser.id) ||
              (oldRecord.user_id && oldRecord.user_id === currentUser.id)) {
            return
          }

          if (payload.eventType === 'DELETE' && oldRecord.user_id) {
            removeOtherUser(oldRecord.user_id)
          } else if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && newRecord.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('color_hash')
              .eq('id', newRecord.user_id)
              .single()
            const userColor = userData?.color_hash || generateStarColor()
            if (payload.eventType === 'INSERT') {
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
      usersData.forEach((userData: RecordType) => {
        if (userData.user_id !== currentUser.id) {
          addOtherUser({
            id: userData.user_id,
            color: userData.users?.color_hash || generateStarColor(),
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
