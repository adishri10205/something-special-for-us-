import React, { useState } from 'react'; // Added useState
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, Image, Film, Music, Lock, MessageCircle, Youtube, LogOut, Menu, X, ArrowLeft, Bell, AlertTriangle, Link2, Book, Mic, Plus } from 'lucide-react'; // Added more icons
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, lockApp, isAppLocked, currentUser, isAdmin, hasPermission } = useAuth();
  const { title } = useHeader();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);


  if (isAppLocked) return null;


  const links = [
    { to: '/home', icon: Home, label: 'Home' },
    ...(hasPermission('canViewJourney') ? [{ to: '/journey', icon: Heart, label: 'Journey' }] : []),
    ...(hasPermission('canViewGallery') ? [{ to: '/gallery', icon: Image, label: 'Gallery' }] : []),
    ...(hasPermission('canViewReels') ? [{ to: '/reels', icon: Film, label: 'Reels' }] : []),
    ...(hasPermission('canViewVideos') ? [{ to: '/videos', icon: Youtube, label: 'Videos' }] : []),
    ...(hasPermission('canViewMusic') ? [{ to: '/music', icon: Music, label: 'Music' }] : []),
    ...(hasPermission('canViewNotes') ? [{ to: '/notes', icon: MessageCircle, label: 'Notes' }] : []),
    ...(hasPermission('canViewVault') ? [{ to: '/vault', icon: Lock, label: 'Vault' }] : []),
    ...(hasPermission('canViewJourney') ? [{ to: '/links', icon: Link2, label: 'Links' }] : []), // Bundling Links with Journey for now as "Extras"
    ...(hasPermission('canViewFlipbook') ? [{ to: '/flipbook', icon: Book, label: 'Storybook' }] : []),
    ...(hasPermission('canViewVoiceNotes') ? [{ to: '/voice-notes', icon: Mic, label: 'Voice Notes' }] : []),
  ];

  return (
    <>
      {/* MOBILE TOP HEADER BAR - Hidden on Reels page */}
      {location.pathname !== '/reels' && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md z-40 border-b border-gray-100 flex items-center justify-between px-4 shadow-sm">

          {/* Left: Menu or Back */}
          <div className="flex items-center">
            {location.pathname === '/home' || location.pathname === '/' ? (
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu size={24} />
              </button>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={24} />
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
          </div>

          {/* Center: Title */}
          <div className="flex-1 flex justify-center px-2">
            <span className="text-xl font-bold text-gray-800 tracking-wide font-script capitalize truncate max-w-[200px] text-center">
              {title}
            </span>
          </div>

          {/* Right: Notification Bell */}
          <div className="relative flex items-center justify-end">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors"
            >
              <Bell size={24} />
            </button>


          </div>

        </div>
      )}


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
                `flex flex-col items-center justify-center p-2 w-full transition-all duration-300 ${isActive ? 'text-rose-600 scale-110' : 'text-gray-400 hover:text-rose-400'}`
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

        <button
          onClick={lockApp}
          className="mb-2 p-2 text-gray-400 hover:text-rose-500 transition-colors flex flex-col items-center gap-1 group"
          title="Quick Lock"
        >
          <Lock size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium">Lock</span>
        </button>

        <button
          onClick={() => { if (confirm("Logout?")) logout() }}
          className="mb-6 p-2 text-gray-400 hover:text-red-500 transition-colors flex flex-col items-center gap-1 group"
        >
          <LogOut size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </motion.nav>

      {/* Mobile Bottom Bar - Premium Floating Design */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-4 left-4 right-4 mx-auto max-w-md bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 px-2 py-3"
      >
        <div className="flex justify-around items-center w-full">
          {/* Show Priority Links for Mobile Bottom Bar (Home, Gallery, Reels, Music) */}
          {links.filter(l => ['/home', '/gallery', '/reels', '/music'].includes(l.to)).map((link) => {
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  if (link.to === '/reels' && location.pathname === '/reels' && (isAdmin || hasPermission('canEditReels'))) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('open-add-reel-modal'));
                  }
                }}
                className="relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl transition-all duration-300"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="mobile-indicator-pill"
                        className="absolute inset-0 bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 rounded-2xl shadow-lg shadow-rose-500/40"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}

                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={`relative z-10 flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-white scale-105' : 'text-gray-500 hover:text-rose-400'
                        }`}
                    >
                      {/* If on Reels page and this is the Reels link, show Plus icon, otherwise show original icon */}
                      {link.to === '/reels' && location.pathname === '/reels' && (isAdmin || hasPermission('canEditReels')) ? (
                        <Plus size={26} strokeWidth={3} />
                      ) : (
                        <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      )}

                      <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'
                        }`}>
                        {link.to === '/reels' && location.pathname === '/reels' && (isAdmin || hasPermission('canEditReels')) ? 'Add' : link.label}
                      </span>
                    </motion.div>
                  </>
                )}
              </NavLink>
            )
          })}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={lockApp}
            className="relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-2xl text-gray-500 hover:text-rose-500 active:scale-95 transition-all duration-200 group"
          >
            <div className="flex flex-col items-center gap-1">
              <Lock size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold tracking-wide opacity-70 group-hover:opacity-100 transition-opacity">
                Lock
              </span>
            </div>
          </motion.button>
        </div>

        {/* Mobile FAB removed as per user request to integrate into nav bar */}
      </motion.nav>

      {/* Mobile Slide Menu - Shows only pages user has permission to view */}
      <AnimatePresence>
        {
          isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.2 }}
                className="md:hidden fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white/95 backdrop-blur-2xl z-[70] shadow-2xl flex flex-col p-6 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="text-2xl">💖</div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-2 flex-1">
                  {links.map(link => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-4 p-4 rounded-xl transition-all font-medium ${isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600 hover:bg-gray-50'}`
                      }
                    >
                      <link.icon size={20} />
                      {link.label}
                    </NavLink>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); lockApp(); }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-rose-50 text-gray-600 hover:text-rose-600 w-full font-medium"
                  >
                    <Lock size={20} />
                    Quick Lock
                  </button>
                  <button
                    onClick={() => { if (confirm("Logout?")) { setIsMobileMenuOpen(false); logout(); } }}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 text-gray-600 hover:text-red-600 w-full font-medium"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )
        }
      </AnimatePresence>
      {/* Notifications Overlay (Moved to Root) */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-gray-50/95 backdrop-blur-xl md:fixed md:top-20 md:right-4 md:inset-auto md:w-96 md:h-auto md:max-h-[600px] md:rounded-2xl md:shadow-2xl md:bg-white/90 md:mt-4 md:border md:border-white/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-white shadow-sm z-10">
              <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center opacity-40">
                <Bell size={64} className="mb-4 text-gray-400" />
                <h3 className="text-lg font-bold text-gray-600">All caught up!</h3>
                <p className="text-gray-500">No new notifications for now.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;