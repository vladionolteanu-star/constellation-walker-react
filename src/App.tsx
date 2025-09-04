import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/Layout/AppLayout'
import LoadingScreen from './components/UI/LoadingScreen'
import { useUserStore } from './store/userStore'
import { useGeolocation } from './hooks/useGeolocation'

// component pentru debugging / status conexiune Supabase
import SupabaseStatus from './components/SupabaseStatus'

function App() {
  const { 
    isLoading, 
    currentUser, 
    error,
    initializeUser, 
    updatePosition,
    setLocationPermission,
    addOtherUser 
  } = useUserStore()
  
  const { 
    position, 
    error: locationError, 
    isPermissionGranted,
    startWatching,
    stopWatching 
  } = useGeolocation()
  
  const watchIdRef = useRef<number | null>(null)

  // Inițializează user-ul
  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  // Actualizează poziția când se schimbă
  useEffect(() => {
    if (position && currentUser) {
      updatePosition(position)
    }
  }, [position, currentUser, updatePosition])

  // Gestionează permisiunea de locație
  useEffect(() => {
    setLocationPermission(isPermissionGranted)
    
    if (isPermissionGranted && !watchIdRef.current) {
      // Începe să urmărească locația
      watchIdRef.current = startWatching()
    }
  }, [isPermissionGranted, setLocationPermission, startWatching])

  // Cleanup la unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        stopWatching(watchIdRef.current)
      }
    }
  }, [stopWatching])

  // Mock bots pentru testare (doar în dev)
  useEffect(() => {
    if (currentUser?.position && process.env.NODE_ENV === 'development') {
      const mockUsers = [
        {
          id: 'bot-1',
          color: '#00D4FF',
          position: {
            lat: currentUser.position.lat + 0.001,
            lng: currentUser.position.lng + 0.001
          },
          isOnline: true
        },
        {
          id: 'bot-2', 
          color: '#FF00EA',
          position: {
            lat: currentUser.position.lat - 0.001,
            lng: currentUser.position.lng + 0.0005
          },
          isOnline: true
        },
        {
          id: 'bot-3',
          color: '#FFD700',
          position: {
            lat: currentUser.position.lat + 0.0005,
            lng: currentUser.position.lng - 0.001
          },
          isOnline: true
        }
      ]

      // Adaugă botii cu întârziere
      setTimeout(() => {
        mockUsers.forEach((bot, index) => {
          setTimeout(() => {
            addOtherUser(bot)
          }, index * 500)
        })
      }, 1000)
    }
  }, [currentUser?.position, addOtherUser])

  console.log('🔍 App State:', { 
    isLoading, 
    hasUser: !!currentUser, 
    hasPosition: !!currentUser?.position,
    locationGranted: isPermissionGranted,
    error: error || locationError
  })

  return (
    <div>
      {/* status bar pentru debugging conexiune Supabase */}
      <SupabaseStatus />

      {/* Debug info pe ecran */}
      <div className="fixed top-16 left-4 z-50 bg-black/80 backdrop-blur-xl text-white p-3 rounded-lg text-xs max-w-xs border border-white/10">
        <div className="space-y-1">
          <div>🔄 Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>👤 User: {currentUser ? 'Yes' : 'No'}</div>
          <div>📍 Position: {currentUser?.position ? 'Yes' : 'No'}</div>
          <div>🗺️ Location Permission: {isPermissionGranted ? 'Yes' : 'No'}</div>
          {currentUser?.position && (
            <>
              <div>📐 Lat: {currentUser.position.lat.toFixed(6)}</div>
              <div>📐 Lng: {currentUser.position.lng.toFixed(6)}</div>
            </>
          )}
          {(error || locationError) && (
            <div className="text-red-400">❌ {error || locationError}</div>
          )}
        </div>
      </div>

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
          duration: 4000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#00FF88',
              secondary: 'black',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  )
}

export default App
