import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] overflow-hidden"
    >
      {/* Big Bang Core Explosion - More intense, with color shifts */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: 25,
          opacity: [1, 0.8, 0],
          rotate: 180
        }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <div 
          className="w-48 h-48 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              rgba(255,255,255,1) 0%, 
              rgba(255,165,0,0.9) 5%, 
              rgba(0,212,255,0.8) 15%, 
              rgba(138,43,226,0.7) 25%, 
              rgba(255,0,234,0.5) 35%, 
              rgba(75,0,130,0.3) 45%, 
              transparent 55%
            )`,
            filter: 'blur(4px) brightness(1.2)'
          }}
        />
      </motion.div>

      {/* Enhanced Shockwave Rings - More rings, pulsating */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ 
            duration: 2.5, 
            delay: i * 0.3,
            ease: "easeOut" 
          }}
        >
          <div 
            className="w-24 h-24 rounded-full border-2"
            style={{
              borderColor: ['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88'][i % 5],
              boxShadow: `0 0 60px ${['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88'][i % 5]}`,
              filter: 'blur(1px)'
            }}
          />
        </motion.div>
      ))}

      {/* More Particles - Trippy trails, varied speeds */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => {
          const angle = (i / 100) * Math.PI * 2 + Math.random() * 0.5
          const distance = 600 + Math.random() * 400
          const duration = 2 + Math.random() * 0.5
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-1.5 h-1.5"
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 0 
              }}
              animate={{ 
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: [0, 3, 1, 0],
                opacity: [0, 1, 0.5, 0],
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration,
                ease: "easeOut",
                delay: Math.random() * 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: ['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082'][i % 7],
                  boxShadow: `0 0 15px ${['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082'][i % 7]}`,
                  filter: 'blur(0.5px)'
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Nebula Clouds - For realistic cosmic feel */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`nebula-${i}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.4, scale: 1.2, rotate: i * 60 }}
          transition={{ 
            duration: 2.5,
            delay: 0.5 + i * 0.4,
            ease: "easeInOut"
          }}
          style={{
            background: `radial-gradient(circle at ${50 + Math.random()*20 -10}% ${50 + Math.random()*20 -10}%, 
              rgba(138,43,226,0.3) 0%, 
              rgba(0,212,255,0.2) 30%, 
              transparent 60%)`,
            filter: 'blur(20px)'
          }}
        />
      ))}

      {/* Intensified Flash - Multiple pulses */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0, 0.6, 0] }}
        transition={{ 
          duration: 1.2,
          delay: 0.3,
          times: [0, 0.2, 0.4, 0.6, 1]
        }}
      />

      {/* Central Logo - Delayed, with glow pulse */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 1.2,
          duration: 0.8,
          type: "spring",
          damping: 12
        }}
      >
        {/* Pulsing Star */}
        <motion.div
          className="w-28 h-28 mx-auto mb-6 rounded-full"
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
            boxShadow: [
              '0 0 60px #00D4FF',
              '0 0 100px #00D4FF',
              '0 0 60px #00D4FF'
            ]
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity },
            boxShadow: { duration: 3, repeat: Infinity }
          }}
          style={{
            background: `radial-gradient(circle at 40% 40%, #FFD700, #00D4FF 50%, transparent 80%)`,
          }}
        />

        {/* Text with gradient shift */}
        <motion.h1 
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          CONSTELLATION
        </motion.h1>
        
        <motion.p
          className="text-white/90 tracking-widest text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 1] }}
          transition={{ 
            delay: 2.0,
            duration: 0.5
          }}
        >
          WALKER
        </motion.p>
      </motion.div>

      {/* Dense Starfield - Twinkling for realism */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1.2 }}
      >
        {[...Array(200)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, Math.random() * 0.7 + 0.3, 0],
              scale: [0, Math.random() * 1.5 + 0.5, 0]
            }}
            transition={{ 
              delay: 1.0 + Math.random() * 1.0,
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
