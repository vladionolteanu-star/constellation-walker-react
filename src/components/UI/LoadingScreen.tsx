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
      {/* Big Bang Effect - Explozie de lumină din centru */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 20 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <div 
          className="w-40 h-40 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              rgba(255,255,255,1) 0%, 
              rgba(0,212,255,0.8) 10%, 
              rgba(138,43,226,0.6) 20%, 
              rgba(255,0,234,0.4) 30%, 
              transparent 40%
            )`,
            filter: 'blur(2px)'
          }}
        />
      </motion.div>

      {/* Shockwave Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 15, opacity: 0 }}
          transition={{ 
            duration: 1.5, 
            delay: i * 0.2,
            ease: "easeOut" 
          }}
        >
          <div 
            className="w-20 h-20 rounded-full border-2"
            style={{
              borderColor: i === 0 ? '#00D4FF' : i === 1 ? '#FF00EA' : '#FFD700',
              boxShadow: `0 0 50px ${i === 0 ? '#00D4FF' : i === 1 ? '#FF00EA' : '#FFD700'}`
            }}
          />
        </motion.div>
      ))}

      {/* Particule care explodează */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => {
          const angle = (i / 50) * Math.PI * 2
          const distance = 500 + Math.random() * 300
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-1 h-1"
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 1 
              }}
              animate={{ 
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: [0, 2, 0],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut",
                delay: 0.1 + (i * 0.01)
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: ['#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B'][i % 5],
                  boxShadow: `0 0 10px ${['#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B'][i % 5]}`
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Flash de lumină albă */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ 
          duration: 0.3,
          delay: 0.2,
          times: [0, 0.5, 1]
        }}
      />

      {/* Logo-ul central care apare după explozie */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 0.8,
          duration: 0.5,
          type: "spring",
          damping: 15
        }}
      >
        {/* Steaua centrală */}
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-full"
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity }
          }}
          style={{
            background: `radial-gradient(circle at 30% 30%, #00D4FF, transparent 70%)`,
            boxShadow: `
              0 0 60px #00D4FF,
              0 0 120px #00D4FF80,
              0 0 180px #00D4FF60
            `
          }}
        />

        {/* Text care apare */}
        <motion.h1 
          className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          CONSTELLATION
        </motion.h1>
        
        <motion.p
          className="text-white/80 tracking-widest text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.7, 1] }}
          transition={{ 
            delay: 1.3,
            duration: 0.5
          }}
        >
          WALKER
        </motion.p>
      </motion.div>

      {/* Starfield background care apare după Big Bang */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, Math.random() * 0.8 + 0.2],
              scale: [0, Math.random() + 0.5]
            }}
            transition={{ 
              delay: 0.8 + Math.random() * 0.5,
              duration: 0.5
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
