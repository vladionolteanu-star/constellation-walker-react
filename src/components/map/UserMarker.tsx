import { Marker } from 'react-map-gl'
import { motion } from 'framer-motion'
import { User } from '../../types/user.types'

interface UserMarkerProps {
  user: User
  isCurrentUser: boolean
}

export default function UserMarker({ user, isCurrentUser }: UserMarkerProps) {
  if (!user.position) return null

  return (
    <Marker
      longitude={user.position.lng}
      latitude={user.position.lat}
      anchor="center"
    >
      {isCurrentUser ? (
        // Current user - larger and more prominent
        <motion.div
          className="relative"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        >
          {/* Main star */}
          <div 
            className="w-8 h-8 rounded-full relative z-10"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${user.color}, transparent 70%)`,
              boxShadow: `
                0 0 20px ${user.color}80,
                0 0 40px ${user.color}60,
                0 0 60px ${user.color}40
              `
            }}
          />
          
          {/* Animated pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: user.color }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 w-8 h-8 rounded-full"
            style={{
              background: `radial-gradient(circle, ${user.color}20, transparent 60%)`
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0.2, 0.6]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5
            }}
          />
        </motion.div>
      ) : (
        // Other users - smaller stars
        <motion.div
          className="relative cursor-pointer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.3 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        >
          {/* Main star */}
          <div 
            className="w-6 h-6 rounded-full relative z-10"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${user.color}, transparent 70%)`,
              boxShadow: `
                0 0 15px ${user.color}80,
                0 0 30px ${user.color}60
              `
            }}
          />

          {/* Subtle pulse */}
          <motion.div
            className="absolute inset-0 w-6 h-6 rounded-full"
            style={{
              background: `radial-gradient(circle, ${user.color}30, transparent 50%)`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2 // Random delay for organic feel
            }}
          />

          {/* Sparkle effect on hover */}
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white opacity-0"
            whileHover={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>
      )}
    </Marker>
  )
}
