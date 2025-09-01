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
          console.log('Payload primit:', payload)
          const { eventType, new: newRecord, old: oldRecord } = payload

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
