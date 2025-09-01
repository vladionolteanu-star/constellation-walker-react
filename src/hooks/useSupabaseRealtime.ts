import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

// Type for the active_positions table row
type PositionRecord = {
  user_id: string
  lat?: number
  lng?: number
  [key: string]: any
}

// Type for the joined data in getUsersInArea
type InitialUserRecord = {
  user_id: string
  lat?: number
  lng?: number
  users?: {
    color_hash?: string
  }[]
  [key: string]: any
}

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const startRealtime = () => {
    if (!currentUser || channelRef.current) return

    const channel = supabase
      .channel('constellation-realtime')
      .on<PositionRecord>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_positions'
        },
        async (payload) => {
          console.log('Payload primit:', payload)

          switch (payload.eventType) {
            case 'DELETE': {
              const oldRecord = payload.old
              if (oldRecord.user_id === currentUser.id) return
              removeOtherUser(oldRecord.user_id)
              break
            }
            case 'INSERT':
            case 'UPDATE': {
              const newRecord = payload.new
              if (newRecord.user_id === currentUser.id) return

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
              break
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          toast.success('🔗 Conectat la rețeaua de constelații')
          loadInitialUsers()
        } else if (err) {
          console.error('❌ Realtime error:', err)
          toast.error('Conexiune Realtime eșuată')
        }
      })

    channelRef.current = channel
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return
    try {
      const usersData = await getUsersInArea()
      console.log('Utilizatori încărcați:', usersData)
      usersData.forEach((userData: InitialUserRecord) => {
        if (userData.user_id !== currentUser.id) {
          addOtherUser({
            id: userData.user_id,
            color: userData.users?.[0]?.color_hash || generateStarColor(),
            position: {
              lat: userData.lat,
              lng: userData.lng
            }
          })
        }
      })
      console.log(`📍 S-au încărcat ${usersData.length} utilizatori din apropiere`)
    } catch (error) {
      console.error('Nu s-au putut încărca utilizatorii inițiali:', error)
    }
  }

  const stopRealtime = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      await supabase.removeChannel(channelRef.current)
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
