import { GalleryImage, Note, Reel, TimelineEvent, Track, CardVisibility, VaultItem } from "./types";

export const TIMELINE_DATA: TimelineEvent[] = [
  {
    id: '2019',
    year: '2019',
    title: 'First Encounter',
    description: "1st time ek dusre ko jane, Tution me 🥰. 1st time tum hm se baat ki, us time hm dono k nhi pata tha ki hm dono ek he school ke hai.",
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80', // Placeholder: School/Friends vibe
    side: 'left'
  },
  {
    id: '2020',
    year: '2020',
    title: 'Lockdown Connection',
    description: "Corona lockdown or hm dono ka 10th ka exam. Us time hm dono bahut kam baat karte the.",
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6fac257d?w=800&q=80', // Placeholder: Mask/Distance/Chat
    side: 'right'
  },
  {
    id: '2021',
    year: '2021',
    title: 'The Diploma Phase',
    description: "Diploma join kiye - Tum hm ko block bhi kar di thi, hm sad the bahut time tak.",
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', // Placeholder: College/Study/Alone
    side: 'left'
  },
  {
    id: '2022',
    year: '2022',
    title: 'The Spark',
    description: "Hm tum ko like karna start kiye, us din exam center me dekhe uske baad se.",
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&q=80',
    side: 'right'
  },
  {
    id: '2023',
    year: '2023',
    title: 'Best Friends Again',
    description: "Hm dono fir se ache dost ban gaye the. Mera pyaar or bhi badh gaya tumhare liye. Last year tha hum log ka, passout ho gaye dono. Hum dono mile ek dusre se, tum hm ko gift di.",
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
    side: 'left'
  },
  {
    id: '2024',
    year: '2024',
    title: 'A Tough Year',
    description: "Worst year for me. Trust tuta, dil tuta... 😭",
    image: 'https://images.unsplash.com/photo-1516585427167-18e431cb7224?w=800&q=80',
    side: 'right'
  },
  {
    id: '2025',
    year: '2025',
    title: 'Healing & Deepening Bond',
    description: "Hum dono ki friendship or bhi deep ho gayi us incident ke baad. Tumne fir se mera trust jeet liya. Mujhe pata chala es year ki tum hm ko like karti ho, bhale batati nhi ho, jarur kuch reason hoga. Koi baat nhi, but feel to karte hai.",
    image: 'https://images.unsplash.com/photo-1621574539437-4b7b4816c968?w=800&q=80',
    side: 'left'
  },
  {
    id: '2026',
    year: '2026',
    title: 'New Beginnings',
    description: "Aane wala hai new badlav ke saath... ❤️",
    image: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80',
    side: 'right'
  }
];

export const GALLERY_IMAGES: GalleryImage[] = [];

export const REELS_DATA: Reel[] = [];

export const MUSIC_TRACKS: Track[] = [];

export const INITIAL_NOTES: Note[] = [];

export const INITIAL_VAULT_ITEMS: VaultItem[] = [];

export const INITIAL_CARD_VISIBILITY: CardVisibility = {
  '/journey': true,
  '/gallery': true,
  '/reels': true,
  '/videos': true,
  '/music': true,
  '/notes': true,
  '/vault': true,
  '/links': true,
  '/flipbook': true,
  '/voice-notes': true,
  '/question-wall': true
};

export const INITIAL_MESSAGE = "Happy Birthday! Welcome to your special corner of the web.";

export const VAULT_PIN = "1234";

export const DEFAULT_STARTUP_SETTINGS = {
  mode: 'full' as const,
  showOnce: true,
  hasSeen: false
};

import { IntroStep, ChatStep } from "./types";

export const DEFAULT_INTRO_FLOW: IntroStep[] = [
  {
    id: 'step1',
    type: 'greeting',
    title: 'Welcome!',
    content: 'A special surprise awaits...',
    buttonText: 'Begin'
  },
  {
    id: 'step2',
    type: 'chat'
  }
];

export const DEFAULT_CHAT_STEPS: ChatStep[] = [];

export const INITIAL_ADMIN_EMAILS = [
  'adityahansda10@gmail.com',
  'adishri10205@gmail.com',
  'adiyahansda10@gmail.com',
  'shrutikumari916200@gmail.com'
];

export const INITIAL_WISH_FOLDERS = [];

export const YOUTUBE_VIDEOS = [];
export const DEFAULT_MAX_ATTEMPTS = 5;