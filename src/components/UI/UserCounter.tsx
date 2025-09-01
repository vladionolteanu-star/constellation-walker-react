import { motion } from 'framer-motion'
import { useUserStore } from '../../store/userStore'

export default function UserCounter() {
  const { otherUsers } = useUserStore()
  const totalUsers = otherUsers.length + 1 // +1 for current user

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.6 }}
      className="pointer-events-auto"
    >
      <div 
        className="px-6 py-3 rounded-full backdrop-blur-xl border border-white/10 text-white/90 text-sm font-medium tracking-wide"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.05),
              rgba(255, 255, 255, 0.02)
            )
          `,
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 80px rgba(0, 212, 255, 0.1)
          `
        }}
      >
        <motion.span
          key={totalUsers}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        >
          {totalUsers}
        </motion.span>
        <span className="ml-2">
          {totalUsers === 1 ? 'star' : 'stars'} nearby ✨
        </span>
      </div>
    </motion.div>
  )
}
