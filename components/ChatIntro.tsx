import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCcw, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ChatStep } from '../types';

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    isError?: boolean;
    type?: 'text' | 'image' | 'gif' | 'link' | 'options' | 'login_options';
    mediaUrl?: string;
    linkUrl?: string;
    linkText?: string;
    options?: string[];
    showGoogleLogin?: boolean;
}

interface ChatIntroProps {
    onComplete: () => void;
    onFailure: () => void;
}

const ChatIntro: React.FC<ChatIntroProps> = ({ onComplete, onFailure }) => {
    const { chatSteps, isLoadingChat } = useData();
    const { loginWithGoogle, loginWithEmail, logout, banCurrentDevice } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFailed, setIsFailed] = useState(false);
    const [attempts, setAttempts] = useState(0);

    // Auth Logic State
    const [authMode, setAuthMode] = useState<'idle' | 'email_entry' | 'password_entry'>('idle');
    const [authEmail, setAuthEmail] = useState('');

    // Variables
    const [userVariables, setUserVariables] = useState<Record<string, string>>({});
    const [showWarningModal, setShowWarningModal] = useState(false); // New Modal State
    const [warningModalContent, setWarningModalContent] = useState(''); // New Modal Content
    const userVariablesRef = useRef<Record<string, string>>({});

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Initial Start
    useEffect(() => {
        if (!isLoadingChat && chatSteps && chatSteps.length > 0 && !initialized.current) {
            renderStep(0);
            initialized.current = true;
        } else if (!isLoadingChat && (!chatSteps || chatSteps.length === 0) && !initialized.current) {
            onComplete();
            initialized.current = true;
        }
    }, [chatSteps, isLoadingChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatText = (text: string) => {
        if (!text) return '';
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return userVariablesRef.current[key] || userVariables[key] || match;
        });
    };

    const renderStep = (index: number) => {
        if (!chatSteps || index >= chatSteps.length) return;
        const step = chatSteps[index];

        if (step.type === 'end') {
            onComplete();
            return;
        }

        const formattedQuestion = formatText(step.question);

        // Add Bot Message
        addBotMessage(formattedQuestion, step.type === 'login' ? undefined : (step.type as any), step);

        // Special Handling for Login Step
        if (step.type === 'login') {
            handleLoginStep(step);
            return;
        }

        if (step.inputRequired === false) {
            const textLen = formattedQuestion ? formattedQuestion.length : 0;
            const delay = textLen > 0 ? Math.min(6000, 1500 + (textLen * 50)) : 3000;

            setTimeout(() => {
                handleStepTransition(index, step, undefined);
            }, delay);
        }
    };

    const handleLoginStep = (step: ChatStep) => {
        // Check for saved email
        const savedEmail = localStorage.getItem('user_email');

        if (savedEmail) {
            setAuthEmail(savedEmail);
            setTimeout(() => {
                addBotMessage(`Welcome back, ${savedEmail}.`);
                setTimeout(() => {
                    addBotMessage("Please enter your password:");
                    setAuthMode('password_entry');
                }, 800);
            }, 800);
        } else {
            // New User - Show Options
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "Auth Options",
                    sender: 'bot',
                    type: 'login_options'
                }]);
            }, 800);
        }
    };

    const handleStepTransition = (stepIndex: number, currentStep: ChatStep, userChoice?: string) => {
        let targetId = currentStep.nextStepId;

        if (currentStep.type === 'options' && currentStep.branches && userChoice) {
            const branch = currentStep.branches.find((b: any) => b.label === userChoice);
            if (branch) {
                targetId = branch.nextStepId;
            }
        }

        if (targetId) {
            const nextIndex = chatSteps!.findIndex(s => s.id === targetId);
            if (nextIndex !== -1) {
                setCurrentStepIndex(nextIndex);
                renderStep(nextIndex);
            } else {
                // Fallback: If target not found, try sequential
                if (stepIndex < chatSteps!.length - 1) {
                    setCurrentStepIndex(stepIndex + 1);
                    renderStep(stepIndex + 1);
                } else {
                    onComplete();
                }
            }
        } else {
            if (stepIndex < chatSteps!.length - 1) {
                setCurrentStepIndex(stepIndex + 1);
                renderStep(stepIndex + 1);
            } else {
                onComplete();
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const userCred = await loginWithGoogle();
            const email = userCred.user.email?.toLowerCase();
            const currentStep = chatSteps![currentStepIndex];

            // Whitelist Check (if expectedAnswer provided)
            if (currentStep.expectedAnswer && email) {
                const allowed = currentStep.expectedAnswer.split(',').map(s => s.trim().toLowerCase());
                if (!allowed.includes(email)) {
                    await logout(); // Kick out immediately

                    const newAttempts = attempts + 1;
                    setAttempts(newAttempts);

                    if (newAttempts >= 2) {
                        addBotMessage("Unauthorized Email. Device Banned (Security Policy).", undefined, undefined, true);
                        setTimeout(() => banCurrentDevice("Unauthorized Google Login"), 1500);
                        return;
                    }

                    addBotMessage(currentStep.failureReply || "Warning: Please select the correct email that Aditya told you to use.", undefined, undefined, true);
                    return;
                }
            }

            addBotMessage(currentStep.successReply || "Google Authentication Successful.", undefined, currentStep);
            finishLoginStep();
        } catch (error) {
            console.error("Google Auth Error", error);
            addBotMessage("Authentication Failed. Please try again.");
        }
    };

    const finishLoginStep = () => {
        setAuthMode('idle');
        const currentStep = chatSteps![currentStepIndex];
        setTimeout(() => {
            handleStepTransition(currentStepIndex, currentStep, 'success');
        }, 1000);
    };

    const handleSend = (overrideText?: string) => {
        const textToSend = overrideText || inputText;
        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        setTimeout(() => {
            if (authMode !== 'idle') {
                processAuthInput(textToSend);
            } else {
                processFlowResponse(textToSend);
            }
        }, 600);
    };

    const processAuthInput = async (input: string) => {
        if (authMode === 'email_entry') {
            if (!input.includes('@')) {
                addBotMessage("Invalid email format.");
                return;
            }
            setAuthEmail(input);
            localStorage.setItem('user_email', input);
            setAuthMode('password_entry');
            addBotMessage("Enter password:");
        }
        else if (authMode === 'password_entry') {
            try {
                addBotMessage("Verifying...");
                await loginWithEmail(authEmail, input);
                addBotMessage("Access Granted.");
                finishLoginStep();
            } catch (err) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                if (newAttempts >= 2) {
                    addBotMessage("Access Denied. Device Banned.");
                    setTimeout(() => banCurrentDevice("Failed Login Attempts"), 1000);
                } else {
                    addBotMessage("Incorrect Password. Try again:");
                }
            }
        }
    };

    const addBotMessage = (text: string, type?: Message['type'], step?: ChatStep, isError?: boolean) => {
        const msg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'bot',
            type: type || 'text',
            mediaUrl: step?.mediaUrl,
            linkUrl: step?.linkUrl,
            linkText: step?.linkText,
            options: step?.options,
            showGoogleLogin: step?.showGoogleLogin,
            isError: !!isError
        };
        setMessages(prev => [...prev, msg]);
    };

    const processFlowResponse = (input: string) => {
        if (!chatSteps || chatSteps.length === 0) {
            onComplete();
            return;
        }
        const currentStep = chatSteps[currentStepIndex];
        if (!currentStep) return;

        // Normalization helper for robust matching (including Emojis)
        const normalizeForMatch = (str: string) => {
            return str.toLowerCase().trim().replace(/[\uFE0F\uFE0E]/g, '');
        };

        const lowerInput = normalizeForMatch(input);
        const rawExpected = currentStep.expectedAnswer || '';

        // Handle Multiple Expected Answers (Comma Separated)
        const possibilities = rawExpected.split(',').map(s => normalizeForMatch(formatText(s))).filter(s => s);

        let isCorrect = false;
        if (currentStep.matchType === 'exact') {
            isCorrect = possibilities.some(p => lowerInput === p);
        } else {
            isCorrect = possibilities.some(p => lowerInput.includes(p));
        }

        if (isCorrect) {
            setAttempts(0); // Reset attempts on success
            if (currentStep.variable) {
                const newVal = { ...userVariables, [currentStep.variable!]: input };
                setUserVariables(newVal);
                userVariablesRef.current = { ...userVariablesRef.current, [currentStep.variable!]: input };
            }
            if (currentStep.successReply) {
                addBotMessage(formatText(currentStep.successReply));
            }
            setTimeout(() => {
                handleStepTransition(currentStepIndex, currentStep, input);
            }, 1000);
        } else {
            // Handle Failure Logic

            // 1. Check for Configured Redirect first (Treats as 'Handled' failure)
            if (currentStep.failureNextStepId) {
                // Special Case: Immediate Ban Configured
                if (currentStep.failureNextStepId === 'BAN_DEVICE') {
                    const msg = currentStep.warningMessage || "Verification Failed. Access Denied.";
                    addBotMessage(formatText(msg).replace('{input}', input));
                    setTimeout(() => banCurrentDevice("Step Failure Enforcement"), 1500);
                    return;
                }

                // Special Case: Warning Only (No Ban, Infinite Retries unless Limited)
                if (currentStep.failureNextStepId === 'WARNING_ONLY') {
                    const currentAttempts = attempts + 1;
                    setAttempts(currentAttempts);

                    if (currentStep.maxAttempts && currentAttempts >= currentStep.maxAttempts) {
                        addBotMessage("Maximum attempts exceeded. Access Denied.");
                        setTimeout(() => banCurrentDevice("Max Attempts Exceeded"), 1500);
                        return;
                    }

                    const msg = currentStep.warningMessage || "Warning: Incorrect Answer.";
                    setWarningModalContent(formatText(msg).replace('{input}', input));
                    setShowWarningModal(true);
                    return;
                }

                setAttempts(0); // Reset attempts since we are moving
                const nextIndex = chatSteps.findIndex(s => s.id === currentStep.failureNextStepId);
                if (nextIndex !== -1) {
                    const failText = currentStep.failureReply;
                    if (failText) {
                        addBotMessage(formatText(failText).replace('{input}', input));
                    }
                    setTimeout(() => {
                        setCurrentStepIndex(nextIndex);
                        renderStep(nextIndex);
                    }, 1000);
                    return;
                }
            }

            // 2. Simple Retry (No Default Ban)
            const failText = currentStep.failureReply || "Incorrect, try again.";
            addBotMessage(formatText(failText).replace('{input}', input));
        }
    };

    const handleRetry = () => {
        setMessages([]);
        setCurrentStepIndex(0);
        setIsFailed(false);
        setAttempts(0);
        setAuthMode('idle');
        setAuthEmail('');
        setTimeout(() => renderStep(0), 100);
    };

    if (isLoadingChat) {
        return <div className="flex items-center justify-center h-full text-white font-bold">Loading...</div>;
    }

    // Input depends on Auth Mode OR Chat Step requirement
    const isInputRequired = authMode !== 'idle'
        ? true
        : (chatSteps && chatSteps[currentStepIndex]?.inputRequired !== false && chatSteps[currentStepIndex]?.type !== 'login');

    return (
        <div className="flex flex-col h-full w-full bg-white/30 backdrop-blur-sm relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 space-y-6 scroll-smooth">
                <div className="max-w-3xl mx-auto w-full space-y-6">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] md:max-w-[75%] px-5 py-3.5 text-base leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-rose-600 text-white rounded-2xl rounded-tr-sm'
                                        : msg.isError
                                            ? 'bg-red-50 text-red-800 rounded-2xl border border-red-100'
                                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                        }`}
                                >
                                    {(msg.type === 'image' || msg.type === 'gif') && msg.mediaUrl && (
                                        <div className="mb-3 mt-1">
                                            <img
                                                src={msg.mediaUrl}
                                                alt="Chat Media"
                                                className={`rounded-xl max-h-64 md:max-h-80 w-auto border border-black/5 ${msg.type === 'gif' ? 'object-contain' : 'object-cover'}`}
                                            />
                                        </div>
                                    )}

                                    {msg.text && msg.type !== 'login_options' && (
                                        <div className="whitespace-pre-line font-normal tracking-wide">
                                            {msg.text}
                                        </div>
                                    )}

                                    {msg.type === 'link' && msg.linkUrl && (
                                        <div className="mt-3">
                                            <a
                                                href={msg.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                                            >
                                                <span>🔗</span> {msg.linkText || 'Open Link'}
                                            </a>
                                        </div>
                                    )}

                                    {msg.type === 'options' && msg.options && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {msg.options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSend(option)}
                                                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-sm font-medium border border-rose-200 transition-all active:scale-95"
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {msg.showGoogleLogin && (
                                        <div className="mt-4 w-full">
                                            <button
                                                onClick={handleGoogleLogin}
                                                className="flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold shadow-sm transition-all w-full md:w-auto"
                                            >
                                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                                <span>Sign in with Google</span>
                                            </button>
                                        </div>
                                    )}

                                    {msg.type === 'login_options' && (
                                        <div className="mt-5 flex flex-col gap-3 w-full min-w-[200px]">
                                            <button
                                                onClick={handleGoogleLogin}
                                                className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold shadow-sm transition-all active:scale-[0.98]"
                                            >
                                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                                <span>Sign in with Google</span>
                                            </button>
                                            <div className="flex items-center gap-3 py-1">
                                                <span className="flex-1 h-px bg-gray-200"></span>
                                                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">or</span>
                                                <span className="flex-1 h-px bg-gray-200"></span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setAuthMode('email_entry');
                                                    addBotMessage("Please enter your email address:");
                                                }}
                                                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl font-semibold transition-all active:scale-[0.98]"
                                            >
                                                <span>Continue with Email</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-32 pointer-events-none" />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-4 pb-6 bg-gradient-to-t from-white via-white/95 to-transparent z-50 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto">
                    {isFailed ? (
                        <button
                            onClick={handleRetry}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-lg active:scale-[0.99]"
                        >
                            <RefreshCcw size={20} /> Restart Session
                        </button>
                    ) : !isInputRequired ? (
                        <div className="flex items-center justify-center p-4 bg-white/50 rounded-2xl border border-white/40 backdrop-blur-sm">
                            <div className="flex gap-2">
                                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce"></span>
                                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 bg-white p-2 rounded-[1.5rem] shadow-2xl shadow-rose-900/10 border border-gray-100 items-center ring-1 ring-black/5">
                            <input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={authMode === 'password_entry' ? "Enter password..." : "Message..."}
                                type={authMode === 'password_entry' ? "password" : "text"}
                                className="flex-1 pl-4 py-3 bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400 font-medium text-lg min-w-0"
                                autoFocus
                                TargetLintErrorIds={['92759717-ba8e-4ec9-b069-25e2bca63a2b']}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!inputText.trim()}
                                className="p-3 bg-gray-900 text-white rounded-full hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 flex-shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Warning Modal */}
            {
                showWarningModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-red-50">
                                <Lock className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Warning</h3>
                            <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                                {warningModalContent}
                            </p>
                            <button
                                onClick={() => setShowWarningModal(false)}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-bold transition-colors"
                            >
                                Okay, I understand
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ChatIntro;
