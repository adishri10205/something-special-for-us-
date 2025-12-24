import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        if (isStandalone) return;

        // 2. iOS Detection (Show immediately as no event fires)
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIosDevice) {
            setPlatform('ios');
            setIsVisible(true);
        }

        // 3. Android/Desktop Event Listener
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setPlatform('android');
            setIsVisible(true);
            console.log('beforeinstallprompt captured!');
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            setIsInstalling(true);
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsVisible(false);
            }
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => setIsVisible(false);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-80">
            <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
                {/* App Icon */}
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <img src="/pwa-icon.svg" alt="App Icon" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-bold text-gray-900 text-sm">Forever & Always</h3>
                    <p className="text-xs text-gray-500">Install our app</p>
                </div>

                {/* Android / Desktop Install Button */}
                {platform === 'android' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDismiss}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full"
                        >
                            <X size={18} />
                        </button>
                        <button
                            id="installAppButton"
                            onClick={handleInstallClick}
                            disabled={isInstalling}
                            className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {isInstalling ? '...' : 'Install'}
                        </button>
                    </div>
                )}

                {/* iOS Instructions */}
                {platform === 'ios' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDismiss}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-full mb-auto"
                        >
                            <X size={16} />
                        </button>
                        <div className="text-[10px] text-gray-600 text-right leading-tight min-w-[100px]">
                            Tap <Share className="inline w-3 h-3 mx-0.5" /> then<br />
                            <span className="font-bold">"Add to Home Screen"</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstallPrompt;
