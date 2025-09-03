import { motion, useReducedMotion } from "framer-motion";

export default function LoadingScreen() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
      role="status"
      aria-label="Loading"
    >
      {/* Big Bang - singura animație */}
      <motion.div
        className="w-32 h-32 rounded-full bg-white"
        initial={{ scale: 0, opacity: 1 }}
        animate={{
          scale: prefersReducedMotion ? 1 : 15,
          opacity: [1, 0.8, 0],
        }}
        transition={{ 
          duration: prefersReducedMotion ? 0 : 2,
          ease: "easeOut"
        }}
      />
    </motion.div>
  );
}
