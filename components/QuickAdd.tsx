import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, Lock, Image, Music, FileText, Video } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

interface QuickAddProps {
  className?: string;
}

const QuickAdd: React.FC<QuickAddProps> = ({ className = "" }) => {
  const location = useLocation();
  const { 
    isAdmin, login, 
    galleryImages, setGalleryImages,
    timelineData, setTimelineData,
    reelsData, setReelsData,
    musicTracks, setMusicTracks,
    notes, setNotes,
    vaultItems, setVaultItems
  } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // Form States
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [year, setYear] = useState('');
  const [itemType, setItemType] = useState<'image'|'note'|'music'>('image');

  // Determine Type from Route
  const getType = () => {
    const p = location.pathname;
    if (p === '/gallery') return 'gallery';
    if (p === '/journey') return 'journey';
    if (p === '/reels') return 'reels';
    if (p === '/music') return 'music';
    if (p === '/notes') return 'notes';
    if (p === '/vault') return 'vault';
    return null;
  };

  const type = getType();
  
  if (!type) return null;

  const resetForm = () => {
    setUrl('');
    setCaption('');
    setTitle('');
    setDesc('');
    setYear('');
    setPassword('');
    setError(false);
  };

  const handleLogin = () => {
    if (login(password)) {
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleSubmit = () => {
    const id = Date.now().toString();

    switch (type) {
      case 'gallery':
        if (url) {
          setGalleryImages([...galleryImages, { id, url, caption: caption || 'New Memory' }]);
        }
        break;
      case 'journey':
        if (year && title) {
          setTimelineData([...timelineData, { 
            id, year, title, description: desc, image: url, side: timelineData.length % 2 === 0 ? 'left' : 'right' 
          }]);
        }
        break;
      case 'reels':
        if (url) {
          setReelsData([...reelsData, { 
            id, videoUrl: url, thumbnail: url, caption: caption || 'New Reel', likes: 0 
          }]);
        }
        break;
      case 'music':
        if (title && url) { 
           setMusicTracks([...musicTracks, {
             id, title, artist: caption || 'Unknown', duration: '3:00', cover: url || 'https://picsum.photos/100/100'
           }]);
        }
        break;
      case 'notes':
        if (desc) {
          setNotes([...notes, {
            id, author: 'Me', text: desc, date: new Date().toLocaleDateString(), reactions: 0
          }]);
        }
        break;
      case 'vault':
        if (url || desc) {
          setVaultItems([...vaultItems, {
            id, type: itemType, content: itemType === 'note' ? desc : url, label: title || 'New Item'
          }]);
        }
        break;
    }
    setIsOpen(false);
    resetForm();
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(true); resetForm(); }}
        className={`w-14 h-14 bg-rose-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:bg-rose-700 border-4 border-white ${className}`}
      >
        <Plus size={28} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-[101]"
            >
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800">
                  {isAdmin ? `Add to ${type.charAt(0).toUpperCase() + type.slice(1)}` : 'Admin Access Required'}
                </h3>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {!isAdmin ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2">
                        <Lock size={24} />
                      </div>
                      <p className="text-sm text-center text-gray-500">Please enter admin password to add content.</p>
                    </div>
                    <input 
                      type="password"
                      placeholder="Password"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-200' : 'border-gray-200 ring-rose-200'}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      onClick={handleLogin}
                      className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors"
                    >
                      Unlock
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dynamic Form based on Type */}
                    {type === 'vault' && (
                       <div className="flex gap-2 justify-center mb-4">
                         {['image', 'note', 'music'].map(t => (
                           <button 
                            key={t}
                            onClick={() => setItemType(t as any)}
                            className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${itemType === t ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                           >
                             {t === 'image' && <Image size={14}/>}
                             {t === 'note' && <FileText size={14}/>}
                             {t === 'music' && <Music size={14}/>}
                             {t.charAt(0).toUpperCase() + t.slice(1)}
                           </button>
                         ))}
                       </div>
                    )}

                    {(type === 'journey') && (
                       <input 
                         placeholder="Year (e.g. 2025)" 
                         className="w-full p-3 border rounded-xl bg-gray-50"
                         value={year} onChange={e => setYear(e.target.value)}
                       />
                    )}

                    {(type === 'music' || type === 'journey' || (type === 'vault' && itemType !== 'note')) && (
                       <input 
                         placeholder={type === 'music' ? "Song Title" : "Title / Label"} 
                         className="w-full p-3 border rounded-xl bg-gray-50"
                         value={title} onChange={e => setTitle(e.target.value)}
                       />
                    )}

                    {(type === 'gallery' || type === 'reels' || type === 'journey' || (type === 'music') || (type === 'vault' && itemType !== 'note')) && (
                      <input 
                        placeholder={type === 'reels' ? "Video URL" : type === 'music' ? "Cover Image URL" : "Image URL"}
                        className="w-full p-3 border rounded-xl bg-gray-50"
                        value={url} onChange={e => setUrl(e.target.value)}
                      />
                    )}

                    {(type === 'gallery' || type === 'reels' || type === 'music') && (
                      <input 
                        placeholder={type === 'music' ? "Artist" : "Caption"}
                        className="w-full p-3 border rounded-xl bg-gray-50"
                        value={caption} onChange={e => setCaption(e.target.value)}
                      />
                    )}

                    {(type === 'notes' || type === 'journey' || (type === 'vault' && itemType === 'note')) && (
                      <textarea 
                        placeholder={type === 'journey' ? "Description" : "Write your note here..."}
                        className="w-full p-3 border rounded-xl bg-gray-50"
                        rows={4}
                        value={desc} onChange={e => setDesc(e.target.value)}
                      />
                    )}

                    <button 
                      onClick={handleSubmit}
                      className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Add Item
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickAdd;