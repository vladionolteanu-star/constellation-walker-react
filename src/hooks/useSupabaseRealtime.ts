import { useEffect, useRef, useCallback } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { useUserStore } from '../store/userStore'

interface RealtimeUser {
  user_id: string
  color_hash: string
  lat: number
  lng: number
  updated_at: string
  is_online: boolean
}

export const useSupabaseRealtime = () => {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  
  const { 
    currentUser, 
    addOtherUser, 
    removeOtherUser, 
    clearOtherUsers 
  } = useUserStore()

  // Broadcast current user position
  const broadcastPosition = useCallback(async (position: { lat: number; lng: number }) => {
    if (!currentUser || !channelRef.current) {
      console.warn('⚠️ Cannot broadcast - no user or channel')
      return
    }

    const payload = {
      user_id: currentUser.id,
      color_hash: currentUser.color,
      lat: position.lat,
      lng: position.lng,
      updated_at: new Date().toISOString(),
      is_online: true
    }

    console.log('📡 Broadcasting position:', payload)

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'user_position',
        payload
      })

      // Also update database for persistence
      await supabase
        .from('active_positions')
        .upsert({
          user_id: currentUser.id,
          lat: position.lat,
          lng: position.lng,
          updated_at: new Date().toISOString()
        })

      console.log('✅ Position broadcasted and saved')
    } catch (error) {
      console.error('❌ Broadcast failed:', error)
    }
  }, [currentUser])

  // Start real-time connection
  const startRealtime = useCallback(() => {
    if (!currentUser) {
      console.warn('⚠️ Cannot start realtime - no current user')
      return
    }

    console.log('🚀 Starting real-time connection for user:', currentUser.id)

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new channel
    channelRef.current = supabase
      .channel('constellation-users', {
        config: {
          broadcast: { 
            self: false, // Don't receive our own broadcasts
            ack: false   // Don't wait for acknowledgment
          },
          presence: {
            key: currentUser.id
          }
        }
      })
      .on('broadcast', { event: 'user_position' }, (payload) => {
        console.log('📥 Received position update:', payload.payload)
        
        const userData = payload.payload as RealtimeUser
        
        // Don't add ourselves
        if (userData.user_id === currentUser.id) {
          return
        }

        // Add or update other user
        addOtherUser({
          id: userData.user_id,
          color: userData.color_hash,
          position: {
            lat: userData.lat,
            lng: userData.lng
          },
          isOnline: userData.is_online,
          lastSeen: new Date(userData.updated_at)
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key, leftPresences)
        if (key !== currentUser.id) {
          removeOtherUser(key)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time channel subscribed')
          
          // Track presence
          await channelRef.current?.track({
            user_id: currentUser.id,
            color_hash: currentUser.color,
            online_at: new Date().toISOString()
          })

          // Load existing users from database
          try {
            const { data: existingUsers } = await supabase
              .from('active_positions')
              .select('*')
              .gte('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
              .neq('user_id', currentUser.id)

            console.log('👥 Loaded existing users:', existingUsers?.length || 0)

            if (existingUsers) {
              existingUsers.forEach((userData) => {
                addOtherUser({
                  id: userData.user_id,
                  color: '#00D4FF', // Default color, should get from users table
                  position: {
                    lat: userData.lat,
                    lng: userData.lng
                  },
                  isOnline: true,
                  lastSeen: new Date(userData.updated_at)
                })
              })
            }
          } catch (error) {
            console.error('❌ Failed to load existing users:', error)
          }

          // Start heartbeat
          startHeartbeat()
        } else {
          console.error('❌ Real-time subscription failed:', status)
        }
      })
  }, [currentUser, addOtherUser, removeOtherUser])

  // Stop real-time connection  
  const stopRealtime = useCallback(() => {
    console.log('⏹️ Stopping real-time connection')
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    clearOtherUsers()
  }, [clearOtherUsers])

  // Heartbeat to keep connection alive and broadcast position
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
    }

    heartbeatRef.current = setInterval(() => {
      if (currentUser?.position) {
        broadcastPosition(currentUser.position)
      }
    }, 5000) // Every 5 seconds

    console.log('💓 Started heartbeat')
  }, [currentUser, broadcastPosition])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealtime()
    }
  }, [stopRealtime])

  // Auto-restart if user changes
  useEffect(() => {
    if (currentUser && currentUser.position) {
      startRealtime()
    }
  }, [currentUser?.id])

  return {
    startRealtime,
    stopRealtime,
    broadcastPosition
  }
}
