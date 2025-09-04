import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { generateUserId, generateStarColor } from '../utils/constants'
import { ensureUserExists, updateUserPosition } from '../services/supabase'

interface Position {
  lat: number
  lng: number
}

interface User {
  id: string
  color: string
  position?: Position
  lastSeen?: Date
  isOnline?: boolean
}

interface UserState {
  currentUser: User | null
  otherUsers: User[]
  isLoading: boolean
  error: string | null
  isLocationGranted: boolean
  
  // Actions
  initializeUser: () => Promise<void>
  updatePosition: (position: Position) => void
  setLocationPermission: (granted: boolean) => void
  addOtherUser: (user: User) => void
  removeOtherUser: (userId: string) => void
  setOtherUsers: (users: User[]) => void
  clearOtherUsers: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      currentUser: null,
      otherUsers: [],
      isLoading: true,
      error: null,
      isLocationGranted: false,

      initializeUser: async () => {
        try {
          console.log('🚀 Initializing user...')
          set({ isLoading: true, error: null })

          let userId = localStorage.getItem('userId')
          let userColor = localStorage.getItem('userColor')

          if (!userId || !userColor) {
            userId = generateUserId()
            userColor = generateStarColor()
            localStorage.setItem('userId', userId)
            localStorage.setItem('userColor', userColor)
            console.log('✅ Generated new user:', { userId, userColor })
          }

          // Salvează user-ul în Supabase
          await ensureUserExists(userId, userColor)

          // Creează user object
          const user: User = {
            id: userId,
            color: userColor,
            isOnline: true,
            lastSeen: new Date()
          }

          set({
            currentUser: user,
            isLoading: false
          })

          console.log('✅ User initialized:', user)
        } catch (error) {
          console.error('❌ Failed to initialize user:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize',
            isLoading: false
          })
        }
      },

      updatePosition: async (position: Position) => {
        const { currentUser } = get()
        if (!currentUser) return

        console.log('📍 Updating user position:', position)

        // Update local state
        const updatedUser = {
          ...currentUser,
          position,
          lastSeen: new Date()
        }

        set({ currentUser: updatedUser })

        // Update in Supabase
        try {
          await updateUserPosition(currentUser.id, position)
          console.log('✅ Position updated in database')
        } catch (error) {
          console.error('❌ Failed to update position:', error)
        }
      },

      setLocationPermission: (granted: boolean) => {
        set({ isLocationGranted: granted })
        if (!granted) {
          set({ error: 'Location permission required for full experience' })
        } else {
          set({ error: null })
        }
      },

      addOtherUser: (user: User) => {
        set((state) => ({
          otherUsers: [...state.otherUsers.filter((u) => u.id !== user.id), user]
        }))
        console.log('👤 Added user:', user.id)
      },

      removeOtherUser: (userId: string) => {
        set((state) => ({
          otherUsers: state.otherUsers.filter((u) => u.id !== userId)
        }))
        console.log('👋 Removed user:', userId)
      },

      setOtherUsers: (users: User[]) => {
        set({ otherUsers: users })
        console.log('👥 Set other users:', users.length)
      },

      clearOtherUsers: () => {
        set({ otherUsers: [] })
        console.log('🧹 Cleared other users')
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      }
    }),
    { name: 'UserStore' }
  )
)
