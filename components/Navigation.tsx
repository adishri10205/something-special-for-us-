import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Heart, Image, Film, Music, Lock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Navigation: React.FC = () => {
  const location = useLocation();

  const links = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/gallery', icon: Image, label: 'Gallery' },
    { to: '/reels', icon: Film, label: 'Reels' },
    { to: '/music', icon: Music, label: 'Music' },
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
                `flex flex-col items-center justify-center p-2 w-full transition-all duration-300 ${isActive ? 'text-rose-600 scale-110' : 'text-gray-400 hover:text-rose-400'
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
      {/* Mobile Bottom Bar - Floating Design */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-4 left-4 right-4 mx-auto max-w-[350px] bg-white/90 backdrop-blur-xl border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 px-2 py-2"
      >
        <div className="flex justify-around items-center w-full">
          {links.map((link) => {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-indicator-pill"
                        className="absolute inset-0 bg-rose-500 rounded-full shadow-lg shadow-rose-500/30"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 hover:text-rose-400'}`}>
                      <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;