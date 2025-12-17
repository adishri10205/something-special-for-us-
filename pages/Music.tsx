import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useApp } from '../context/AppContext';
import { Play, Pause, Disc, Trash2, Edit } from 'lucide-react';
import EditModal from '../components/EditModal';

const MusicPage: React.FC = () => {
  const { musicTracks, setMusicTracks, isAdmin } = useData();
  const { isPlaying, togglePlay, currentTrack, playTrack } = useApp();
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this track?')) {
      setMusicTracks(musicTracks.filter(t => t.id !== id));
    }
  };

  const handleEdit = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setEditingItem(item);
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setMusicTracks(musicTracks.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-xl border border-white/50 flex flex-col md:flex-row gap-10 items-center">
        
        {/* Now Playing Art */}
        <motion.div 
          className="relative w-64 h-64 flex-shrink-0"
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-black rounded-full shadow-2xl flex items-center justify-center">
            <img 
              src={currentTrack?.cover || 'https://picsum.photos/100/100'} 
              alt="Cover" 
              className="w-40 h-40 rounded-full object-cover border-4 border-gray-800"
            />
            <div className="absolute w-8 h-8 bg-rose-50 rounded-full border-2 border-gray-300" />
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex-1 w-full text-center md:text-left space-y-6">
          <div>
            <span className="text-rose-500 text-sm font-semibold tracking-wider uppercase">Now Playing</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-1">{currentTrack?.title || 'No Track'}</h2>
            <p className="text-xl text-gray-500 mt-1">{currentTrack?.artist || 'Unknown'}</p>
          </div>

          <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="h-full bg-rose-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: isPlaying ? "100%" : "0%" }}
              transition={{ duration: 200, ease: "linear" }} 
            />
          </div>

          <div className="flex items-center justify-center md:justify-start gap-6">
            <button 
              onClick={togglePlay}
              className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors hover:scale-105 active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist */}
      <div className="mt-12 space-y-4">
        <h3 className="text-xl font-bold text-gray-700 mb-4 px-2">Birthday Playlist</h3>
        {musicTracks.map((track) => (
          <motion.div 
            key={track.id}
            onClick={() => playTrack(track)}
            whileHover={{ scale: 1.01 }}
            className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors group relative ${
              currentTrack?.id === track.id ? 'bg-white/60 shadow-sm border border-rose-100' : 'hover:bg-white/30'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden mr-4">
              <img src={track.cover} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${currentTrack?.id === track.id ? 'text-rose-600' : 'text-gray-800'}`}>
                {track.title}
              </h4>
              <p className="text-xs text-gray-500">{track.artist}</p>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleEdit(e, track)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full">
                  <Edit size={16} />
                </button>
                <button onClick={(e) => handleDelete(e, track.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="text-xs text-gray-400 font-mono w-10 text-right">
              {currentTrack?.id === track.id && isPlaying ? <div className="flex gap-1 items-end h-4 justify-end"><div className="w-1 bg-rose-400 animate-pulse h-full"></div><div className="w-1 bg-rose-400 animate-pulse h-2"></div><div className="w-1 bg-rose-400 animate-pulse h-3"></div></div> : track.duration}
            </div>
          </motion.div>
        ))}
      </div>

      <EditModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        onSave={handleUpdate} 
        type="music" 
        data={editingItem} 
      />
    </div>
  );
};

export default MusicPage;