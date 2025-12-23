import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import FloatingHearts from './FloatingHearts';
import { motion, AnimatePresence } from 'framer-motion';
const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-rose-200 overflow-hidden relative">
      {/* Header / Top Controls Removed as per request */}

      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-100/40 via-gray-50 to-gray-50 -z-10" />

      <FloatingHearts />

      <Navigation />

      <main className={`relative z-10 md:pl-24 ${location.pathname === '/reels' ? 'pt-0 pb-0' : 'pt-14 md:pt-0 pb-24 md:pb-0'} h-screen overflow-y-auto no-scrollbar scroll-smooth`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>


    </div>
  );
};

export default Layout;