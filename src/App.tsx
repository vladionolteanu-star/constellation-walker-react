import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/Layout/AppLayout'
import LoadingScreen from './components/UI/LoadingScreen'
import { useUserStore } from './store/userStore'
import { useGeolocation } from './hooks/useGeolocation'
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime'
import SupabaseStatus from './components/SupabaseStatus'

function App() {
  const { 
    isLoading, 
    currentUser, 
    error,
    otherUsers,
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

  const { 
    startRealtime, 
    stopRealtime, 
    broadcastPosition 
  } = useSupabaseRealtime()
  
  const watchIdRef = useRef<number | null>(null)
  const botsCreatedRef = useRef(false)
  const realtimeStartedRef = useRef(false)

  // Inițializează user-ul
  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  // Actualizează poziția când se schimbă
  useEffect(() => {
    if (position && currentUser) {
      console.log('📍 Updating position:', position)
      updatePosition(position)
      
      // Broadcast position to other users
      if (realtimeStartedRef.current) {
        broadcastPosition(position)
      }
    }
  }, [position, currentUser, updatePosition, broadcastPosition])

  // Gestionează permisiunea de locație
  useEffect(() => {
    setLocationPermission(isPermissionGranted)
    
    if (isPermissionGranted && !watchIdRef.current) {
      watchIdRef.current = startWatching()
    }
  }, [isPermissionGranted, setLocationPermission, startWatching])

  // Start real-time când user-ul are poziție
  useEffect(() => {
    if (currentUser?.position && !realtimeStartedRef.current) {
      console.log('🌐 Starting real-time connection')
      realtimeStartedRef.current = true
      startRealtime()
    }
  }, [currentUser?.position, startRealtime])

  // Creează boti de test (doar în development)
  useEffect(() => {
    if (currentUser?.position && !botsCreatedRef.current && window.location.hostname === 'localhost') {
      console.log('🤖 Creating test bots')
      botsCreatedRef.current = true

      const mockUsers = [
        {
          id: 'bot-1',
          color: '#00D4FF',
          position: {
            lat: currentUser.position.lat + 0.002,
            lng: currentUser.position.lng + 0.001
          },
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'bot-2', 
          color: '#FF00EA',
          position: {
            lat: currentUser.position.lat - 0.001,
            lng: currentUser.position.lng + 0.002
          },
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'bot-3',
          color: '#FFD700',
          position: {
            lat: currentUser.position.lat + 0.001,
            lng: currentUser.position.lng - 0.002
          },
          isOnline: true,
          lastSeen: new Date()
        }
      ]

      mockUsers.forEach((bot, index) => {
        setTimeout(() => {
          addOtherUser(bot)
        }, (index + 1) * 1000)
      })
    }
  }, [currentUser?.position, addOtherUser])

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        stopWatching(watchIdRef.current)
      }
      stopRealtime()
    }
  }, [stopWatching, stopRealtime])

  console.log('🔍 App State:', { 
    isLoading, 
    hasUser: !!currentUser, 
    hasPosition: !!currentUser?.position,
    locationGranted: isPermissionGranted,
    otherUsersCount: otherUsers.length,
    realtimeStarted: realtimeStartedRef.current
  })

  return (
    <div>
      <SupabaseStatus />

      {/* Debug panel optimizat */}
      <div className="fixed top-16 left-4 z-50 bg-black/80 backdrop-blur text-white p-3 rounded-lg text-xs max-w-xs border border-white/10">
        <div className="space-y-1">
          <div>🔄 Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>👤 User: {currentUser ? 'Yes' : 'No'}</div>
          <div>📍 Position: {currentUser?.position ? 'Yes' : 'No'}</div>
          <div>🌐 Real-time: {realtimeStartedRef.current ? 'Yes' : 'No'}</div>
          <div>🤖 Connected Users: {otherUsers.length}</div>
          
          {currentUser?.position && (
            <div className="text-xs text-white/60 mt-2">
              {currentUser.position.lat.toFixed(4)}, {currentUser.position.lng.toFixed(4)}
            </div>
          )}
          
          {otherUsers.length > 0 && (
            <div className="mt-2 space-y-1">
              {otherUsers.slice(0, 3).map(user => (
                <div key={user.id} className="text-xs flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.color }} />
                  {user.id.includes('bot') ? '🤖' : '👤'} {user.id.slice(-4)}
                </div>
              ))}
              {otherUsers.length > 3 && (
                <div className="text-xs text-white/60">+{otherUsers.length - 3} more...</div>
              )}
            </div>
          )}
          
          {(error || locationError) && (
            <div className="text-red-400 text-xs mt-2">❌ {error || locationError}</div>
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
          duration: 3000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '14px',
          },
        }}
      />
    </div>
  )
}

export default App
