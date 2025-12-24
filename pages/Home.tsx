import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Image, Film, Music, Lock, MessageCircle, Gift, Link2, Book, Youtube, Mic, Key, AlertCircle, Star, Activity, LockKeyhole, MessageCircleQuestion } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useEmotion } from '../context/EmotionContext';
import { useHeader } from '../context/HeaderContext';
import { ref, onValue } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import InstallPrompt from '../components/InstallPrompt';

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
    title: 'Special Message',
    subtitle: 'Protected',
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
  {
    to: '/secret-message',
    title: 'Secret',
    subtitle: 'Confidential',
    icon: Key,
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    shadow: 'shadow-violet-500/25',
    delay: 0.95
  },
  {
    to: '/complain',
    title: 'Complain',
    subtitle: 'Issues',
    icon: AlertCircle,
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    shadow: 'shadow-red-500/25',
    delay: 1.0
  },
  {
    to: '/wishes',
    title: 'Our Wishes',
    subtitle: 'Dreams',
    icon: Star,
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    shadow: 'shadow-yellow-500/25',
    delay: 1.05
  },
  {
    to: '/question-wall',
    title: 'Question Wall',
    subtitle: 'Unspoken',
    icon: MessageCircleQuestion,
    gradient: 'from-purple-500 via-violet-600 to-indigo-600',
    shadow: 'shadow-purple-500/25',
    delay: 1.1
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { cardVisibility, welcomeMessage, homeCaption } = useData();
  const [clickCount, setClickCount] = useState(0);
  const { setTitle } = useHeader();

  const { currentUser, hasPermission, isAdmin } = useAuth();
  const { emotionProfile, hasAccess, loading: emotionLoading } = useEmotion();

  useEffect(() => {
    setTitle('Home');
  }, [setTitle]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Emotion Debug:', {
      isAdmin,
      hasAccess,
      emotionProfile,
      mainProgress: emotionProfile?.mainProgress,
      threshold: emotionProfile?.accessThreshold,
      loading: emotionLoading
    });
  }, [isAdmin, hasAccess, emotionProfile, emotionLoading]);

  // Load Order from Firebase
  const [orderedCards, setOrderedCards] = useState(cards);

  useEffect(() => {
    const orderRef = ref(db, 'settings/cardOrder');
    const unsubscribe = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const savedOrder: string[] = snapshot.val();
        // Reconstruct the array based on saved IDs (paths 'to')
        const newOrder = [...cards].sort((a, b) => {
          const indexA = savedOrder.indexOf(a.to);
          const indexB = savedOrder.indexOf(b.to);
          // If found in saved order, use that index. Otherwise push to end.
          const valA = indexA !== -1 ? indexA : 999;
          const valB = indexB !== -1 ? indexB : 999;
          return valA - valB;
        });
        setOrderedCards(newOrder);
      } else {
        setOrderedCards(cards);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 3) {
      if (hasPermission('canViewAdmin')) {
        navigate('/admin');
      } else {
        alert("Access Denied: You do not have permission to access Admin Panel.");
      }
      setClickCount(0);
    }
    // Reset count if not clicked rapidly
    setTimeout(() => setClickCount(0), 1000);
  };

  // Identify current user type (Memoized or just simple variable)
  const isAditya = currentUser?.email?.toLowerCase().includes('aditya') || currentUser?.displayName?.toLowerCase().includes('aditya');
  const isShruti = currentUser?.email?.toLowerCase().includes('shrutikumari') || currentUser?.email?.toLowerCase().includes('adishri') || currentUser?.displayName?.toLowerCase().includes('shruti');

  // Determine Welcome Name
  let displayWelcome = welcomeMessage || "Welcome, My Besti";

  if (currentUser) {
    if (isAditya) {
      displayWelcome = "Welcome, Addi";
    } else if (isShruti) {
      displayWelcome = "Welcome, Besti";
    }
  }

  // Filter cards based on visibility from Context AND User Permissions
  const visibleCards = orderedCards.filter(card => {
    // 1. Check Global Visibilty
    if (cardVisibility[card.to] === false) return false;

    // 2. Check User Permission
    switch (card.to) {
      case '/journey': return hasPermission('canViewJourney');
      case '/gallery': return hasPermission('canViewGallery');
      case '/reels': return hasPermission('canViewReels');
      case '/videos': return hasPermission('canViewVideos');
      case '/music': return hasPermission('canViewMusic');
      case '/notes': return hasPermission('canViewNotes');
      case '/vault': return hasPermission('canViewVault');
      case '/links': return hasPermission('canViewJourney'); // Bundle with Journey
      case '/flipbook': return hasPermission('canViewFlipbook');
      case '/voice-notes': return hasPermission('canViewVoiceNotes');
      case '/secret-message': return hasPermission('canViewSecretMessage');
      case '/complain': return hasPermission('canViewComplaints');
      case '/wishes': return hasPermission('canViewWishes');
      default: return true; // Other cards visible by default
    }
  });

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

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-4 md:pt-16 pb-20 md:py-12 min-h-screen flex flex-col relative">
      {/* Message Notification - Top Right */}
      {hasPermission('canViewMessages') && (
        <Link
          to="/special" // Assuming 'Message' page
          className="absolute top-4 right-4 md:right-8 z-30 p-2.5 md:p-3 bg-white/80 backdrop-blur-md rounded-full text-rose-500 shadow-sm border border-rose-100 hover:scale-110 active:scale-95 transition-all group"
        >
          <MessageCircle size={20} className="md:w-6 md:h-6 group-hover:text-rose-600" />
          <span className="absolute top-2 right-2 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        </Link>
      )}

      {/* TOP SECTION: Welcome & Status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-8 mb-6 md:mb-12 relative z-20">

        {/* Welcome Text */}
        <header className="w-full lg:w-auto text-left mt-0 pl-1 md:pl-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative inline-block"
          >
            <h1 className="font-script text-3xl sm:text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 mb-1 md:mb-2 drop-shadow-sm select-none leading-tight py-1 md:py-2">
              {displayWelcome}
            </h1>
            <motion.span
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSecretClick}
              className="absolute top-1/2 -translate-y-1/2 -right-12 md:-right-20 text-3xl md:text-5xl cursor-pointer"
            >
              ✨
            </motion.span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-sm md:text-xl font-light mt-1 max-w-xl leading-relaxed text-left"
          >
            {homeCaption}
          </motion.p>
        </header>
      </div>

      {/* Profile Card Banner - Below Welcome Message */}
      {emotionProfile && !emotionLoading && (
        <Link to="/emotion-profile">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-700 shadow-2xl border-2 border-white/20 cursor-pointer relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-noise mix-blend-overlay pointer-events-none" />

            {/* Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center gap-4 md:gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 shadow-xl overflow-hidden">
                  {emotionProfile.profileImage ? (
                    <img
                      src={emotionProfile.profileImage}
                      alt="Addi"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold">
                      💖
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                {/* Name & Mood */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-bold text-lg md:text-xl truncate">
                    Addi✨
                  </h3>
                  {/* Mood Emoji */}
                  <span className="text-2xl" title={`Mood: ${emotionProfile.meters.mood > 50 ? 'Happy' :
                    emotionProfile.meters.mood > 0 ? 'Normal' :
                      emotionProfile.meters.mood > -50 ? 'Sad' : 'Angry'
                    }`}>
                    {emotionProfile.meters.mood > 50 ? '😊' :
                      emotionProfile.meters.mood > 0 ? '😐' :
                        emotionProfile.meters.mood > -50 ? '😢' : '😠'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/90 text-xs md:text-sm font-medium">
                      Friendship Health
                    </span>
                    <span className="text-white font-bold text-sm md:text-base">
                      {emotionProfile.mainProgress}%
                    </span>
                  </div>
                  <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${emotionProfile.mainProgress}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${emotionProfile.mainProgress >= 75
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : emotionProfile.mainProgress >= 50
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                          : emotionProfile.mainProgress >= 25
                            ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        } shadow-lg`}
                    />
                  </div>
                </div>

                {/* Status Text */}
                <div className="flex items-center gap-2">
                  {hasAccess ? (
                    <>
                      <Lock className="text-white/80" size={14} />
                      <p className="text-white/80 text-xs md:text-sm">
                        Full Access {isAdmin && '(Admin)'}
                      </p>
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="text-white/80" size={14} />
                      <p className="text-white/80 text-xs md:text-sm">
                        Limited Access • Need {emotionProfile.accessThreshold}%
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* View Button */}
              <div className="hidden md:flex flex-shrink-0">
                <div className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-semibold text-sm transition-all border border-white/30">
                  View Profile →
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      )}

      {/* APPS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 pb-20 md:pb-24 mx-auto w-full">
        {visibleCards.map((card, index) => {
          // Check if card should be locked
          const isLocked = !isAdmin && !hasAccess && !card.alwaysVisible;

          return (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5, type: "spring", stiffness: 100 }}
              whileHover={!isLocked ? {
                y: -5,
                scale: 1.03,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              } : {}}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              className="w-full"
            >
              <Link
                to={isLocked ? '#' : card.to}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    alert(`🔒 Access Locked!\n\nCurrent Progress: ${emotionProfile?.mainProgress || 0}%\nRequired: ${emotionProfile?.accessThreshold || 50}%\n\nImprove the relationship health to unlock this feature!`);
                  }
                }}
                className={`block aspect-[1.1/1] sm:aspect-[4/5] md:aspect-[3/4] rounded-2xl md:rounded-[2rem] bg-gradient-to-br ${card.gradient} shadow-md md:shadow-lg ${card.shadow} relative overflow-hidden group will-change-transform isolation-auto ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : ''
                  }`}
              >
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-noise mix-blend-overlay pointer-events-none" />

                {/* Lock Overlay */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-2xl">
                      <LockKeyhole className="w-8 h-8 md:w-12 md:h-12 text-gray-700 mx-auto" />
                      <p className="text-xs md:text-sm font-bold text-gray-700 mt-2 text-center">Locked</p>
                    </div>
                  </div>
                )}

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
          );
        })}
      </div>
      <InstallPrompt />
    </div >
  );
};
export default Home;