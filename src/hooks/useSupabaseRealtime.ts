import { useEffect, useRef } from 'react'
import { supabase, getUsersInArea } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<any>(null)

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
        (payload: any) => {
          console.log('Realtime event:', payload)
          // Simplificat complet pentru moment
        }
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected')
          toast.success('🔗 Connected to constellation network')
          loadInitialUsers()
        }
      })

    channelRef.current = channel
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return
    try {
      const usersData = await getUsersInArea()
      console.log('Loaded users:', usersData)
    } catch (error) {
      console.error('Failed to load users:', error)
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

  return {
    startRealtime,
    stopRealtime
  }
}
