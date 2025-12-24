import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import FloatingHearts from './FloatingHearts';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '../context/HeaderContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import GlobalMusicPlayer from './GlobalMusicPlayer';
import Maintenance from '../pages/Maintenance';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMusicMode } = useHeader();
  const { maintenanceMode } = useData();
  const { isAdmin } = useAuth();
  const [shouldHideNav, setShouldHideNav] = React.useState(false);

  React.useEffect(() => {
    const handleHideNav = (e: CustomEvent) => setShouldHideNav(e.detail);
    window.addEventListener('hide-bottom-nav', handleHideNav as EventListener);
    return () => window.removeEventListener('hide-bottom-nav', handleHideNav as EventListener);
  }, []);

  // Enforce Music Mode Route
  React.useEffect(() => {
    if (isMusicMode && location.pathname !== '/music') {
      navigate('/music', { replace: true });
    }
  }, [isMusicMode, location.pathname, navigate]);

  // Check if maintenance mode is enabled and user is not admin
  if (maintenanceMode.enabled && !isAdmin) {
    return <Maintenance />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-rose-200 overflow-hidden relative">
      {/* Header / Top Controls Removed as per request */}

      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-100/40 via-gray-50 to-gray-50 -z-10" />

      <FloatingHearts />

      <Navigation />

      <GlobalMusicPlayer />

      <main className={`relative z-10 ${shouldHideNav ? 'md:pl-0' : 'md:pl-24'} transition-all duration-300 ${location.pathname === '/reels' ? 'pt-0 pb-0' : 'pt-14 md:pt-0 pb-24 md:pb-0'} h-screen overflow-y-auto no-scrollbar scroll-smooth`}>
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