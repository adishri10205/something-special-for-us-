import React, { useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { useAudio } from '../context/AudioContext';
import { Play, Pause, X, Music, Disc } from 'lucide-react';
import { useHeader } from '../context/HeaderContext';

const GlobalMusicPlayer: React.FC = () => {
    const { currentTrack, isPlaying, togglePlay, closePlayer, progress, duration, seek } = useAudio();
    const { isMusicMode } = useHeader();
    const controls = useDragControls();
    const progressBarRef = useRef<HTMLDivElement>(null);

    if (!currentTrack) return null;

    // Don't show floating player if in "Music Mode" on the Music Page?
    // Actually, standard usage suggests show it everywhere or strictly persist.
    // User asked for "overlayer music is on and off option over the full app".

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // If dragged down significantly (e.g., > 100px), close functionality
        if (info.offset.y > 100) {
            closePlayer();
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !duration) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    return (
        <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 z-[100]"
        >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 relative overflow-hidden">

                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-rose-500/20 w-full cursor-pointer"
                    onClick={handleSeek}
                    ref={progressBarRef}
                >
                    <div
                        className="h-full bg-rose-500 transition-all duration-100 ease-linear"
                        style={{ width: `${(progress / duration) * 100}%` }}
                    />
                </div>

                <div className="flex items-center gap-4">
                    {/* Album Art / Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isPlaying ? 'animate-spin-slow' : ''} bg-gradient-to-br from-rose-100 to-teal-50 shadow-inner`}>
                        <Disc size={20} className={`text-rose-500 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 text-sm truncate">{currentTrack.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={closePlayer}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Drag Handle Hint */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-300 rounded-full opacity-50" />
            </div>
        </motion.div>
    );
};

export default GlobalMusicPlayer;
