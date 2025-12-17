import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, Image, Film, Music, Lock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation: React.FC = () => {
  const location = useLocation();

  const links = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/journey', icon: Heart, label: 'Journey' },
    { to: '/gallery', icon: Image, label: 'Gallery' },
    { to: '/reels', icon: Film, label: 'Reels' },
    { to: '/music', icon: Music, label: 'Music' },
    { to: '/notes', icon: MessageCircle, label: 'Notes' },
    { to: '/vault', icon: Lock, label: 'Vault' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.nav 
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 bg-white/70 backdrop-blur-md border-r border-rose-100 z-50 items-center py-8 gap-8 shadow-lg"
      >
        <div className="text-2xl">💖</div>
        <div className="flex flex-col gap-6 w-full flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center p-2 w-full transition-all duration-300 ${
                  isActive ? 'text-rose-600 scale-110' : 'text-gray-400 hover:text-rose-400'
                }`
              }
            >
              <link.icon size={24} />
              <span className="text-[10px] font-medium mt-1">{link.label}</span>
              {location.pathname === link.to && (
                <motion.div 
                  layoutId="desktop-indicator"
                  className="absolute left-0 w-1 h-8 bg-rose-500 rounded-r-full"
                />
              )}
            </NavLink>
          ))}
        </div>
      </motion.nav>

      {/* Mobile Bottom Bar */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-rose-100 z-50 px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="flex justify-between items-center py-2">
          {links.map((link, index) => {
            return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex flex-col items-center min-w-[50px] p-1 transition-colors relative ${
                  isActive ? 'text-rose-600' : 'text-gray-400'
                }`
              }
            >
              <link.icon size={20} className={location.pathname === link.to ? "fill-current" : ""} />
              <span className="text-[9px] font-medium mt-0.5">{link.label}</span>
              {location.pathname === link.to && (
                <motion.div 
                  layoutId="mobile-indicator"
                  className="absolute -top-2 w-8 h-1 bg-rose-500 rounded-full"
                />
              )}
            </NavLink>
          )})}
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;