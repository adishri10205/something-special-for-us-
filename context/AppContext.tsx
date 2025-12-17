import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AppState, Track } from '../types';
import { MUSIC_TRACKS } from '../constants';

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTrack: Track;
  playTrack: (track: Track) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track>(MUSIC_TRACKS[0]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle audio play/pause when isPlaying changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback failed:", e));
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
      {/* Hidden Global Audio Player */}
      <audio 
        ref={audioRef} 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
        loop 
      />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};