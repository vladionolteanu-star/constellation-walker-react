import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'
import { generateStarColor } from '../utils/constants'
import toast from 'react-hot-toast'

export function useSupabaseRealtime() {
  const { currentUser, addOtherUser, removeOtherUser, setOtherUsers } = useUserStore()
  const channelRef = useRef<any>(null)
  const hasShownConnectionToast = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout>()

  const loadInitialUsers = async () => {
    if (!currentUser) return
    try {
      // Single query with JOIN - rezolvă N+1 problem
      const { data, error } = await supabase
        .from('active_positions')
        .select(`
          user_id,
          lat,
          lng,
          updated_at,
          users!inner(color_hash)
        `)
        .gt('updated_at', new Date(Date.now() - 30000).toISOString())
        .neq('user_id', currentUser.id)

      if (error) throw error
      
      console.log(`📍 Found ${data?.length || 0} active positions`)
      
      // Batch update all users at once
      const otherUsers = data?.map(pos => ({
        id: pos.user_id,
        color: pos.users?.color_hash || generateStarColor(),
        position: { lat: pos.lat, lng: pos.lng },
      })) || []
      
      setOtherUsers(otherUsers)
    } catch (error) {
      console.error('❌ Failed to load users:', error)
    }
  }

  const startRealtime = () => {
    if (!currentUser) return
    console.log('🚀 Starting realtime for user:', currentUser.id)

    loadInitialUsers()

    // Debounced position update
    const updatePosition = () => {
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
    }

    // Initial position update
    updatePosition()

    // Set up debounced updates every 2 seconds instead of instant
    const positionInterval = setInterval(updatePosition, 2000)

    channelRef.current = supabase
      .channel('active_positions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'active_positions' }, 
        async (payload) => {
          const { eventType, new: newData, old: oldData } = payload
          
          // Debounce updates - accumulate changes
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }
          
          updateTimeoutRef.current = setTimeout(async () => {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
              if (newData.user_id === currentUser.id) return
              
              // Check if we already have user data
              const existingUser = useUserStore.getState().otherUsers.find(u => u.id === newData.user_id)
              
              if (existingUser) {
                // Just update position, don't fetch user data again
                addOtherUser({
                  id: newData.user_id,
                  color: existingUser.color,
                  position: { lat: newData.lat, lng: newData.lng },
                })
              } else {
                // New user - fetch their data
                const { data: userData } = await supabase
                  .from('users')
                  .select('color_hash')
                  .eq('id', newData.user_id)
                  .single()
                  
                addOtherUser({
                  id: newData.user_id,
                  color: userData?.color_hash || generateStarColor(),
                  position: { lat: newData.lat, lng: newData.lng },
                })
              }
            } else if (eventType === 'DELETE') {
              removeOtherUser(oldData.user_id)
            }
          }, 300) // 300ms debounce
        }
      )
      .subscribe()

    // Store interval reference for cleanup
    channelRef.current._positionInterval = positionInterval

    if (!hasShownConnectionToast.current) {
      setTimeout(() => {
        toast.success('🔗 Connected to constellation network')
        hasShownConnectionToast.current = true
      }, 1000)
    }
  }

  const stopRealtime = () => {
    console.log('Stopping realtime...')
    
    // Clear debounce timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    if (channelRef.current) {
      // Clear position interval
      if (channelRef.current._positionInterval) {
        clearInterval(channelRef.current._positionInterval)
      }
      
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  useEffect(() => {
    return () => stopRealtime()
  }, [])

  return { startRealtime, stopRealtime }
}
