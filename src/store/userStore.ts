import { create } from 'zustand'
import { User, Position } from '../types/user.types'
import { supabase } from '../lib/supabase'
import { STAR_COLORS } from '../utils/constants'
import { toast } from 'sonner'

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const color = generateStarColor()
      
      set({
        currentUser: {
          id: user.id,
          color,
          position: null
        },
        isLoading: false
      })

      // Subscribe to other users' positions
      const channel = supabase
        .channel('presence-channel')
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const users = Object.values(state).flat().map((p: any) => ({
            id: p.user_id,
            color: p.color,
            position: p.position,
            lastSeen: new Date(p.updated_at)
          }))

          set(state => ({
            otherUsers: users.filter(u => u.id !== state.currentUser?.id)
          }))
        })
        .subscribe()

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
      set({
        currentUser: {
          ...currentUser,
          position
        }
      })

      // Update presence state
      await supabase.channel('presence-channel').track({
        user_id: currentUser.id,
        color: currentUser.color,
        position,
        updated_at: new Date().toISOString()
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
