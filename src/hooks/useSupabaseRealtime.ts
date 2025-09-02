import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, updateOtherUser } = useUserStore()
  const channelRef = useRef<any>(null)
  const hasShownConnectionToast = useRef(false)

  const startRealtime = () => {
    if (!currentUser || channelRef.current) return

    console.log('Starting realtime connection...')

    // Încarcă userii existenți
    loadInitialUsers()

    // Creează channel pentru realtime updates
    const channel = supabase
      .channel('active-users')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_positions',
          filter: `user_id=neq.${currentUser.id}`
        },
        async (payload) => {
          console.log('New user detected:', payload)
          const newPosition = payload.new as any
          
          // Ia culoarea userului
          const { data: userData } = await supabase
            .from('users')
            .select('color_hash')
            .eq('id', newPosition.user_id)
            .single()

          const userColor = userData?.color_hash || generateStarColor()
          
          addOtherUser({
            id: newPosition.user_id,
            color: userColor,
            position: {
              lat: newPosition.lat,
              lng: newPosition.lng
            }
          })

          toast(`✨ New star appeared nearby!`, {
            icon: '🌟',
            duration: 2000
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_positions',
          filter: `user_id=neq.${currentUser.id}`
        },
        (payload) => {
          const updatedPosition = payload.new as any
          updateOtherUser(updatedPosition.user_id, {
            lat: updatedPosition.lat,
            lng: updatedPosition.lng
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'active_positions'
        },
        (payload) => {
          const oldPosition = payload.old as any
          removeOtherUser(oldPosition.user_id)
          toast(`A star faded away`, {
            icon: '💫',
            duration: 2000
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !hasShownConnectionToast.current) {
          toast.success('🔗 Connected to constellation network')
          hasShownConnectionToast.current = true
        }
      })

    channelRef.current = channel

    // Update propria poziție mai des
    const positionInterval = setInterval(async () => {
      if (currentUser?.position) {
        await supabase.from('active_positions').upsert({
          user_id: currentUser.id,
          lat: currentUser.position.lat,
          lng: currentUser.position.lng,
          updated_at: new Date().toISOString()
        })
      }
    }, 5000) // La fiecare 5 secunde

    channelRef.current.interval = positionInterval
  }

  const loadInitialUsers = async () => {
    if (!currentUser) return

    try {
      // Query pentru toți userii activi
      const { data: positions, error } = await supabase
        .from('active_positions')
        .select('*')
        .neq('user_id', currentUser.id)
        .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())

      if (error) {
        console.error('Error loading positions:', error)
        return
      }

      if (positions && positions.length > 0) {
        // Încarcă culoarea pentru fiecare user
        for (const pos of positions) {
          const { data: userData } = await supabase
            .from('users')
            .select('color_hash')
            .eq('id', pos.user_id)
            .single()

          const userColor = userData?.color_hash || generateStarColor()
          
          addOtherUser({
            id: pos.user_id,
            color: userColor,
            position: {
              lat: pos.lat,
              lng: pos.lng
            }
          })
        }

        toast(`🌌 Found ${positions.length} ${positions.length === 1 ? 'star' : 'stars'} nearby!`, {
          icon: '✨',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const stopRealtime = () => {
    if (channelRef.current) {
      if (channelRef.current.interval) {
        clearInterval(channelRef.current.interval)
      }
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
