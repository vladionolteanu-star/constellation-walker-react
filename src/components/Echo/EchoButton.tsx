import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import EchoMenu from './EchoMenu'

export default function EchoButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      {/* Echo Menu */}
      <EchoMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Main Echo Button with VIBE text */}
      <motion.button
        className="relative px-8 py-4 rounded-full text-white shadow-2xl z-50 overflow-hidden flex items-center gap-3"
        style={{
          background: `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)`,
          boxShadow: `
            0 10px 40px rgba(102, 126, 234, 0.4),
            0 0 0 0 rgba(102, 126, 234, 0.4),
            inset 0 2px 10px rgba(255, 255, 255, 0.3)
          `
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: `
            0 15px 50px rgba(102, 126, 234, 0.6),
            0 0 0 15px rgba(102, 126, 234, 0.1),
            inset 0 2px 10px rgba(255, 255, 255, 0.4)
          `
        }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          boxShadow: [
            `0 10px 40px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)`,
            `0 10px 40px rgba(102, 126, 234, 0.6), 0 0 0 15px rgba(102, 126, 234, 0.1), inset 0 2px 10px rgba(255, 255, 255, 0.4)`,
            `0 10px 40px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)`
          ]
        }}
        transition={{ 
          scale: { delay: 0.5, type: 'spring', damping: 15, stiffness: 300 },
          opacity: { delay: 0.5, duration: 0.6 },
          boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          style={{ transform: 'skew(20deg)' }}
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 2
          }}
        />

        {/* Icon */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          animate={{ 
            rotate: isMenuOpen ? 45 : 0,
            scale: isMenuOpen ? 0.9 : 1
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <Sparkles size={24} />
        </motion.div>

        {/* VIBE Text */}
        <motion.span
          className="relative z-10 font-bold text-lg tracking-wider"
          style={{
            textShadow: '0 2px 20px rgba(255, 255, 255, 0.5)'
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          VIBE
        </motion.span>

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/20"
          animate={{
            scale: [1, 1.5],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      </motion.button>
    </>
  )
}
