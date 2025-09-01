import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

type RecordType = {
  user_id: string
  lat?: number
  lng?: number
  color_hash?: string
  [key: string]: any
}

type TypedPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: RecordType | null
  old: RecordType | null
}

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const loadInitialUsers = async () => {
    if (!currentUser) return
    try {
      const usersData = await getUsersInArea()
      console.log('Utilizatori încărcați:', usersData)

      usersData.forEach((userData: RecordType) => {
        if (userData.user_id !== currentUser.id) {
          addOtherUser({
            id: userData.user_id,
            color: userData.color_hash || generateStarColor(),
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
        async (payload: TypedPayload) => {
          console.log('📡 Payload primit:', payload)

          const eventType = payload.eventType
          const newRecord = payload.new as RecordType | null
          const oldRecord = payload.old as RecordType | null

          // Ignoră evenimentele de la userul curent
          if (
            (newRecord?.user_id && newRecord.user_id === currentUser.id) ||
            (oldRecord?.user_id && oldRecord.user_id === currentUser.id)
          ) {
            return
          }

          if (eventType === 'DELETE' && oldRecord?.user_id) {
            removeOtherUser(oldRecord.user_id)
          } else if (
            (eventType === 'INSERT' || eventType === 'UPDATE') &&
            newRecord?.user_id
          ) {
            const userColor = newRecord.color_hash || generateStarColor()

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
          toast.success('🔗 Conectat la rețeaua de constelații')
          loadInitialUsers()
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error')
          toast.error('Conexiune Realtime eșuată')
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Realtime channel closed')
        }
      })

    channelRef.current = channel
  }

  const stopRealtime = async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
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
      try {
        await supabase
          .from('active_positions')
          .delete()
          .lt('updated_at', fiveMinutesAgo)
      } catch (err) {
        console.error('Eroare la cleanup:', err)
      }
    }

    const interval = setInterval(cleanup, 60_000)
    return () => clearInterval(interval)
  }, [currentUser])

  return {
    startRealtime,
    stopRealtime
  }
}
