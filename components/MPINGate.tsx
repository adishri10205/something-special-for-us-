import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertTriangle, ShieldCheck, RefreshCw, Delete } from 'lucide-react';

interface MPINGateProps {
    children: React.ReactNode;
}

const MPINGate: React.FC<MPINGateProps> = ({ children }) => {
    const { currentUser, isAppLocked, unlockApp, setupMpin, requestMpinReset, clearSecurityAlerts } = useAuth();
    const [inputMpin, setInputMpin] = useState('');
    const [mode, setMode] = useState<'enter' | 'setup' | 'confirm'>('enter');
    const [setupMpinTemp, setSetupMpinTemp] = useState('');
    const [error, setError] = useState('');
    const [isShake, setIsShake] = useState(false);

    useEffect(() => {
        if (currentUser && !currentUser.mpin) {
            setMode('setup');
        } else {
            setMode('enter');
        }
    }, [currentUser]);

    const handleNumClick = (num: string) => {
        if (inputMpin.length < 4) {
            setInputMpin(prev => prev + num);
            setError('');
        }
    };

    const handleBackspace = () => {
        setInputMpin(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (inputMpin.length !== 4) return;

        if (mode === 'enter') {
            const success = await unlockApp(inputMpin);
            if (!success) {
                setError("Incorrect MPIN");
                setIsShake(true);
                setTimeout(() => setIsShake(false), 500);
                // Auto-clear after showing error for 600ms
                setTimeout(() => {
                    setInputMpin('');
                    setError('');
                }, 600);
            }
        } else if (mode === 'setup') {
            setSetupMpinTemp(inputMpin);
            setMode('confirm');
            setInputMpin('');
        } else if (mode === 'confirm') {
            if (inputMpin === setupMpinTemp) {
                await setupMpin(inputMpin);
                // Success
            } else {
                setError("MPINs do not match. Try again.");
                setIsShake(true);
                setTimeout(() => setIsShake(false), 500);
                // Auto-clear after showing error for 600ms
                setTimeout(() => {
                    setMode('setup');
                    setInputMpin('');
                    setSetupMpinTemp('');
                    setError('');
                }, 600);
            }
        }
    };

    useEffect(() => {
        if (inputMpin.length === 4) {
            handleSubmit();
        }
    }, [inputMpin]);

    // Handle Keyboard Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^\d$/.test(e.key)) {
                if (inputMpin.length < 4) {
                    setInputMpin(prev => prev + e.key);
                    setError('');
                }
            } else if (e.key === 'Backspace') {
                setInputMpin(prev => prev.slice(0, -1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputMpin]);

    if (!currentUser) return <>{children}</>; // Should be handled by ProtectedRoute

    // If user has MPIN and NOT locked -> Render Children
    if (currentUser.mpin && !isAppLocked) {
        return (
            <>
                {children}
            </>
        );
    }

    // Otherwise, Render Lock Screen (Setup or Enter)
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md overflow-hidden font-sans">
            {/* Dynamic Aurora Background - Lighter */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-300 rounded-full blur-[120px] opacity-40 animate-pulse mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-300 rounded-full blur-[120px] opacity-40 animate-pulse delay-700 mix-blend-multiply" />
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-rose-300 rounded-full blur-[120px] opacity-40 animate-bounce duration-[10000ms] mix-blend-multiply" />
            </div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: isShake ? [0, -10, 10, -10, 10, 0] : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="backdrop-blur-2xl bg-white/70 border border-white/60 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[340px] overflow-hidden relative z-10"
            >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

                <div className="pt-10 pb-6 text-center px-6 relative z-10">
                    <motion.div
                        animate={{ rotate: mode === 'enter' ? 0 : 360 }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto w-16 h-16 bg-gradient-to-tr from-rose-100 to-rose-50 border border-white text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm"
                    >
                        {mode === 'enter' ? <Lock size={28} /> : <ShieldCheck size={28} />}
                    </motion.div>

                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                        {mode === 'enter' ? 'Locked' : mode === 'setup' ? 'Set New PIN' : 'Confirm PIN'}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm font-medium">
                        {mode === 'enter'
                            ? 'Enter your PIN to resume'
                            : mode === 'setup'
                                ? 'Create a secure 4-digit PIN'
                                : 'Re-enter PIN to verify'}
                    </p>

                    {/* Warning on Lock Screen */}
                    {mode === 'enter' && currentUser.failedMpinAttempts && currentUser.failedMpinAttempts > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 bg-red-50 text-red-600 text-[10px] font-bold py-1.5 px-4 rounded-full border border-red-100 inline-flex items-center gap-1"
                        >
                            <AlertTriangle size={12} /> {currentUser.failedMpinAttempts} failed attempts
                        </motion.div>
                    )}
                </div>

                {/* PIN Dots */}
                <div className="flex justify-center gap-4 py-6 relative z-10">
                    {[0, 1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: i < inputMpin.length ? 1.2 : 1,
                                backgroundColor: i < inputMpin.length ? '#f43f5e' : '#e2e8f0'
                            }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="w-3.5 h-3.5 rounded-full"
                        />
                    ))}
                </div>

                {error && <p className="text-rose-500 text-center text-xs font-bold mb-6 animate-pulse px-4">{error}</p>}

                {/* Num Pad */}
                <div className="bg-white/40 p-6 pb-8 relative z-10 backdrop-blur-sm border-t border-white/50">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumClick(num.toString())}
                                className="h-16 w-full bg-white hover:bg-white/80 active:bg-gray-50 rounded-full transition-all duration-200 text-2xl font-medium text-gray-700 shadow-sm border border-gray-100 outline-none flex items-center justify-center touch-manipulation group"
                            >
                                <span className="group-active:scale-95 transition-transform">{num}</span>
                            </button>
                        ))}

                        {/* Bottom Row */}
                        <div className="flex items-center justify-center">
                            {mode === 'enter' && (
                                <button onClick={requestMpinReset} className="text-[10px] text-gray-400 font-bold hover:text-rose-500 uppercase tracking-wider transition-colors">
                                    Forget?
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => handleNumClick('0')}
                            className="h-16 w-full bg-white hover:bg-white/80 active:bg-gray-50 rounded-full transition-all duration-200 text-2xl font-medium text-gray-700 shadow-sm border border-gray-100 outline-none flex items-center justify-center touch-manipulation group"
                        >
                            <span className="group-active:scale-95 transition-transform">0</span>
                        </button>

                        <button
                            onClick={handleBackspace}
                            className="h-16 w-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all rounded-full hover:bg-gray-50 active:bg-gray-100"
                        >
                            <span className="text-xl transform active:scale-90 transition-transform">⌫</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MPINGate;
