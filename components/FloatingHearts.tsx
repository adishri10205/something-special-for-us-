import React from 'react';
import { motion } from 'framer-motion';

const FloatingHearts: React.FC = () => {
  // Reduced count for mobile performance
  const hearts = Array.from({ length: 8 });

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            y: "120vh",
            x: Math.random() * 100 + "vw",
            opacity: 0,
            scale: 0.5
          }}
          animate={{
            y: "-20vh",
            opacity: [0, 0.5, 0],
            rotate: [0, 45, -45, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 15, // Slower, less frequent updates
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
          className="absolute text-rose-200/30 text-4xl sm:text-6xl will-change-transform"
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingHearts;