import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AppState, Track } from '../types';
import { MUSIC_TRACKS } from '../constants';

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MUSIC_TRACKS[0] || null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle audio play/pause when isPlaying changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => console.log("Audio playback error:", error));
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  return (
    <AppContext.Provider value={{
      appState,
      setAppState,
      isPlaying,
      togglePlay,
      currentTrack,
      playTrack,
      audioRef
    }}>
      {/* GLOBAL AUDIO PLAYER */}
      {currentTrack?.url && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          loop
          onError={(e) => console.log("Audio error", e)}
        />
      )}

      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};