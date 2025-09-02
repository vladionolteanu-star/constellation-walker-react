import { motion, useReducedMotion } from "framer-motion";

const humanEvolutionStages = [
  { name: "marine", svg: "M50,80 Q20,60 50,40 Q80,60 50,80 Z", fill: "#00D4FF" },
  { name: "amphibian", svg: "M40,80 L20,60 L40,40 L60,40 L80,60 L60,80 Z", fill: "#00FF88" },
  { name: "reptile", svg: "M30,80 Q30,50 50,40 Q70,50 70,80 Z", fill: "#FFD700" },
  { name: "mammal", svg: "M40,80 Q30,60 40,40 H60 Q70,60 60,80 Z", fill: "#FF4500" },
  { name: "hominid", svg: "M45,80 Q40,60 45,40 H55 Q60,60 55,80 Z", fill: "#FF00EA" },
  { name: "homosapiens", svg: "M45,80 Q45,60 45,40 H55 Q55,60 55,80 Z", fill: "#FFFFFF" },
];

export default function LoadingScreen() {
  const prefersReducedMotion = useReducedMotion();

  // animațiile durează max ~3 secunde
  const animationDuration = prefersReducedMotion ? 0 : 3;
  const transitionEase = prefersReducedMotion ? "linear" : "easeInOut";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      {/* Big Bang Core */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 1, rotate: 0 }}
        animate={{
          scale: prefersReducedMotion ? 1 : 25,
          opacity: [1, 0.9, 0],
          rotate: prefersReducedMotion ? 0 : 360,
        }}
        transition={{ duration: animationDuration, ease: transitionEase }}
      >
        <div
          className="w-64 h-64 rounded-full"
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
            filter: "blur(6px) brightness(1.6)",
            boxShadow: "0 0 120px rgba(255,255,255,0.9)",
          }}
        />
      </motion.div>

      {/* Shockwave Rings */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: prefersReducedMotion ? 1 : 20, opacity: 0 }}
          transition={{
            duration: animationDuration,
            delay: i * 0.25,
            ease: transitionEase,
          }}
        >
          <div
            className="w-32 h-32 rounded-full border-4"
            style={{
              borderColor: ["#FF4500", "#00D4FF", "#FF00EA", "#FFD700", "#00FF88", "#FF1493"][i % 6],
              boxShadow: `0 0 80px ${
                ["#FF4500", "#00D4FF", "#FF00EA", "#FFD700", "#00FF88", "#FF1493"][i % 6]
              }`,
            }}
          />
        </motion.div>
      ))}

      {/* Particles */}
      <div className="absolute inset-0">
        {[...Array(80)].map((_, i) => {
          const angle = (i / 80) * Math.PI * 2 + Math.random() * 0.2;
          const distance = 700 + Math.random() * 500;
          const duration = animationDuration * (1 + Math.random() * 0.3);
          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-2 h-2"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: prefersReducedMotion ? 0 : Math.cos(angle) * distance,
                y: prefersReducedMotion ? 0 : Math.sin(angle) * distance,
                scale: prefersReducedMotion ? 1 : [0, 4, 1, 0],
                opacity: [0, 1, 0.7, 0],
              }}
              transition={{
                duration,
                ease: transitionEase,
                delay: Math.random() * 0.4,
              }}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: ["#FF4500", "#00D4FF", "#FF00EA", "#FFD700", "#00FF88", "#FF1493"][i % 6],
                  boxShadow: `0 0 20px ${
                    ["#FF4500", "#00D4FF", "#FF00EA", "#FFD700", "#00FF88", "#FF1493"][i % 6]
                  }`,
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Nebula Clouds */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`nebula-${i}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.5, rotate: i * 120 }}
          animate={{
            opacity: 0.6,
            scale: prefersReducedMotion ? 0.5 : 1.3,
            rotate: prefersReducedMotion ? i * 120 : i * 120 + 180,
          }}
          transition={{
            duration: animationDuration,
            delay: 0.4 + i * 0.3,
            ease: transitionEase,
          }}
          style={{
            background: `radial-gradient(circle at ${50 + Math.random() * 20 - 10}% ${
              50 + Math.random() * 20 - 10
            }%, rgba(138,43,226,0.6) 0%, rgba(0,191,255,0.5) 50%, transparent 80%)`,
            filter: "blur(25px)",
          }}
        />
      ))}

      {/* Human Evolution */}
      <motion.div
        className="relative z-20 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <svg width="160" height="160" viewBox="0 0 100 100">
          {humanEvolutionStages.map((stage, i) => (
            <motion.path
              key={stage.name}
              d={stage.svg}
              fill={stage.fill}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: prefersReducedMotion ? 1 : [0, 1.4, 1, 0],
                opacity: [0, 1, 1, 0],
                rotate: prefersReducedMotion ? 0 : [0, 10, -10, 0],
              }}
              transition={{
                duration: animationDuration / humanEvolutionStages.length,
                delay: i * (animationDuration / humanEvolutionStages.length),
                ease: transitionEase,
              }}
              style={{
                filter: `drop-shadow(0 0 12px ${stage.fill})`,
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Central Logo */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 2.2,
          duration: 0.6,
          type: "spring",
          damping: 12,
        }}
      >
        <motion.div
          className="w-32 h-32 mx-auto mb-6 rounded-full"
          animate={{
            rotate: prefersReducedMotion ? 0 : 360,
            scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
            boxShadow: [
              "0 0 80px #00D4FF",
              "0 0 120px #00D4FF",
              "0 0 80px #00D4FF",
            ],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: animationDuration / 2, repeat: Infinity },
            boxShadow: { duration: animationDuration / 2, repeat: Infinity },
          }}
          style={{
            background: `radial-gradient(circle at 40% 40%, #FFD700, #00D4FF 70%, transparent 90%)`,
          }}
        />
        <motion.h1
          className="text-5xl font-bold mb-3 bg-gradient-to-r from-orange-500 via-cyan-400 to-purple-500 bg-clip-text text-transparent"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2.4 }}
        >
          CONSTELLATION
        </motion.h1>
        <motion.p
          className="text-white text-lg tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.9, 1] }}
          transition={{
            delay: 2.6,
            duration: 0.4,
          }}
        >
          WALKER
        </motion.p>
      </motion.div>

      {/* Starfield */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {[...Array(120)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: prefersReducedMotion ? 0.5 : [0, Math.random() * 0.8 + 0.2, 0],
              scale: prefersReducedMotion ? 0.5 : [0, Math.random() * 2 + 0.5, 0],
            }}
            transition={{
              delay: 0.7 + Math.random() * 0.6,
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

