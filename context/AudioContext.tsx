import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Track } from '../types';

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

    useEffect(() => {
        if (currentTrack && 'mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                // album: 'Our Vibe', 
                artwork: [
                    { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=96&h=96&fit=crop', sizes: '96x96', type: 'image/jpeg' },
                    { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=512&h=512&fit=crop', sizes: '512x512', type: 'image/jpeg' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => {
                togglePlay();
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                togglePlay();
            });
            // Add seek handlers if desired
        }
    }, [currentTrack]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    // Keep existing audio setup
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const updateProgress = () => {
            setProgress(audio.currentTime);
            setDuration(audio.duration || 0);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const playTrack = (track: Track) => {
        if (audioRef.current) {
            if (currentTrack?.id === track.id) {
                togglePlay();
                return;
            }

            audioRef.current.src = track.url || '';
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(e => console.error("Playback failed", e));

            setCurrentTrack(track);
        }
    };

    const togglePlay = () => {
        if (audioRef.current && currentTrack) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setProgress(0);
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'none';
            }
        }
        setCurrentTrack(null);
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
