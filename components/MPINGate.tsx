import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

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
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-3xl flex items-center justify-center p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-100/50 via-transparent to-blue-100/50 opacity-70" />
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-300/20 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: isShake ? [0, -10, 10, -10, 10, 0] : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[320px] overflow-hidden"
            >
                <div className="pt-8 pb-4 text-center px-6">
                    <motion.div
                        animate={{ rotate: mode === 'enter' ? 0 : 360 }}
                        transition={{ duration: 0.5 }}
                        className="mx-auto w-14 h-14 bg-gradient-to-tr from-rose-400 to-rose-600 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-200"
                    >
                        {mode === 'enter' ? <Lock size={24} /> : <ShieldCheck size={24} />}
                    </motion.div>

                    <h2 className="text-3xl font-script font-bold text-rose-600 tracking-wide">
                        {mode === 'enter' ? 'Welcome Back' : mode === 'setup' ? 'Set New PIN' : 'Confirm PIN'}
                    </h2>
                    <p className="text-gray-500 mt-1 text-xs font-medium">
                        {mode === 'enter'
                            ? 'Enter your PIN to access'
                            : mode === 'setup'
                                ? 'Create a secure 4-digit PIN'
                                : 'Re-enter PIN to verify'}
                    </p>

                    {/* Warning on Lock Screen */}
                    {mode === 'enter' && currentUser.failedMpinAttempts && currentUser.failedMpinAttempts > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 bg-red-50 text-red-600 text-[10px] font-bold py-1 px-3 rounded-full border border-red-100 inline-block"
                        >
                            ⚠️ {currentUser.failedMpinAttempts} failed attempts
                        </motion.div>
                    )}
                </div>

                {/* PIN Dots */}
                <div className="flex justify-center gap-4 py-6">
                    {[0, 1, 2, 3].map(i => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: i < inputMpin.length ? 1.15 : 1,
                                backgroundColor: i < inputMpin.length ? '#f43f5e' : '#e2e8f0'
                            }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                            className="w-3 h-3 rounded-full"
                        />
                    ))}
                </div>

                {error && <p className="text-rose-500 text-center text-xs font-bold mb-4 animate-pulse">{error}</p>}

                {/* Num Pad */}
                <div className="bg-gray-50/50 p-4 pb-8">
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleNumClick(num.toString())}
                                className="h-14 w-full bg-white/80 rounded-xl shadow-sm border border-gray-100 text-xl font-bold text-gray-700 active:bg-rose-100 active:scale-95 transition-all duration-100 flex items-center justify-center outline-none touch-manipulation"
                            >
                                {num}
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
                            className="h-14 w-full bg-white/80 rounded-xl shadow-sm border border-gray-100 text-xl font-bold text-gray-700 active:bg-rose-100 active:scale-95 transition-all duration-100 flex items-center justify-center outline-none touch-manipulation"
                        >
                            0
                        </button>

                        <button
                            onClick={handleBackspace}
                            className="h-14 w-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all rounded-xl hover:bg-gray-100"
                        >
                            <span className="text-xl">⌫</span>
                        </button>
                    </div>
                </div>

                {currentUser.mpinResetRequested && mode === 'enter' && (
                    <div className="bg-yellow-50 p-2 text-center text-[10px] text-yellow-700 font-medium border-t border-yellow-100">
                        Reset requested. Contact Admin.
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default MPINGate;
