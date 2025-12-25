import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { AppState, IntroStep } from '../types';
import FloatingHearts from '../components/FloatingHearts';
import ChatIntro from '../components/ChatIntro';
import MuxPlayer from '@mux/mux-player-react';

const Intro: React.FC = () => {
  const { setAppState, togglePlay } = useApp();
  const { currentUser, loading: authLoading } = useAuth();
  const { startupSettings, markIntroSeen, introFlow, isLoadingSettings } = useData();
  const navigate = useNavigate();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [securityState, setSecurityState] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [isSkipping, setIsSkipping] = useState(true);

  // Filter out disabled steps
  const activeFlow = introFlow ? introFlow.filter(step => !step.disabled) : [];

  // If no flow defined, create a minimal default to prevent errors
  const safeFlow: IntroStep[] = activeFlow.length > 0 ? activeFlow : [
    { id: 'default', type: 'greeting', title: 'Happy Birthday', content: 'Welcome!', buttonText: 'Start' }
  ];

  const currentStep = safeFlow[currentStepIndex];

  useEffect(() => {
    if (isLoadingSettings || authLoading) return;

    // Check local storage for seen status (client-specific)
    const localHasSeen = localStorage.getItem('intro_seen') === 'true';

    // Check if we should skip the intro
    const shouldSkip =
      startupSettings.mode === 'direct_home' ||
      (startupSettings.showOnce && localHasSeen) ||
      (currentUser?.mpin);

    if (shouldSkip) {
      setAppState(AppState.HOME);
      navigate('/home');
    } else {
      setIsSkipping(false);

      // If mode is 'countdown', jump straight to countdown
      if (startupSettings.mode === 'countdown') {
        startSecurityProtocol();
      }
    }
  }, [startupSettings, navigate, setAppState, isLoadingSettings, authLoading, currentUser]);

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
      startSecurityProtocol();
    }
  };

  const handleAnswer = (option: string) => {
    handleNext();
  };

  const startSecurityProtocol = () => {
    // Ensure we don't start multiple intervals
    if (securityState !== 'idle') return;

    setSecurityState('checking');

    // Simulate short loading/check then go straight to home
    setTimeout(() => {
      if (startupSettings.showOnce) {
        localStorage.setItem('intro_seen', 'true');
      }
      markIntroSeen();
      setAppState(AppState.HOME);
      navigate('/home');
    }, 2000);
  };

  const handleSecurityFailure = () => {
    setSecurityState('failed');
  };

  if (isSkipping) return null;

  // Render content based on step type
  const renderStepContent = (step: IntroStep | undefined) => {
    if (!step) return null;

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

      case 'video':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full"
          >
            {step.title && (
              <h2 className="text-2xl md:text-3xl text-rose-700 font-bold mb-4 whitespace-pre-line">
                {step.title}
              </h2>
            )}

            {step.mediaUrl && (
              <div className="w-full flex justify-center mb-6">
                {step.mediaUrl.includes('http') ? (
                  <video
                    src={step.mediaUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[70vh] w-auto h-auto rounded-xl shadow-2xl"
                  />
                ) : (
                  <MuxPlayer
                    playbackId={step.mediaUrl}
                    streamType="on-demand"
                    autoPlay
                    metadata={{ video_title: step.title || 'Intro Video' }}
                    className="max-w-full max-h-[70vh] w-auto h-auto rounded-xl shadow-2xl"
                  />
                )}
              </div>
            )}

            {step.content && (
              <p className="text-rose-800 text-lg mb-8 whitespace-pre-line">
                {step.content}
              </p>
            )}

            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-rose-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-rose-600 transition-all z-20"
            >
              {step.buttonText || 'Continue ➡️'}
            </motion.button>
          </motion.div>
        );

      case 'audio':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 flex flex-col items-center text-center px-6 max-w-lg w-full"
          >
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-xl w-full">
              {step.title && (
                <h2 className="text-2xl md:text-3xl text-rose-700 font-bold mb-4 whitespace-pre-line">
                  {step.title}
                </h2>
              )}

              <div className="mb-6">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎵</span>
                </div>
                {step.mediaUrl && (
                  <audio
                    src={step.mediaUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                )}
              </div>

              {step.content && (
                <p className="text-rose-800 text-lg mb-6 whitespace-pre-line">
                  {step.content}
                </p>
              )}

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-rose-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-rose-600 transition-all w-full"
              >
                {step.buttonText || 'Next ➡️'}
              </motion.button>
            </div>
          </motion.div>
        );

      case 'chat':
        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-full flex flex-col items-center"
          >
            <div className="w-full h-full">
              <ChatIntro onComplete={handleNext} onFailure={handleSecurityFailure} />
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
    <div className="fixed inset-0 w-full flex flex-col items-center justify-center bg-rose-50 overflow-hidden">
      <FloatingHearts />

      <AnimatePresence mode='wait'>
        {(securityState === 'idle' && currentStep) ? (
          renderStepContent(currentStep)
        ) : securityState === 'checking' ? (
          <motion.div
            key="checking"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="z-20 p-8 flex flex-col items-center justify-center text-center max-w-sm"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-rose-200 rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-0 border-4 border-t-rose-500 border-r-rose-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🛡️</div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 tracking-wide mb-2">VERIFYING IDENTITY</h2>
            <p className="text-xs text-rose-500 font-mono animate-pulse">RUNNING BIO-METRIC SCAN...</p>
          </motion.div>
        ) : securityState === 'verified' ? (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-20 text-center"
          >
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
              <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600 tracking-wider">ACCESS GRANTED</h2>
          </motion.div>
        ) : securityState === 'failed' ? (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-20 bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-l-4 border-red-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Security Alert</h2>
                <p className="text-xs text-gray-500 font-mono uppercase">UNAUTHORIZED ACCESS DETECTED</p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6">
              <p className="text-sm text-red-700 font-medium">
                System could not verify your identity.
              </p>
              <p className="text-xs text-red-500 mt-2">
                Details of this attempt have been logged and sent to the administrator.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Close Session
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Intro;