import React from 'react';
import { motion } from 'framer-motion';

const FloatingHearts: React.FC = () => {
  const hearts = Array.from({ length: 15 });

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
            opacity: [0, 0.8, 0], 
            rotate: [0, 45, -45, 0] 
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
          className="absolute text-rose-200/40 text-4xl sm:text-6xl"
        >
          ❤️
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-rose-50/20 backdrop-blur-[1px]" />
    </div>
  );
};

export default FloatingHearts;