import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { AppState } from '../types';
import FloatingHearts from '../components/FloatingHearts';

const Intro: React.FC = () => {
  const { setAppState, togglePlay } = useApp();
  const { startupSettings, markIntroSeen } = useData();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSkipping, setIsSkipping] = useState(true);

  useEffect(() => {
    // Check if we should skip the intro
    const shouldSkip = 
      startupSettings.mode === 'direct_home' || 
      (startupSettings.showOnce && startupSettings.hasSeen);

    if (shouldSkip) {
      setAppState(AppState.HOME);
      navigate('/home');
    } else {
      setIsSkipping(false);
    }
  }, [startupSettings, navigate, setAppState]);

  const handleStart = () => {
    // Start music interaction
    togglePlay();
    setCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        markIntroSeen(); // Mark as seen in DataContext
        setAppState(AppState.HOME);
        navigate('/home');
      }
    }, 1000);
  };

  if (isSkipping) return null;

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-rose-50 overflow-hidden">
      <FloatingHearts />

      <AnimatePresence mode='wait'>
        {countdown === null ? (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-10 flex flex-col items-center text-center px-6"
          >
            {/* Show Header only if mode is FULL */}
            {startupSettings.mode === 'full' && (
              <>
                <motion.h1 
                  className="font-script text-5xl md:text-7xl text-rose-600 mb-6 drop-shadow-sm"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  Happy Birthday
                </motion.h1>
                <p className="text-rose-800/70 text-lg md:text-xl font-light mb-12 max-w-md">
                  A special moment is waiting for you...
                </p>
              </>
            )}

            {startupSettings.mode === 'countdown' && (
              <div className="mb-12">
                 <div className="text-6xl mb-4">✨</div>
                 <p className="text-rose-800/70 text-xl font-light">Are you ready?</p>
              </div>
            )}

            <motion.button
              onClick={handleStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/40 backdrop-blur-sm border border-white/60 text-rose-600 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:bg-white/60 transition-all flex items-center gap-2"
            >
              Tap to Begin <span className="text-xl">❤️</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="countdown"
            className="z-10 flex items-center justify-center"
          >
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1.5, rotate: 0 }}
              exit={{ opacity: 0, scale: 3 }}
              transition={{ duration: 0.8 }}
              className="font-script text-9xl text-rose-500 font-bold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Intro;