export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
  side: 'left' | 'right';
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

export interface Reel {
  id: string;
  videoUrl: string;
  thumbnail: string;
  caption: string;
  likes: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
}

export interface Note {
  id: string;
  author: 'Me' | 'You';
  text: string;
  date: string;
  reactions: number;
}

export interface VaultItem {
  id: string;
  type: 'image' | 'note' | 'music';
  content: string;
  label?: string;
}

export interface LinkItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string; // Optional custom thumbnail, otherwise auto-generated
}

export interface CardVisibility {
  [key: string]: boolean;
}

export enum AppState {
  INTRO = 'INTRO',
  COUNTDOWN = 'COUNTDOWN',
  HOME = 'HOME',
}

export type StartupMode = 'full' | 'countdown' | 'direct_home';

export interface StartupSettings {
  mode: StartupMode;
  showOnce: boolean;
  hasSeen: boolean;
}