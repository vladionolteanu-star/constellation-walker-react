import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Camera, Video, Heart, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface EchoMenuProps {
  isOpen: boolean
  onClose: () => void
}

const echoOptions = [
  { type: 'audio', icon: Mic, label: 'Voice', color: '#FF6B6B' },
  { type: 'photo', icon: Camera, label: 'Photo', color: '#4ECDC4' },
  { type: 'video', icon: Video, label: 'Video', color: '#45B7D1' },
  { type: 'mood', icon: Heart, label: 'Mood', color: '#F093FB' },
  { type: 'text', icon: MessageCircle, label: 'Text', color: '#96CEB4' }
]

export default function EchoMenu({ isOpen, onClose }: EchoMenuProps) {
  const handleEchoSelect = (type: string) => {
    toast.success(`${type} echo selected - coming soon!`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40"
        >
          <div 
            className="flex gap-4 p-4 rounded-2xl border border-white/10"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(0, 0, 0, 0.7),
                  rgba(30, 30, 30, 0.5)
                )
              `,
              backdropFilter: 'blur(30px)',
              boxShadow: `
                0 20px 60px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {echoOptions.map((option, index) => {
              const IconComponent = option.icon
              
              return (
                <motion.button
                  key={option.type}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: 'spring', 
                    damping: 15, 
                    stiffness: 300 
                  }}
                  whileHover={{ 
                    scale: 1.2, 
                    y: -8,
                    boxShadow: `0 15px 30px ${option.color}40`
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEchoSelect(option.label)}
                  className="relative w-12 h-12 rounded-full border border-white/20 backdrop-blur-sm overflow-hidden group"
                  style={{
                    background: `
                      linear-gradient(135deg,
                        rgba(255, 255, 255, 0.08),
                        rgba(255, 255, 255, 0.02)
                      )
                    `
                  }}
                >
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle, ${option.color}20, transparent 60%)`
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  {/* Icon */}
                  <div 
                    className="relative z-10 w-full h-full flex items-center justify-center text-white transition-colors duration-300"
                    style={{
                      color: 'white'
                    }}
                  >
                    <IconComponent size={20} />
                  </div>

                  {/* Ripple effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full border opacity-0"
                    style={{ borderColor: option.color }}
                    whileHover={{
                      scale: [1, 1.5],
                      opacity: [0.6, 0]
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
