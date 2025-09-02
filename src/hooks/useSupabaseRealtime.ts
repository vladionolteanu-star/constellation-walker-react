import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser } = useUserStore()
  const channelRef = useRef<any>(null)
  const hasShownConnectionToast = useRef(false)

  const loadInitialUsers = async () => {
    if (!currentUser) return
    try {
      const { data: positions, error } = await supabase
        .from('active_positions')
        .select('*')
        .gt('updated_at', new Date(Date.now() - 30000).toISOString())
      if (error) throw error
      console.log(`📍 Found ${positions?.length || 0} active positions`)
      for (const pos of positions) {
        if (pos.user_id === currentUser.id) continue
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('color_hash')
          .eq('id', pos.user_id)
          .single()
        if (userError) console.error('Error fetching user data:', userError)
        addOtherUser({
          id: pos.user_id,
          color: userData?.color_hash || generateStarColor(),
          position: { lat: pos.lat, lng: pos.lng },
        })
      }
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }

  const startRealtime = () => {
    if (!currentUser) return
    console.log('🚀 Starting realtime for user:', currentUser.id)

    loadInitialUsers()

    if (currentUser.position) {
      supabase
        .from('active_positions')
        .upsert({
          user_id: currentUser.id,
          lat: currentUser.position.lat,
          lng: currentUser.position.lng,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.error('Error updating position:', error)
        })
    }

    channelRef.current = supabase
      .channel('active_positions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_positions' }, async (payload) => {
        const { eventType, new: newData, old: oldData } = payload
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          if (newData.user_id === currentUser.id) return
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('color_hash')
            .eq('id', newData.user_id)
            .single()
          if (userError) console.error('Error fetching user data:', userError)
          addOtherUser({
            id: newData.user_id,
            color: userData?.color_hash || generateStarColor(),
            position: { lat: newData.lat, lng: newData.lng },
          })
        } else if (eventType === 'DELETE') {
          removeOtherUser(oldData.user_id)
        }
      })
      .subscribe()

    if (!hasShownConnectionToast.current) {
      setTimeout(() => {
        toast.success('🔗 Connected to constellation network')
        hasShownConnectionToast.current = true
      }, 1000)
    }
  }

  const stopRealtime = () => {
    console.log('Stopping realtime...')
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  useEffect(() => {
    return () => stopRealtime()
  }, [])

  return { startRealtime, stopRealtime }
}
