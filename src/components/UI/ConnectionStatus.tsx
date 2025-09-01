import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true)
  
  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, duration: 0.4 }}
      className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-xl border border-white/10 text-xs font-medium"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.8),
            rgba(20, 20, 20, 0.6)
          )
        `
      }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          boxShadow: `0 0 10px ${isConnected ? '#34d399' : '#f87171'}`
        }}
      />
      <span className={isConnected ? 'text-white/80' : 'text-red-300'}>
        {isConnected ? 'Connected' : 'Offline'}
      </span>
    </motion.div>
  )
}
