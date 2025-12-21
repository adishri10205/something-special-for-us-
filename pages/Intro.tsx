import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useData } from '../context/DataContext';
import { AppState, IntroStep } from '../types';
import FloatingHearts from '../components/FloatingHearts';
import ChatIntro from '../components/ChatIntro';

const Intro: React.FC = () => {
  const { setAppState, togglePlay } = useApp();
  const { startupSettings, markIntroSeen, introFlow, isLoadingSettings } = useData();
  const navigate = useNavigate();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSkipping, setIsSkipping] = useState(true);

  // If no flow defined, create a minimal default to prevent errors
  const safeFlow: IntroStep[] = introFlow && introFlow.length > 0 ? introFlow : [
    { id: 'default', type: 'greeting', title: 'Happy Birthday', content: 'Welcome!', buttonText: 'Start' }
  ];

  const currentStep = safeFlow[currentStepIndex];

  useEffect(() => {
    if (isLoadingSettings) return;

    // Check local storage for seen status (client-specific)
    const localHasSeen = localStorage.getItem('intro_seen') === 'true';

    // Check if we should skip the intro
    const shouldSkip =
      startupSettings.mode === 'direct_home' ||
      (startupSettings.showOnce && localHasSeen);

    if (shouldSkip) {
      setAppState(AppState.HOME);
      navigate('/home');
    } else {
      setIsSkipping(false);

      // If mode is 'countdown', jump straight to countdown
      if (startupSettings.mode === 'countdown') {
        startCountdown();
      }
    }
  }, [startupSettings, navigate, setAppState, isLoadingSettings]);

  if (isLoadingSettings) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-rose-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (isSkipping) return null;

  const handleNext = () => {
    if (currentStepIndex === 0) {
      togglePlay(); // Start music on first interaction
    }

    if (currentStepIndex < safeFlow.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      startCountdown();
    }
  };

  const handleAnswer = (option: string) => {
    handleNext();
  };

  const startCountdown = () => {
    // Ensure we don't start multiple intervals
    if (countdown !== null) return;

    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        if (startupSettings.showOnce) {
          localStorage.setItem('intro_seen', 'true');
        }
        markIntroSeen();
        setAppState(AppState.HOME);
        navigate('/home');
      }
    }, 1000);
  };

  if (isSkipping) return null;

  // Render content based on step type
  const renderStepContent = (step: IntroStep) => {
    switch (step.type) {
      case 'greeting':
      case 'text':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-10 flex flex-col items-center text-center px-6"
          >
            {step.title && (
              <motion.h1
                className="font-script text-5xl md:text-7xl text-rose-600 mb-6 drop-shadow-sm text-center leading-tight"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {step.title.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < step.title!.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </motion.h1>
            )}

            {step.content && (
              <p className="text-rose-800/70 text-lg md:text-xl font-light mb-12 max-w-md whitespace-pre-line">
                {step.content}
              </p>
            )}

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/40 backdrop-blur-sm border border-white/60 text-rose-600 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:bg-white/60 transition-all flex items-center gap-2"
            >
              {step.buttonText || 'Next'} {step.type === 'greeting' && <span className="text-xl">❤️</span>}
            </motion.button>
          </motion.div>
        );

      case 'meme':
      case 'image':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="z-10 flex flex-col items-center text-center px-6 max-w-lg"
          >
            {step.mediaUrl ? (
              <img src={step.mediaUrl} alt="Visual" className="max-w-xs rounded-lg shadow-lg mb-6 max-h-64 object-cover" />
            ) : (
              <div className="text-6xl mb-6">✋</div>
            )}

            {step.title && (
              <h2 className="text-2xl md:text-3xl text-rose-700 font-bold mb-6 whitespace-pre-line">
                {step.title}
              </h2>
            )}

            <p className="text-rose-800 text-lg mb-8 whitespace-pre-line">
              {step.content}
            </p>

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-rose-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-rose-600 transition-all"
            >
              {step.buttonText || 'Next ➡️'}
            </motion.button>
          </motion.div>
        );

      case 'chat':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 w-full px-4 h-[500px] flex items-center justify-center"
          >
            <div className="w-full max-w-md h-full">
              <ChatIntro onComplete={handleNext} />
            </div>
          </motion.div>
        );



      case 'quiz':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 flex flex-col items-center text-center px-6 max-w-xl w-full"
          >
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-xl w-full">
              <span className="text-rose-400 text-sm font-semibold uppercase tracking-wider mb-2 block">
                Question
              </span>
              <h3 className="text-xl md:text-2xl text-gray-800 font-medium mb-8 whitespace-pre-line">
                {step.content}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {step.options?.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-rose-100 text-gray-700 py-4 px-6 rounded-xl shadow-sm hover:shadow-md hover:border-rose-300 hover:bg-rose-50 transition-all text-left"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-rose-50 overflow-hidden">
      <FloatingHearts />

      <AnimatePresence mode='wait'>
        {countdown === null ? (
          renderStepContent(currentStep)
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