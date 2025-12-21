import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCcw } from 'lucide-react';
import { useData } from '../context/DataContext';

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    isError?: boolean;
    type?: 'text' | 'image' | 'gif' | 'link' | 'options';
    mediaUrl?: string;
    linkUrl?: string;
    linkText?: string;
    options?: string[];
}

interface ChatIntroProps {
    onComplete: () => void;
}

const ChatIntro: React.FC<ChatIntroProps> = ({ onComplete }) => {
    const { chatSteps, isLoadingChat } = useData();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFailed, setIsFailed] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Initial Start
    useEffect(() => {
        if (!isLoadingChat && chatSteps && chatSteps.length > 0 && !initialized.current) {
            renderStep(0);
            initialized.current = true;
        }
    }, [chatSteps, isLoadingChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Render Step Helper
    const renderStep = (index: number) => {
        if (!chatSteps || index >= chatSteps.length) return;
        const step = chatSteps[index];

        const msg: Message = {
            id: Date.now().toString(),
            text: step.question,
            sender: 'bot',
            type: step.type || 'text',
            mediaUrl: step.mediaUrl,
            linkUrl: step.linkUrl,
            linkText: step.linkText,
            options: step.options
        };
        setMessages(prev => [...prev, msg]);

        // Auto-advance if input NOT required (Statement)
        if (step.inputRequired === false) {
            // Calculate reading time: 1.5s base + 50ms per character, capped at 6s
            // If no text, use shorter default delay for media (e.g. 3s)
            const textLen = step.question ? step.question.length : 0;
            const delay = textLen > 0 ? Math.min(6000, 1500 + (textLen * 50)) : 3000;

            setTimeout(() => {
                if (index < chatSteps.length - 1) {
                    setCurrentStepIndex(index + 1);
                    renderStep(index + 1);
                } else {
                    onComplete();
                }
            }, delay);
        }
    };

    const handleSend = (overrideText?: string) => {
        const textToSend = overrideText || inputText;
        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');

        setTimeout(() => {
            processResponse(textToSend);
        }, 600);
    };

    const addBotMessage = (text: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'bot' }]);
    };

    const failSequence = (text: string) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: text,
            sender: 'bot',
            isError: true
        }]);
        setIsFailed(true);
    };

    const processResponse = (input: string) => {
        if (!chatSteps || chatSteps.length === 0) {
            onComplete();
            return;
        }

        const currentStep = chatSteps[currentStepIndex];
        if (!currentStep) return;

        const lowerInput = input.toLowerCase().trim();
        const expected = currentStep.expectedAnswer?.toLowerCase().trim() || '';

        // Verification Logic
        let isCorrect = false;

        if (currentStep.matchType === 'exact') {
            isCorrect = lowerInput === expected;
        } else {
            // Default: Contains
            isCorrect = lowerInput.includes(expected);
        }

        if (isCorrect) {
            // Correct
            if (currentStep.successReply) {
                addBotMessage(currentStep.successReply);
            }

            if (currentStepIndex < chatSteps.length - 1) {
                const nextIndex = currentStepIndex + 1;
                setCurrentStepIndex(nextIndex);
                setTimeout(() => {
                    renderStep(nextIndex);
                }, 1000);
            } else {
                setTimeout(onComplete, 1500);
            }
        } else {
            // WRONG
            const failMsg = currentStep.failureReply?.replace('{input}', input) || "Incorrect, try again.";
            failSequence(failMsg);
        }
    };

    const handleRetry = () => {
        if (chatSteps && chatSteps.length > 0) {
            setMessages([]);
            setCurrentStepIndex(0);
            setIsFailed(false);
            setInputText('');
            // Restart
            setTimeout(() => renderStep(0), 100);
        }
    };

    if (isLoadingChat) {
        return <div className="flex items-center justify-center h-full text-white font-bold">Loading...</div>;
    }

    if (!chatSteps || chatSteps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white p-6 text-center bg-rose-500/80 rounded-2xl">
                <h3 className="text-xl font-bold mb-2">No Verification Steps</h3>
                <p className="mb-4">Please configure the Chat Flow in the Admin Dashboard.</p>
                <button onClick={onComplete} className="bg-white text-rose-600 px-6 py-2 rounded-full font-bold">Skip</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-md mx-auto bg-white/50 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-rose-500 p-4 text-white text-center font-bold shadow-sm">
                Verification Chat
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user'
                                    ? 'bg-rose-500 text-white rounded-tr-none'
                                    : msg.isError
                                        ? 'bg-red-100 text-red-800 rounded-tl-none border border-red-200'
                                        : 'bg-white text-gray-800 rounded-tl-none'
                                    }`}
                            >
                                {(msg.type === 'image' || msg.type === 'gif') && msg.mediaUrl && (
                                    <div className="mb-2">
                                        <img
                                            src={msg.mediaUrl}
                                            alt="Chat Media"
                                            className={`rounded-lg max-h-48 w-full border border-gray-200 ${msg.type === 'gif' ? 'object-contain bg-black/5' : 'object-cover'}`}
                                        />
                                    </div>
                                )}
                                {msg.text && <div className="text-sm font-medium whitespace-pre-line">{msg.text}</div>}

                                {msg.type === 'link' && msg.linkUrl && (
                                    <div className="mt-2">
                                        <a
                                            href={msg.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                        >
                                            {msg.linkText || 'Open Link'}
                                        </a>
                                    </div>
                                )}

                                {msg.type === 'options' && msg.options && (
                                    <div className="mt-3 grid grid-cols-1 gap-2">
                                        {msg.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(option)}
                                                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 border border-rose-100 transition-all text-left"
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                {isFailed ? (
                    <button
                        onClick={handleRetry}
                        className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCcw size={18} /> Retry Verification
                    </button>
                ) : chatSteps && chatSteps[currentStepIndex]?.inputRequired === false ? (
                    <div className="flex items-center justify-center p-3 text-gray-400 gap-2">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all font-medium text-gray-700"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputText.trim()}
                            className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatIntro;
