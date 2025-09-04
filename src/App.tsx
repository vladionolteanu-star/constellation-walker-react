import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/Layout/AppLayout'
import LoadingScreen from './components/UI/LoadingScreen'

// component pentru debugging / status conexiune Supabase
import SupabaseStatus from './components/SupabaseStatus'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      // Simulează inițializarea user-ului
      setTimeout(() => {
        setCurrentUser({
          id: 'test-user-123',
          color: '#00D4FF',
          position: {
            lat: 44.4268,
            lng: 26.1025
          }
        })
        setIsLoading(false)
      }, 1000)
    }
    init()
  }, [])

  console.log('🔍 Debug:', { 
    isLoading, 
    currentUser, 
    hasPosition: currentUser?.position 
  })

  return (
    <div>
      {/* status bar pentru debugging conexiune Supabase */}
      <SupabaseStatus />

      {/* Debug info pe ecran */}
      <div className="fixed top-16 left-4 z-50 bg-black/80 text-white p-2 rounded text-xs">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>User: {currentUser ? 'Yes' : 'No'}</div>
        <div>Position: {currentUser?.position ? 'Yes' : 'No'}</div>
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
            fontWeight: '500',
          },
        }}
      />
    </div>
  )
}

export default App
