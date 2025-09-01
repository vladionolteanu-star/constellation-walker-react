import { useEffect, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

// Am corectat tipul 'users' pentru a fi un array de obiecte,
// așa cum este returnat de Supabase
type RecordType = {
  user_id: string
  lat?: number
  lng?: number
  users?: {
    color_hash?: string
  }[]
  [key: string]: any
}

// Am făcut tipul de payload mai flexibil pentru a evita erorile
type TypedPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any> | null
  old: Record<string, any> | null
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
        async (payload: any) => {
          // Aici facem o verificare mai robustă înainte de a accesa proprietățile
          const { eventType } = payload
          const newRecord = payload.new as RecordType | null
          const oldRecord = payload.old as RecordType | null

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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          toast.success('🔗 Conectat la rețeaua de constelații')
          loadInitialUsers()
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime connection failed')
          toast.error('Nu s-a putut conecta la rețeaua de constelații')
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
            // Aici am corectat accesul la `color_hash`, deoarece `users` este un array
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
