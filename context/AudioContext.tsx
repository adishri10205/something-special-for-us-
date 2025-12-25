import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Track } from '../types';
import Hls from 'hls.js';

interface AudioContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    playTrack: (track: Track) => void;
    togglePlay: () => void;
    closePlayer: () => void;
    seek: (seconds: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Initialize Audio Element
    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        // Cleanup
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            audio.pause();
            audio.src = '';
        };
    }, []);

    // Bind Events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (!audio.paused) {
                setProgress(audio.currentTime);
                setDuration(audio.duration || 0);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        const handleError = (e: Event) => {
            console.error("Audio error:", e, audio.error);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateProgress);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    // Media Session Updates
    useEffect(() => {
        if (currentTrack && 'mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                artwork: [
                    { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=96&h=96&fit=crop', sizes: '96x96', type: 'image/jpeg' },
                    { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
        }
    }, [currentTrack]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    const playTrack = async (track: Track) => {
        const audio = audioRef.current;
        if (!audio) return;

        // If same track, just toggle
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        setIsPlaying(false);
        setProgress(0);

        // Destroy previous HLS instance if it exists
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const src = track.url || '';
        const isM3U8 = src.includes('.m3u8');

        // Check if HLS.js is supported
        if (isM3U8 && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hlsRef.current = hls;

            hls.loadSource(src);
            hls.attachMedia(audio);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("HLS Play failed", e));
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn("HLS Network Error, recovering...");
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn("HLS Media Error, recovering...");
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error("HLS Fatal Error, destroying...");
                            hls.destroy();
                            break;
                    }
                }
            });

        } else {
            // Native HLS support (Safari) or standard file
            audio.src = src;
            audio.load();
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Native Play failed", error);
            }
        }

        setCurrentTrack(track);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (audio && currentTrack) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Resume failed", e));
            }
        }
    };

    const closePlayer = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.removeAttribute('src'); // Detach src
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        }
        setIsPlaying(false);
        setProgress(0);
        setCurrentTrack(null);
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none';
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    return (
        <AudioContext.Provider value={{ currentTrack, isPlaying, progress, duration, playTrack, togglePlay, closePlayer, seek }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
