import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Music, Trash2, User } from 'lucide-react';
import { Track } from '../types';

// Simple Spotify Embed Component
const SpotifyEmbed = ({ link }: { link: string }) => {
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // Handle standard open.spotify.com links
      if (urlObj.hostname === 'open.spotify.com') {
        const path = urlObj.pathname; // e.g., /track/12345 or /playlist/abcde
        return `https://open.spotify.com/embed${path}?utm_source=generator&theme=0`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(link);

  if (!embedUrl) return null;

  return (
    <iframe
      style={{ borderRadius: '12px' }}
      src={embedUrl}
      width="100%"
      height="152"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="shadow-lg mb-2"
    />
  );
};

const MusicPage: React.FC = () => {
  const { musicTracks, setMusicTracks, isAdmin } = useData();
  const { currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [spotifyLink, setSpotifyLink] = useState('');

  // Determine current user identity for tagging
  const userEmail = currentUser?.email?.toLowerCase() || '';
  const isAditya = userEmail.includes('aditya');
  const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');

  // Tag to save with the track
  const currentTagger = isAditya ? 'aditya' : (isShruti ? 'shruti' : 'unknown');

  // Display text for the Modal
  const modalTitle = isAditya ? 'Add Music for Shruti ❤️' : (isShruti ? 'Add Music for Aditya 🎸' : 'Add Spotify Song');

  const handleAddLink = () => {
    if (!spotifyLink) return;

    // Basic check for Spotify URL
    if (!spotifyLink.includes('open.spotify.com')) {
      alert('Please enter a valid Spotify link (e.g., https://open.spotify.com/track/...)');
      return;
    }

    const newTrack: Track = {
      id: `spotify-${Date.now()}`,
      title: 'Spotify Track',
      artist: 'Spotify',
      duration: '0:00',
      cover: '',
      url: spotifyLink,
      addedBy: currentTagger
    };

    setMusicTracks([...musicTracks, newTrack]);
    setSpotifyLink('');
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this Spotify track?')) {
      setMusicTracks(musicTracks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 pb-32 max-w-2xl mx-auto">

      {/* Header + Add Button */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-script text-gray-800">Our Vibe</h2>
          <p className="text-gray-500 text-sm mt-1">Songs that remind me of you</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* List of Spotify Embeds */}
      <div className="space-y-8">
        {musicTracks.length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
            <Music size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400">No songs added yet.</p>
          </div>
        )}

        {musicTracks.map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            {/* Added By Tag */}
            {track.addedBy && track.addedBy !== 'unknown' && (
              <div className={`absolute -top-3 left-2 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 ${track.addedBy === 'aditya'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-rose-100 text-rose-600'
                }`}>
                <User size={10} />
                {track.addedBy === 'aditya' ? 'Added by Aditya' : 'Added by Shruti'}
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => handleDelete(track.id)}
                className="absolute -top-3 -right-3 z-10 bg-white text-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            )}
            <SpotifyEmbed link={track.url || ''} />
          </motion.div>
        ))}
      </div>

      {/* Add Link Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">{modalTitle}</h3>
                <button onClick={() => setIsAddModalOpen(false)}>
                  <X size={24} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Paste a Spotify link to share a song with {isAditya ? 'Shruti' : 'Aditya'}.
              </p>

              <input
                type="text"
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                placeholder="Paste Spotify Link here..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-green-500 outline-none"
              />

              <button
                onClick={handleAddLink}
                disabled={!spotifyLink}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Add to Playlist
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicPage;