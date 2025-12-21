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
  url?: string;
  publicId?: string;
  folder?: string; // App-level Folder
  width?: number;
  height?: number;
  caption?: string;
  createdAt?: string;
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
  url?: string; // Audio Source URL (Drive/External)
  addedBy?: string; // 'aditya' | 'shruti' | 'unknown'
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
  thumbnail?: string;
}

export interface FlipbookPage {
  id: string;
  url: string;
  caption?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
  status?: UserStatusType;
  mood?: string;
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

export type IntroStepType = 'greeting' | 'text' | 'image' | 'quiz' | 'meme' | 'chat';

export interface IntroStep {
  id: string;
  type: IntroStepType;
  title?: string;
  content?: string; // Text content or Question
  mediaUrl?: string; // Image/Gif URL
  options?: string[]; // For quiz
  correctAnswer?: string; // For quiz
  buttonText?: string;
}

export type ChatStepType = 'text' | 'image' | 'gif' | 'link' | 'options';

export interface ChatStep {
  id: string;
  order: number;
  type?: ChatStepType;      // Default 'text'
  question: string;         // The bot's question / text
  expectedAnswer: string;   // The expected keyword/answer
  successReply: string;     // Bot reply on success
  failureReply: string;     // Bot reply on failure (supports {input} placeholder)

  // New Fields
  mediaUrl?: string;        // For 'image' type
  linkUrl?: string;         // For 'link' type
  linkText?: string;        // Button text for 'link' type
  options?: string[];       // For 'options' type (Quick Replies)
  inputRequired?: boolean;  // If false, treats as statement and auto-advances
  matchType?: 'exact' | 'contains'; // Validation strictness
}

export interface WishItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'url';
  url: string;
  caption?: string;
  thumbnail?: string; // For video/url
}

export interface WishFolder {
  id: string;
  title: string;
  items: WishItem[];
}

export interface YoutubeVideo {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  addedAt: string;
}

export interface VoiceNote {
  id: string;
  title: string;
  url: string; // Google Drive Link
  createdAt: string;
  createdBy?: string;
}

export type UserStatusType = 'online' | 'offline' | 'away' | 'busy';

export interface UserActivity {
  status: UserStatusType;
  lastSeen: string;
  currentPage?: string;
  mood?: string;
  customStatus?: string;
  displayName?: string;
  photoURL?: string;
}