import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Image, Film, Music, Lock, MessageCircle, Gift, Link2, Book, Youtube, Mic } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ref, onValue } from 'firebase/database';
import { db } from '../src/firebaseConfig';

const cards = [

  {
    to: '/journey',
    title: 'Journey',
    subtitle: 'Our Story',
    icon: Heart,
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    shadow: 'shadow-pink-500/25',
    delay: 0.1
  },
  {
    to: '/gallery',
    title: 'Gallery',
    subtitle: 'Memories',
    icon: Image,
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
    shadow: 'shadow-purple-500/25',
    delay: 0.2
  },
  {
    to: '/reels',
    title: 'Reels',
    subtitle: 'Moments',
    icon: Film,
    gradient: 'from-orange-400 via-red-500 to-pink-600',
    shadow: 'shadow-orange-500/25',
    delay: 0.3
  },
  {
    to: '/videos',
    title: 'Videos',
    subtitle: 'Watch Together',
    icon: Youtube,
    gradient: 'from-red-500 via-red-600 to-rose-700',
    shadow: 'shadow-red-500/25',
    delay: 0.35
  },
  {
    to: '/music',
    title: 'Music',
    subtitle: 'Playlist',
    icon: Music,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    shadow: 'shadow-indigo-500/25',
    delay: 0.4
  },
  {
    to: '/notes',
    title: 'Notes',
    subtitle: 'Letters',
    icon: MessageCircle,
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    shadow: 'shadow-orange-500/25',
    delay: 0.5
  },
  {
    to: '/vault',
    title: 'Vault',
    subtitle: 'Private',
    icon: Lock,
    gradient: 'from-slate-600 via-slate-700 to-slate-800',
    shadow: 'shadow-slate-500/25',
    delay: 0.6
  },
  {
    to: '/links',
    title: 'Links',
    subtitle: 'Important',
    icon: Link2,
    gradient: 'from-cyan-400 via-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/25',
    delay: 0.7
  },
  {
    to: '/flipbook',
    title: 'Storybook',
    subtitle: 'Our Album',
    icon: Book,
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    shadow: 'shadow-orange-500/25',
    delay: 0.8
  },
  {
    to: '/voice-notes',
    title: 'Voice Notes',
    subtitle: 'Conversations',
    icon: Mic,
    gradient: 'from-indigo-400 via-indigo-500 to-blue-600',
    shadow: 'shadow-indigo-500/25',
    delay: 0.9
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { cardVisibility, welcomeMessage } = useData();
  const [clickCount, setClickCount] = useState(0);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 3) {
      navigate('/admin');
      setClickCount(0);
    }
    // Reset count if not clicked rapidly
    setTimeout(() => setClickCount(0), 1000);
  };

  const { currentUser } = useAuth();

  // Identify current user type (Memoized or just simple variable)
  const isAditya = currentUser?.email?.toLowerCase().includes('aditya') || currentUser?.displayName?.toLowerCase().includes('aditya');
  const isShruti = currentUser?.email?.toLowerCase().includes('shrutikumari') || currentUser?.email?.toLowerCase().includes('adishri') || currentUser?.displayName?.toLowerCase().includes('shruti');

  // Determine Welcome Name
  let displayWelcome = welcomeMessage || "Welcome, My Besti";

  if (currentUser) {
    if (isAditya) {
      displayWelcome = "Welcome, Addi ✨";
    } else if (isShruti) {
      displayWelcome = "Welcome, Besti ✨";
    }
  }

  // Filter cards based on visibility from Context
  const visibleCards = cards.filter(card => cardVisibility[card.to] !== false);

  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login } = useData();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin');
    } else {
      setError(true);
    }
  };

  // Partner Status Logic
  const [partnerStatus, setPartnerStatus] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        let targetUser: any = null;

        Object.values(users).forEach((u: any) => {
          // Skip myself
          if (u.uid === currentUser.uid) return;

          const uEmail = u.email?.toLowerCase() || '';
          const uName = u.displayName?.toLowerCase() || '';

          if (isAditya) {
            // I am Aditya, looking for Shruti (check all her known aliases)
            if (
              uEmail.includes('adishri') ||
              uName.includes('shruti') ||
              uEmail.includes('shrutikumari') ||
              uEmail.includes('shri')
            ) {
              targetUser = u;
            }
          } else {
            // I am Shruti (or other), looking for Aditya
            if (uEmail.includes('adityahansda10') || uName.includes('aditya') || uEmail.includes('aditya')) {
              targetUser = u;
            }
          }
        });

        // Fallback: If only 2 users, just pick the other one
        if (!targetUser && Object.keys(users).length === 2) {
          const userId = Object.keys(users).find(id => id !== currentUser.uid);
          if (userId) targetUser = users[userId];
        }

        setPartnerStatus(targetUser);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);


  // If no cards are visible, show login to access admin
  if (visibleCards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Content Hidden</h2>
          <p className="text-gray-500 mb-6 text-sm">Please login to manage content visibility.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-rose-500`}
              autoFocus
            />
            <button type="submit" className="w-full bg-rose-500 text-white py-3 rounded-lg font-semibold hover:bg-rose-600 transition-colors">
              Access Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-12 min-h-screen flex flex-col">

      {/* TOP SECTION: Welcome & Status */}
      <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 md:gap-8 mb-8 md:mb-12 relative z-20">

        {/* Welcome Text */}
        <header className="w-full lg:w-auto text-center lg:text-left mt-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative inline-block"
          >
            <h1 className="font-script text-5xl sm:text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-1 md:mb-2 drop-shadow-sm select-none leading-tight py-1 md:py-2">
              {displayWelcome}
            </h1>
            <motion.span
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSecretClick}
              className="absolute -top-1 -right-8 md:-top-2 md:-right-16 text-3xl md:text-5xl cursor-pointer"
            >
              🥰
            </motion.span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-xl font-light mt-1 md:mt-2 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            Good times and crazy <span className="text-rose-500 font-medium">friends</span> make the best memories.
          </motion.p>
        </header>

        {/* PARTNER CARD */}
        {partnerStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full lg:w-auto lg:min-w-[400px]"
          >
            <div className="group relative bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl md:rounded-[2.5rem] p-4 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 overflow-hidden">

              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 rounded-full blur-3xl opacity-20 -z-10 transition-colors duration-500 ${partnerStatus.status === 'online' ? 'bg-green-400' : 'bg-gray-300'}`} />

              <div className="flex items-center gap-4 md:gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] bg-gradient-to-br from-white to-gray-100 shadow-lg relative z-10">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {partnerStatus.photoURL ? (
                        <img src={partnerStatus.photoURL} alt="Partner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-300">
                          <Heart size={24} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute bottom-1 right-0 z-20">
                    {partnerStatus.status === 'online' ? (
                      <div className="relative flex h-4 w-4 md:h-5 md:w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white bg-green-500"></span>
                      </div>
                    ) : (
                      <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white ${getStatusColor(partnerStatus.status || 'offline')} shadow-sm`} />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Current Status</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight truncate">
                        {isAditya ? 'Besti' : 'Addi'}
                      </h2>
                      {partnerStatus.mood && (
                        <span className="px-2 py-0.5 md:px-3 md:py-1 bg-rose-50 text-rose-600 text-[10px] md:text-xs font-bold rounded-full border border-rose-100 flex items-center gap-1 shadow-sm whitespace-nowrap">
                          {partnerStatus.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Message Bubble */}
              {partnerStatus.customStatus && (
                <div className="mt-3 md:mt-4 relative bg-gray-50/80 rounded-xl md:rounded-2xl p-3 text-gray-600 text-xs md:text-sm font-medium border border-gray-100/50 flex items-center gap-3">
                  <div className="w-1 h-6 md:h-8 bg-rose-400 rounded-full flex-shrink-0" />
                  <p className="line-clamp-2 italic leading-snug">"{partnerStatus.customStatus}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* APPS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-20 md:pb-24 mx-auto w-full">
        {visibleCards.map((card, index) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05, duration: 0.5, type: "spring", stiffness: 100 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Link
              to={card.to}
              className={`block aspect-[1.1/1] sm:aspect-[4/5] md:aspect-[3/4] rounded-2xl md:rounded-[2rem] bg-gradient-to-br ${card.gradient} shadow-md md:shadow-lg ${card.shadow} relative overflow-hidden group will-change-transform isolation-auto`}
            >
              {/* Noise Texture */}
              <div className="absolute inset-0 opacity-[0.03] bg-noise mix-blend-overlay pointer-events-none" />

              {/* Dynamic Content Container */}
              <div className="absolute inset-0 p-3 md:p-6 flex flex-col justify-between z-10">

                {/* Top Icon */}
                <div className="self-start bg-white/20 backdrop-blur-md p-2 md:p-3 rounded-xl md:rounded-2xl shadow-inner border border-white/20 text-white group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 md:mb-1 leading-none tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-white/80 text-[10px] md:text-xs font-medium uppercase tracking-wider md:opacity-0 md:group-hover:opacity-100 md:-translate-y-2 md:group-hover:translate-y-0 transition-all duration-300">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              {/* Background Decorative Large Icon */}
              <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 opacity-10 transform rotate-12 scale-[1.2] md:scale-125 group-hover:scale-150 group-hover:rotate-6 transition-all duration-700 ease-out z-0">
                <card.icon size={100} className="md:w-36 md:h-36" />
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default Home;