import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';

const Message: React.FC = () => {
  const [stage, setStage] = useState<'envelope' | 'wish' | 'letter'>('envelope');
  const { birthdayMessage } = useData();

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
      <AnimatePresence mode='wait'>
        
        {/* STAGE 1: ENVELOPE */}
        {stage === 'envelope' && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, y: 100 }}
            className="cursor-pointer group"
            onClick={() => setStage('wish')}
          >
            <div className="relative w-72 h-48 md:w-96 md:h-64 bg-rose-200 rounded-lg shadow-2xl flex items-center justify-center border-b-4 border-rose-300">
              {/* Envelope Flap */}
              <div className="absolute top-0 left-0 w-0 h-0 border-l-[144px] md:border-l-[192px] border-r-[144px] md:border-r-[192px] border-t-[100px] md:border-t-[130px] border-l-transparent border-r-transparent border-t-rose-300 transform origin-top group-hover:rotate-x-180 transition-transform duration-700 ease-in-out z-20"></div>
              
              {/* Heart Seal */}
              <div className="z-30 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg -mt-12 group-hover:mt-[-140px] transition-all duration-700">
                <Gift className="text-white w-6 h-6" />
              </div>

              {/* Text Hint */}
              <div className="absolute -bottom-12 text-rose-500 font-script text-xl animate-bounce">
                Tap to Open
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2: BIRTHDAY WISH */}
        {stage === 'wish' && (
          <motion.div
            key="wish"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            className="text-center z-10"
          >
            {/* Confetti Effect (CSS only for simplicity) */}
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 md:w-4 md:h-4 bg-yellow-400 rounded-full"
                  initial={{ y: -100, x: Math.random() * window.innerWidth }}
                  animate={{ y: window.innerHeight + 100, rotate: 360 }}
                  transition={{ duration: Math.random() * 2 + 2, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0'][i % 4] }}
                />
              ))}
            </div>

            <motion.h1
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.3, type: "spring" }}
              className="font-script text-6xl md:text-8xl text-rose-600 drop-shadow-md mb-6"
            >
              Happy Birthday!
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
               <div className="text-8xl mb-8">🎂</div>
               <button 
                onClick={() => setStage('letter')}
                className="bg-white text-rose-600 px-8 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
               >
                 Read Letter <ChevronRight size={20} />
               </button>
            </motion.div>
          </motion.div>
        )}

        {/* STAGE 3: THE LETTER */}
        {stage === 'letter' && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-2xl shadow-xl border border-rose-100 m-4 relative overflow-y-auto max-h-[80vh]"
          >
            <div className="text-center mb-6">
              <span className="text-6xl">💌</span>
            </div>
            
            <div className="prose prose-rose mx-auto text-center">
               <p className="font-script text-3xl md:text-4xl leading-relaxed text-gray-800 whitespace-pre-wrap">
                 {birthdayMessage}
               </p>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-block px-4 py-2 border-t border-b border-rose-200">
                <p className="text-sm uppercase tracking-widest text-rose-500 font-semibold">Forever Yours</p>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Message;