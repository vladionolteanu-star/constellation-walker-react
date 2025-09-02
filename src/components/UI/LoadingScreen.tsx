// src/components/UI/LoadingScreen.tsx
import { motion } from 'framer-motion';

const humanEvolutionStages = [
  { name: 'marine', svg: 'M50,80 Q20,60 50,40 Q80,60 50,80 Z', fill: '#00D4FF' }, // Fish-like
  { name: 'amphibian', svg: 'M40,80 L20,60 L40,40 L60,40 L80,60 L60,80 Z', fill: '#00FF88' }, // Amphibian
  { name: 'reptile', svg: 'M30,80 Q30,50 50,40 Q70,50 70,80 Z', fill: '#FFD700' }, // Reptile
  { name: 'mammal', svg: 'M40,80 Q30,60 40,40 H60 Q70,60 60,80 Z', fill: '#FF4500' }, // Mammal
  { name: 'hominid', svg: 'M45,80 Q40,60 45,40 H55 Q60,60 55,80 Z', fill: '#FF00EA' }, // Hominid
  { name: 'homosapiens', svg: 'M45,80 Q45,60 45,40 H55 Q55,60 55,80 Z', fill: '#FFFFFF' }, // Human
];

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] overflow-hidden"
    >
      {/* Enhanced Big Bang Core Explosion - Cosmic swirl with vibrant shifts */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{ 
          scale: 35,
          opacity: [1, 0.95, 0],
          rotate: 720
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      >
        <div 
          className="w-72 h-72 rounded-full"
          style={{
            background: `conic-gradient(
              from 0deg,
              rgba(255,255,255,1) 0%,
              rgba(255,69,0,1) 10%,
              rgba(255,215,0,0.9) 20%,
              rgba(0,191,255,0.8) 30%,
              rgba(138,43,226,0.7) 40%,
              rgba(255,0,234,0.6) 50%,
              transparent 60%
            )`,
            filter: 'blur(8px) brightness(1.8)',
            boxShadow: '0 0 150px rgba(255,255,255,0.9)'
          }}
        />
      </motion.div>

      {/* Enhanced Shockwave Rings - More vivid, pulsating rings */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 30, opacity: 0 }}
          transition={{ 
            duration: 2, 
            delay: i * 0.15,
            ease: "easeOut" 
          }}
        >
          <div 
            className="w-40 h-40 rounded-full border-4"
            style={{
              borderColor: ['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082', '#FF1493'][i % 8],
              boxShadow: `0 0 100px ${['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082', '#FF1493'][i % 8]}`,
              filter: 'blur(2.5px)'
            }}
          />
        </motion.div>
      ))}

      {/* Enhanced Particles - Comet-like trails with dynamic bursts */}
      <div className="absolute inset-0">
        {[...Array(200)].map((_, i) => {
          const angle = (i / 200) * Math.PI * 2 + Math.random() * 0.3;
          const distance = 1000 + Math.random() * 800;
          const duration = 1.4 + Math.random() * 0.4;
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-2.5 h-2.5"
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 0 
              }}
              animate={{ 
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: [0, 5, 1.5, 0],
                opacity: [0, 1, 0.8, 0],
                rotate: Math.random() * 1080
              }}
              transition={{ 
                duration,
                ease: "easeOut",
                delay: Math.random() * 0.2
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: ['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082', '#FF1493'][i % 8],
                  boxShadow: `0 0 25px ${['#FF4500', '#00D4FF', '#FF00EA', '#FFD700', '#00FF88', '#FF6B6B', '#4B0082', '#FF1493'][i % 8]}`,
                  filter: 'blur(1.2px)'
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Enhanced Nebula Clouds - Swirling cosmic depth */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`nebula-${i}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.3, rotate: i * 72 }}
          animate={{ opacity: 0.6, scale: 1.8, rotate: i * 72 + 360 }}
          transition={{ 
            duration: 2,
            delay: 0.3 + i * 0.2,
            ease: "easeInOut"
          }}
          style={{
            background: `radial-gradient(circle at ${50 + Math.random()*40 -20}% ${50 + Math.random()*40 -20}%, 
              rgba(138,43,226,0.5) 0%, 
              rgba(0,191,255,0.4) 50%, 
              transparent 80%)`,
            filter: 'blur(30px)'
          }}
        />
      ))}

      {/* Intensified Flash - Multi-pulse cosmic flare */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 0.85, 0, 0.7, 0] }}
        transition={{ 
          duration: 1.2,
          delay: 0.1,
          times: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1]
        }}
      />

      {/* Cosmic Vortex - Extra layer of flair */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0, rotate: 0 }}
        animate={{ scale: 20, opacity: [0, 0.5, 0], rotate: 1440 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
      >
        <div
          className="w-48 h-48 rounded-full border-2 border-dashed"
          style={{
            borderColor: '#FFD700',
            boxShadow: '0 0 60px rgba(255,215,0,0.6)',
            filter: 'blur(3px)'
          }}
        />
      </motion.div>

      {/* Human Evolution Animation - 2 seconds, centered, with glow */}
      <motion.div
        className="relative z-20 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <svg width="140" height="140" viewBox="0 0 100 100">
          {humanEvolutionStages.map((stage, i) => (
            <motion.path
              key={stage.name}
              d={stage.svg}
              fill={stage.fill}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.3, 1, 0],
                opacity: [0, 1, 1, 0],
                rotate: [0, 15, -15, 0]
              }}
              transition={{
                duration: 2 / humanEvolutionStages.length,
                delay: i * (2 / humanEvolutionStages.length),
                times: [0, 0.3, 0.7, 1],
                ease: "easeInOut"
              }}
              style={{
                filter: `drop-shadow(0 0 10px ${stage.fill})`
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Central Logo - Enhanced glow, synchronized */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: 1.5,
          duration: 0.5,
          type: "spring",
          damping: 10
        }}
      >
        <motion.div
          className="w-36 h-36 mx-auto mb-8 rounded-full"
          animate={{ 
            rotate: 360,
            scale: [1, 1.4, 1],
            boxShadow: [
              '0 0 100px #00D4FF',
              '0 0 150px #00D4FF',
              '0 0 100px #00D4FF'
            ]
          }}
          transition={{ 
            rotate: { duration: 15, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity },
            boxShadow: { duration: 2, repeat: Infinity }
          }}
          style={{
            background: `radial-gradient(circle at 40% 40%, #FFD700, #00D4FF 70%, transparent 90%)`,
          }}
        />
        <motion.h1 
          className="text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          CONSTELLATION
        </motion.h1>
        <motion.p
          className="text-white/90 tracking-widest text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.9, 1] }}
          transition={{ 
            delay: 1.8,
            duration: 0.3
          }}
        >
          WALKER
        </motion.p>
      </motion.div>

      {/* Enhanced Starfield - More twinkling, cosmic realism */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {[...Array(300)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, Math.random() * 0.9 + 0.1, 0],
              scale: [0, Math.random() * 2.5 + 0.5, 0]
            }}
            transition={{ 
              delay: 0.7 + Math.random() * 0.7,
              duration: 1 + Math.random(),
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
