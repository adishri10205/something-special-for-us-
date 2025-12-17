import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TimelineEvent,
  GalleryImage,
  Reel,
  Track,
  Note,
  CardVisibility,
  StartupSettings,
  VaultItem,
  LinkItem,
  FlipbookPage
} from '../types';
import {
  TIMELINE_DATA,
  GALLERY_IMAGES,
  REELS_DATA,
  MUSIC_TRACKS,
  INITIAL_NOTES,
  INITIAL_CARD_VISIBILITY,
  INITIAL_MESSAGE,
  VAULT_PIN,
  INITIAL_VAULT_ITEMS
} from '../constants';

interface DataContextType {
  timelineData: TimelineEvent[];
  setTimelineData: (data: TimelineEvent[]) => void;
  galleryImages: GalleryImage[];
  setGalleryImages: (data: GalleryImage[]) => void;
  reelsData: Reel[];
  setReelsData: (data: Reel[]) => void;
  musicTracks: Track[];
  setMusicTracks: (data: Track[]) => void;
  notes: Note[];
  setNotes: (data: Note[]) => void;
  vaultItems: VaultItem[];
  setVaultItems: (data: VaultItem[]) => void;
  importantLinks: LinkItem[];
  setImportantLinks: (data: LinkItem[]) => void;
  flipbookPages: FlipbookPage[];
  setFlipbookPages: (data: FlipbookPage[]) => void;
  cardVisibility: CardVisibility;
  setCardVisibility: (data: CardVisibility) => void;
  birthdayMessage: string;
  setBirthdayMessage: (msg: string) => void;
  vaultPin: string;
  setVaultPin: (pin: string) => void;
  startupSettings: StartupSettings;
  setStartupSettings: (settings: StartupSettings) => void;
  markIntroSeen: () => void;
  resetData: () => void;
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or Constants
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem('timelineData');
    return saved ? JSON.parse(saved) : TIMELINE_DATA;
  });

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
    const saved = localStorage.getItem('galleryImages');
    return saved ? JSON.parse(saved) : GALLERY_IMAGES;
  });

  const [reelsData, setReelsData] = useState<Reel[]>(() => {
    const saved = localStorage.getItem('reelsData');
    return saved ? JSON.parse(saved) : REELS_DATA;
  });

  const [musicTracks, setMusicTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('musicTracks');
    return saved ? JSON.parse(saved) : MUSIC_TRACKS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() => {
    const saved = localStorage.getItem('vaultItems');
    return saved ? JSON.parse(saved) : INITIAL_VAULT_ITEMS;
  });

  const [importantLinks, setImportantLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('importantLinks');
    return saved ? JSON.parse(saved) : [];
  });

  const [flipbookPages, setFlipbookPages] = useState<FlipbookPage[]>(() => {
    const saved = localStorage.getItem('flipbookPages');
    return saved ? JSON.parse(saved) : [];
  });

  const [cardVisibility, setCardVisibility] = useState<CardVisibility>(() => {
    const saved = localStorage.getItem('cardVisibility');
    return saved ? JSON.parse(saved) : INITIAL_CARD_VISIBILITY;
  });

  const [birthdayMessage, setBirthdayMessage] = useState<string>(() => {
    const saved = localStorage.getItem('birthdayMessage');
    return saved ? saved : INITIAL_MESSAGE;
  });

  const [vaultPin, setVaultPin] = useState<string>(() => {
    const saved = localStorage.getItem('vaultPin');
    return saved ? saved : VAULT_PIN;
  });

  const [startupSettings, setStartupSettings] = useState<StartupSettings>(() => {
    const saved = localStorage.getItem('startupSettings');
    return saved ? JSON.parse(saved) : { mode: 'full', showOnce: true, hasSeen: false };
  });

  // Admin Auth State (Not persisted for security/session)
  const [isAdmin, setIsAdmin] = useState(false);

  const login = (password: string) => {
    if (password === 'admin') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsAdmin(false);

  // Effects to save to LocalStorage whenever data changes
  useEffect(() => localStorage.setItem('timelineData', JSON.stringify(timelineData)), [timelineData]);
  useEffect(() => localStorage.setItem('galleryImages', JSON.stringify(galleryImages)), [galleryImages]);
  useEffect(() => localStorage.setItem('reelsData', JSON.stringify(reelsData)), [reelsData]);
  useEffect(() => localStorage.setItem('musicTracks', JSON.stringify(musicTracks)), [musicTracks]);
  useEffect(() => localStorage.setItem('notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('vaultItems', JSON.stringify(vaultItems)), [vaultItems]);
  useEffect(() => localStorage.setItem('importantLinks', JSON.stringify(importantLinks)), [importantLinks]);
  useEffect(() => localStorage.setItem('flipbookPages', JSON.stringify(flipbookPages)), [flipbookPages]);
  useEffect(() => localStorage.setItem('cardVisibility', JSON.stringify(cardVisibility)), [cardVisibility]);
  useEffect(() => localStorage.setItem('birthdayMessage', birthdayMessage), [birthdayMessage]);
  useEffect(() => localStorage.setItem('vaultPin', vaultPin), [vaultPin]);
  useEffect(() => localStorage.setItem('startupSettings', JSON.stringify(startupSettings)), [startupSettings]);

  const markIntroSeen = () => {
    setStartupSettings(prev => ({ ...prev, hasSeen: true }));
  };

  const resetData = () => {
    setTimelineData(TIMELINE_DATA);
    setGalleryImages(GALLERY_IMAGES);
    setReelsData(REELS_DATA);
    setMusicTracks(MUSIC_TRACKS);
    setNotes(INITIAL_NOTES);
    setVaultItems(INITIAL_VAULT_ITEMS);
    setImportantLinks([]);
    setFlipbookPages([]);
    setCardVisibility(INITIAL_CARD_VISIBILITY);
    setBirthdayMessage(INITIAL_MESSAGE);
    setVaultPin(VAULT_PIN);
    setStartupSettings({ mode: 'full', showOnce: true, hasSeen: false });
    localStorage.clear();
  };

  return (
    <DataContext.Provider value={{
      timelineData, setTimelineData,
      galleryImages, setGalleryImages,
      reelsData, setReelsData,
      musicTracks, setMusicTracks,
      notes, setNotes,
      vaultItems, setVaultItems,
      importantLinks, setImportantLinks,
      flipbookPages, setFlipbookPages,
      cardVisibility, setCardVisibility,
      birthdayMessage, setBirthdayMessage,
      vaultPin, setVaultPin,
      startupSettings, setStartupSettings,
      markIntroSeen,
      resetData,
      isAdmin, login, logout
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};