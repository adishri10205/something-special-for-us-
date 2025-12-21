
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCjl9nQySKq3biIlLr7e3nzcZt-AU4Efcs",
    authDomain: "someting-special-68881.firebaseapp.com",
    databaseURL: "https://someting-special-68881-default-rtdb.firebaseio.com",
    projectId: "someting-special-68881",
    storageBucket: "someting-special-68881.firebasestorage.app",
    messagingSenderId: "264521734146",
    appId: "1:264521734146:web:fc6cc1048b039bb6d0ef1b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const TIMELINE_DATA = [
    {
        id: 'tl1',
        year: '2019',
        title: 'The Beginning',
        description: 'The day our paths crossed and everything changed forever. A coffee shop, a smile, and a hello.',
        side: 'left',
        image: 'https://picsum.photos/seed/love2019/400/300'
    },
    {
        id: 'tl2',
        year: '2020',
        title: 'Growing Closer',
        description: 'Through long calls and late night texts, we realized this was something special.',
        side: 'right',
        image: 'https://picsum.photos/seed/love2020/400/300'
    },
    {
        id: 'tl3',
        year: '2021',
        title: 'Adventures',
        description: 'Our first trip together. The mountains, the snow, and the warmth of your hand in mine.',
        side: 'left',
        image: 'https://picsum.photos/seed/love2021/400/300'
    },
    {
        id: 'tl4',
        year: '2022',
        title: 'Building Dreams',
        description: 'We started planning our future. Every dream seemed possible with you by my side.',
        side: 'right',
        image: 'https://picsum.photos/seed/love2022/400/300'
    },
    {
        id: 'tl5',
        year: '2023',
        title: 'Unbreakable',
        description: 'Challenges came, but they only made us stronger. You are my rock.',
        side: 'left',
        image: 'https://picsum.photos/seed/love2023/400/300'
    },
    {
        id: 'tl6',
        year: '2024',
        title: 'Still Us',
        description: 'Every day is an adventure with you. Happy Birthday, my besti.',
        side: 'right',
        image: 'https://picsum.photos/seed/love2024/400/300'
    }
];

const GALLERY_IMAGES = Array.from({ length: 8 }).map((_, i) => ({
    id: `img-${i}`,
    url: `https://picsum.photos/seed/romance${i}/600/800`,
    caption: i % 2 === 0 ? "A beautiful memory" : "Just us"
}));

const REELS_DATA = [
    {
        id: 'r1',
        videoUrl: 'https://picsum.photos/seed/reel1/300/600',
        thumbnail: 'https://picsum.photos/seed/reel1/300/600',
        caption: 'Best birthday ever! 🎉',
        likes: 124
    },
    {
        id: 'r2',
        videoUrl: 'https://picsum.photos/seed/reel2/300/600',
        thumbnail: 'https://picsum.photos/seed/reel2/300/600',
        caption: 'Sunset vibes 🌅',
        likes: 89
    },
    {
        id: 'r3',
        videoUrl: 'https://picsum.photos/seed/reel3/300/600',
        thumbnail: 'https://picsum.photos/seed/reel3/300/600',
        caption: 'Just being silly 🤪',
        likes: 245
    }
];

const MUSIC_TRACKS = [
    {
        id: 't1',
        title: 'Perfect',
        artist: 'Ed Sheeran',
        duration: '4:23',
        cover: 'https://picsum.photos/seed/album1/100/100'
    },
    {
        id: 't2',
        title: 'All of Me',
        artist: 'John Legend',
        duration: '4:29',
        cover: 'https://picsum.photos/seed/album2/100/100'
    },
    {
        id: 't3',
        title: 'A Thousand Years',
        artist: 'Christina Perri',
        duration: '4:45',
        cover: 'https://picsum.photos/seed/album3/100/100'
    }
];

const INITIAL_NOTES = [
    {
        id: 'n1',
        author: 'Me',
        text: "Can't wait to celebrate with you tonight! 🥂",
        date: '10:30 AM',
        reactions: 1
    },
    {
        id: 'n2',
        author: 'You',
        text: "I'm so excited! Love you! ❤️",
        date: '10:32 AM',
        reactions: 2
    }
];

const INITIAL_VAULT_ITEMS = [
    {
        id: 'v1',
        type: 'note',
        content: "The best thing to hold onto in life is each other.",
        label: "Secret Note"
    },
    {
        id: 'v2',
        type: 'image',
        content: "https://picsum.photos/seed/secret1/300/300",
        label: "Hidden Photo"
    }
];

const INITIAL_CARD_VISIBILITY = {
    '/special': true,
    '/journey': true,
    '/gallery': true,
    '/reels': true,
    '/music': true,
    '/notes': true,
    '/vault': true,
};

const INITIAL_MESSAGE = "Every moment with you is a blessing. Your smile lights up my world. Happy Birthday, my besti. Here's to forever. 💖";

const VAULT_PIN = "1234";

const DEFAULT_INTRO_FLOW = [
    {
        id: 'step1',
        type: 'greeting',
        title: 'Happy Birthday\nMy Cutie Besti 🥰',
        content: 'Tumahre liye kuch khash hai...',
        buttonText: 'Tap to Begin ❤️'
    },
    {
        id: 'step2',
        type: 'chat'
    }
];

async function seed() {
    console.log("Starting data migration...");
    try {
        await set(ref(db, 'content/timeline'), TIMELINE_DATA);
        await set(ref(db, 'content/gallery'), GALLERY_IMAGES);
        await set(ref(db, 'content/reels'), REELS_DATA);
        await set(ref(db, 'content/music'), MUSIC_TRACKS);
        await set(ref(db, 'content/notes'), INITIAL_NOTES);
        await set(ref(db, 'content/vault'), INITIAL_VAULT_ITEMS);
        await set(ref(db, 'settings'), {
            cardVisibility: INITIAL_CARD_VISIBILITY,
            birthdayMessage: INITIAL_MESSAGE,
            vaultPin: VAULT_PIN,
            startupSettings: { mode: 'full', showOnce: true, hasSeen: false },
            introFlow: DEFAULT_INTRO_FLOW
        });
        console.log("Data successfully migrated to Firebase!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed", e);
        process.exit(1);
    }
}

seed();
