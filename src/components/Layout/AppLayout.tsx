import { motion } from 'framer-motion'
import MapContainer from '../map/MapContainer'
import EchoButton from '../Echo/EchoButton'
import UserCounter from '../UI/UserCounter'
import ConnectionStatus from '../UI/ConnectionStatus'

export default function AppLayout() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Map Container */}
      <MapContainer />
      
      {/* Top UI */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="flex justify-center pt-safe-top pt-4">
          <UserCounter />
        </div>
      </div>
      
      {/* Bottom UI */}
      <div className="absolute bottom-0 left-0 right-0 z-50">
        <div className="flex justify-center pb-safe-bottom pb-8">
          <EchoButton />
        </div>
      </div>
      
      {/* Bottom Right Status */}
      <div className="absolute bottom-4 right-4 z-50">
        <ConnectionStatus />
      </div>
      
      {/* Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
