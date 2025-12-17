import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Image, Film, Music, Lock, MessageCircle, Gift, Link2, Book } from 'lucide-react';
import { useData } from '../context/DataContext';

const cards = [
  {
    to: '/special',
    title: 'Birthday Wish',
    subtitle: 'Open Me',
    icon: Gift,
    gradient: 'from-rose-500 via-red-500 to-rose-600',
    shadow: 'shadow-rose-500/30',
    delay: 0
  },
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
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { cardVisibility } = useData();
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

  return (
    <div className="px-4 py-8 md:p-12 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
      <header className="mb-8 md:mb-10 text-center md:text-left relative z-10">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-script text-5xl md:text-7xl text-gray-800 mb-2 md:mb-4 drop-shadow-sm select-none"
        >
          Welcome, My Besti
          <span
            onClick={handleSecretClick}
            className="text-rose-500 inline-block cursor-pointer active:scale-95 transition-transform ml-2"
          >
            🥰
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-sm md:text-lg font-light max-w-2xl leading-relaxed"
        >
          Explore the memories, music, and moments of us.
        </motion.p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-20">
        {visibleCards.map((card, index) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to={card.to}
              className={`block h-36 md:h-48 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} relative overflow-hidden group will-change-transform`}
            >
              {/* Glassy Texture Overlay */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Decorative Big Icon in Background - Simplified transition */}
              <div className="absolute -bottom-4 -right-4 text-white opacity-20 transform rotate-12 scale-100 group-hover:scale-105 transition-transform duration-500 will-change-transform">
                <card.icon size={80} className="md:w-[120px] md:h-[120px]" />
              </div>

              {/* Decorative Circles */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-x-8 -translate-y-8" />

              <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6">
                <div className="flex justify-between items-start">
                  <div className="bg-white/20 backdrop-blur-md p-2 md:p-3 rounded-xl shadow-inner border border-white/20 text-white">
                    <card.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 tracking-tight drop-shadow-md">
                    {card.title}
                  </h3>
                  <p className="text-white/80 font-medium text-[10px] md:text-xs tracking-wide uppercase opacity-90">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;