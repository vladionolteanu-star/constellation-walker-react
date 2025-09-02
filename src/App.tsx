import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/Layout/AppLayout'
import LoadingScreen from './components/UI/LoadingScreen'
import { useUserStore } from './store/userStore'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'
import { useGeolocation } from './hooks/useGeolocation'
import { botSystem } from './utils/botSystem'

// component pentru debugging / status conexiune Supabase
import SupabaseStatus from './components/SupabaseStatus'

function App() {
  const { isLoading, currentUser, initializeUser } = useUserStore()
  const { startRealtime, stopRealtime } = useSupabaseRealtime()
  const { requestPermission } = useGeolocation()

  useEffect(() => {
    const init = async () => {
      await initializeUser()
    }
    init()
  }, [initializeUser])

  useEffect(() => {
    if (currentUser && !isLoading) {
      const setupApp = async () => {
        const locationGranted = await requestPermission()
        if (locationGranted) {
          startRealtime()

          // Activează boți pentru testare doar în dev
          if (
            window.location.hostname === 'localhost' ||
            window.location.hostname.includes('vercel')
          ) {
            setTimeout(() => {
              botSystem.createBots(1)
            }, 2000)
          }
        }
      }
      setupApp()
    }

    // Cleanup la unmount
    return () => {
      stopRealtime()
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname.includes('vercel')
      ) {
        botSystem.cleanup()
      }
    }
  }, [currentUser, isLoading, requestPermission, startRealtime, stopRealtime])

  return (
    <div>
      {/* status bar pentru debugging conexiune Supabase */}
      <SupabaseStatus />

      <AnimatePresence mode="wait">
        {isLoading || !currentUser ? (
          <LoadingScreen key="loading" />
        ) : (
          <AppLayout key="app" />
        )}
      </AnimatePresence>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
    </div>
  )
}

export default App
