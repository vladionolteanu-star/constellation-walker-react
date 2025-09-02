import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { User, Position } from '../types/user.types'
import { STAR_COLORS } from '../utils/constants'
import toast from 'react-hot-toast'

interface UserStore {
  currentUser: User | null
  otherUsers: User[]
  isLoading: boolean
  initializeUser: () => Promise<void>
  updatePosition: (position: Position) => Promise<void>
  addOtherUser: (user: User) => void
  removeOtherUser: (userId: string) => void
}

const generateStarColor = () => 
  STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]

export const useUserStore = create<UserStore>((set, get) => ({
  currentUser: null,
  otherUsers: [],
  isLoading: true,

  initializeUser: async () => {
    try {
      const userId = crypto.randomUUID()
      const color = generateStarColor()
      
      set({
        currentUser: {
          id: userId,
          color,
          position: null
        },
        isLoading: false
      })

      // Subscribe to presence channel
      const channel = supabase.channel('online-users')
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const others = Object.values(state)
            .flat()
            .filter((u: any) => u.user_id !== userId)
            .map((u: any) => ({
              id: u.user_id,
              color: u.color,
              position: u.position
            }))
          
          set({ otherUsers: others })
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: userId,
              color,
              position: null
            })
          }
        })

      toast.success('🌟 You are now a star in the constellation')
    } catch (error) {
      console.error('Failed to initialize user:', error)
      toast.error('Failed to connect to constellation')
      set({ isLoading: false })
    }
  },

  updatePosition: async (position) => {
    const { currentUser } = get()
    if (!currentUser) return

    try {
      // Update local state
      set({
        currentUser: {
          ...currentUser,
          position
        }
      })

      // Update presence state
      await supabase.channel('online-users').track({
        user_id: currentUser.id,
        color: currentUser.color,
        position,
        last_seen: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to update position:', error)
    }
  },

  addOtherUser: (user) => {
    set((state) => ({
      otherUsers: [...state.otherUsers.filter(u => u.id !== user.id), user]
    }))
  },

  removeOtherUser: (userId) => {
    set((state) => ({
      otherUsers: state.otherUsers.filter(u => u.id !== userId)
    }))
  }
}))
