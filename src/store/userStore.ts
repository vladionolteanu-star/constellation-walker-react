import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase, ensureUserExists, updateUserPosition } from '../services/supabase'
import { generateStarColor } from '../utils/constants'
import { User, Position } from '../types/user.types'
import toast from 'react-hot-toast'

interface UserState {
  currentUser: User | null
  otherUsers: User[]
  isLoading: boolean
  
  initializeUser: () => Promise<void>
  updatePosition: (position: Position) => Promise<void>
  addOtherUser: (user: User) => void
  removeOtherUser: (userId: string) => void
  updateOtherUser: (userId: string, position: Position) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        otherUsers: [],
        isLoading: true,

        initializeUser: async () => {
          try {
            let userId = localStorage.getItem('constellation-user-id')
            
            if (!userId) {
              userId = crypto.randomUUID()
              localStorage.setItem('constellation-user-id', userId)
            }

            const color = generateStarColor()
            const userData = await ensureUserExists(userId, color)

            set({
              currentUser: {
                id: userId,
                color: userData.color_hash,
                position: null
              },
              isLoading: false
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
            // Update local state first for immediate feedback
            set({
              currentUser: {
                ...currentUser,
                position
              }
            })

            // Update database
            await updateUserPosition(currentUser.id, position)
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
        },

        updateOtherUser: (userId, position) => {
          set((state) => ({
            otherUsers: state.otherUsers.map(user =>
              user.id === userId ? { ...user, position } : user
            )
          }))
        }
      }),
      {
        name: 'constellation-user',
        partialize: (state) => ({ 
          // Only persist the user ID, not the full state
          persistedUserId: state.currentUser?.id 
        })
      }
    ),
    { name: 'UserStore' }
  )
)
