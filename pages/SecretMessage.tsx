import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Copy, Check, Shield, RefreshCw } from 'lucide-react';

const SECRET_KEY = "SPECIAL_LOVE_KEY_FOREVER"; // Custom key for simple symmetric encryption

const SecretMessage: React.FC = () => {
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    // Custom "Encryption" - Simple Vigenère-like cipher + Base64
    // This ensures it's fairly unique to this logic and key.
    const encryptMessage = (text: string) => {
        try {
            if (!text) return '';
            let result = '';
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i);
                const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
                // Shift char code by key char
                const encryptedChar = (charCode + keyChar) % 65535;
                result += String.fromCharCode(encryptedChar);
            }
            // Encode to Base64 to make it safe for copy-pasting and "scrambled" looking
            return btoa(unescape(encodeURIComponent(result)));
        } catch (e) {
            console.error("Encryption error", e);
            return "Error encrypting";
        }
    };

    const decryptMessage = (encodedText: string) => {
        try {
            if (!encodedText) return '';
            // Decode from Base64
            const result = decodeURIComponent(escape(atob(encodedText)));
            let decrypted = '';
            for (let i = 0; i < result.length; i++) {
                const charCode = result.charCodeAt(i);
                const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
                // Reverse shift
                let decryptedChar = (charCode - keyChar);
                if (decryptedChar < 0) decryptedChar += 65535;
                decrypted += String.fromCharCode(decryptedChar);
            }
            return decrypted;
        } catch (e) {
            console.error("Decryption error", e);
            setError("Invalid secret message provided. Cannot decrypt.");
            return '';
        }
    };

    const handleProcess = () => {
        setError('');
        if (mode === 'encrypt') {
            const encrypted = encryptMessage(inputText);
            setOutputText(encrypted);
        } else {
            const decrypted = decryptMessage(inputText);
            if (decrypted) {
                setOutputText(decrypted);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 bg-gradient-to-br from-rose-50 via-white to-rose-50 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-rose-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-rose-200"
                    >
                        <Shield className="text-white" size={32} />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Secret Messages</h1>
                    <p className="text-gray-500">
                        Send messages that only <span className="text-rose-500 font-semibold">we</span> can understand.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-2 mb-6 flex relative">
                    <motion.div
                        className="absolute top-2 bottom-2 bg-white rounded-2xl shadow-md z-0"
                        initial={false}
                        animate={{
                            left: mode === 'encrypt' ? '0.5rem' : '50%',
                            width: 'calc(50% - 0.5rem)'
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    <button
                        onClick={() => { setMode('encrypt'); setInputText(''); setOutputText(''); setError(''); }}
                        className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${mode === 'encrypt' ? 'text-rose-600' : 'text-gray-500'}`}
                    >
                        <Lock size={18} /> Encrypt
                    </button>
                    <button
                        onClick={() => { setMode('decrypt'); setInputText(''); setOutputText(''); setError(''); }}
                        className={`flex-1 relative z-10 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${mode === 'decrypt' ? 'text-rose-600' : 'text-gray-500'}`}
                    >
                        <Unlock size={18} /> Decrypt
                    </button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="space-y-6">

                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {mode === 'encrypt' ? 'Your Message' : 'Encrypted Code'}
                                    </label>
                                    {mode === 'decrypt' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText();
                                                    setInputText(text);
                                                } catch (err) {
                                                    console.error('Failed to read clipboard', err);
                                                    // Fallback or alert if needed, but often silent fails on non-secure contexts
                                                    const manualPaste = prompt("Paste your code here:");
                                                    if (manualPaste) setInputText(manualPaste);
                                                }
                                            }}
                                            className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded hover:bg-rose-100 transition-colors flex items-center gap-1"
                                        >
                                            <Copy size={12} className="rotate-180" /> Paste
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onPaste={(e) => {
                                            // Ensure paste works naturally, but we can capture it just in case logic is needed later
                                            const text = e.clipboardData.getData('text');
                                            // e.preventDefault(); // Don't prevent default unless we manually set state
                                            // setInputText(text); // Default behavior handles this fine usually
                                        }}
                                        placeholder={mode === 'encrypt' ? "Type something sweet..." : "Paste the secret code here..."}
                                        className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition-all resize-none text-gray-700 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                disabled={!inputText.trim()}
                                className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-semibold shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {mode === 'encrypt' ? <Lock size={20} /> : <Unlock size={20} />}
                                {mode === 'encrypt' ? 'Encode Message' : 'Decode Message'}
                            </button>

                            <AnimatePresence>
                                {outputText && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="pt-4 border-t border-gray-100"
                                    >
                                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1 flex justify-between items-center">
                                            <span>{mode === 'encrypt' ? 'Secret Code' : 'Decoded Message'}</span>
                                            {mode === 'encrypt' && <span className="text-xs text-rose-500">Copy this code to share</span>}
                                        </label>
                                        <div className="relative group">
                                            <div className={`w-full p-4 rounded-xl ${mode === 'encrypt' ? 'bg-rose-50/50 text-rose-800 break-all font-mono text-sm' : 'bg-green-50/50 text-gray-800 font-medium'} border border-gray-100`}>
                                                {outputText}
                                            </div>
                                            <button
                                                onClick={copyToClipboard}
                                                className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SecretMessage;
