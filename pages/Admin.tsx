import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { 
  Settings, Heart, Image as ImageIcon, Music, 
  Film, MessageCircle, Lock, Eye, EyeOff, Plus, Trash2, PlayCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { TimelineEvent, Track } from '../types';

type Tab = 'home' | 'journey' | 'gallery' | 'reels' | 'music' | 'message' | 'notes' | 'vault' | 'settings';

const Admin: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const { 
    timelineData, setTimelineData,
    galleryImages, setGalleryImages,
    reelsData, setReelsData,
    musicTracks, setMusicTracks,
    notes, setNotes,
    vaultItems, setVaultItems,
    cardVisibility, setCardVisibility,
    birthdayMessage, setBirthdayMessage,
    vaultPin, setVaultPin,
    startupSettings, setStartupSettings,
    resetData,
    isAdmin, login, logout
  } = useData();

  // Temporary State for Add Forms
  const [newTimeline, setNewTimeline] = useState<Partial<TimelineEvent>>({ year: '', title: '', description: '' });
  const [newImage, setNewImage] = useState('');
  const [newReel, setNewReel] = useState('');
  const [newTrack, setNewTrack] = useState<Partial<Track>>({ title: '', artist: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // --- Handlers ---
  const toggleCard = (key: string) => {
    setCardVisibility({ ...cardVisibility, [key]: !cardVisibility[key] });
  };

  const addTimelineEvent = () => {
    if (!newTimeline.year || !newTimeline.title) return;
    setTimelineData([...timelineData, { 
      id: Date.now().toString(), 
      year: newTimeline.year!, 
      title: newTimeline.title!, 
      description: newTimeline.description || '',
      side: timelineData.length % 2 === 0 ? 'left' : 'right',
      image: newTimeline.image || 'https://picsum.photos/400/300'
    }]);
    setNewTimeline({ year: '', title: '', description: '' });
  };

  const deleteTimelineEvent = (id: string) => {
    setTimelineData(timelineData.filter(t => t.id !== id));
  };

  const addGalleryImage = () => {
    if (!newImage) return;
    setGalleryImages([...galleryImages, {
      id: Date.now().toString(),
      url: newImage,
      caption: 'New Memory'
    }]);
    setNewImage('');
  };

  const deleteGalleryImage = (id: string) => {
    setGalleryImages(galleryImages.filter(g => g.id !== id));
  };

  const addReel = () => {
    if (!newReel) return;
    setReelsData([...reelsData, {
      id: Date.now().toString(),
      videoUrl: newReel,
      thumbnail: newReel,
      caption: 'New Reel',
      likes: 0
    }]);
    setNewReel('');
  };

  const deleteReel = (id: string) => {
    setReelsData(reelsData.filter(r => r.id !== id));
  };

  const addTrack = () => {
    if (!newTrack.title) return;
    setMusicTracks([...musicTracks, {
      id: Date.now().toString(),
      title: newTrack.title!,
      artist: newTrack.artist || 'Unknown',
      duration: '3:00',
      cover: 'https://picsum.photos/100/100'
    }]);
    setNewTrack({ title: '', artist: '' });
  };

  const deleteTrack = (id: string) => {
    setMusicTracks(musicTracks.filter(t => t.id !== id));
  };

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
            <p className="text-sm text-gray-500">Restricted Access</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password (admin)"
              className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-gray-800`}
              autoFocus
            />
            <button type="submit" className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700">Unlock</button>
          </form>
        </motion.div>
      </div>
    );
  }

  const TabButton: React.FC<{ id: Tab, icon: any, label: string }> = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm hidden md:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Settings className="text-gray-800" />
          <h1 className="font-bold text-xl text-gray-800">Admin Dashboard</h1>
        </div>
        <div className="flex gap-4">
            <button onClick={resetData} className="text-sm text-red-500 hover:underline">Reset Data</button>
            <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-gray-800">Logout</button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-white border-r border-gray-200 w-full md:w-64 flex-shrink-0 overflow-x-auto md:overflow-y-auto">
          <nav className="p-4 flex md:flex-col gap-2 min-w-max">
            <TabButton id="home" icon={Eye} label="Home Cards" />
            <TabButton id="settings" icon={PlayCircle} label="Startup Settings" />
            <TabButton id="journey" icon={Heart} label="Journey" />
            <TabButton id="gallery" icon={ImageIcon} label="Gallery" />
            <TabButton id="reels" icon={Film} label="Reels" />
            <TabButton id="music" icon={Music} label="Music" />
            <TabButton id="message" icon={MessageCircle} label="Message" />
            <TabButton id="notes" icon={MessageCircle} label="Notes" />
            <TabButton id="vault" icon={Lock} label="Vault" />
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Startup Configuration</h2>
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                
                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Initial Loading Page Mode</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'full' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'full' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">💖 Full Intro</div>
                      <p className="text-xs text-gray-500">Show "Happy Birthday" text, then Button, then Countdown.</p>
                    </button>

                    <button 
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'countdown' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'countdown' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">⏱️ Countdown Only</div>
                      <p className="text-xs text-gray-500">Skip "Happy Birthday" text. Show Button and Countdown.</p>
                    </button>

                    <button 
                      onClick={() => setStartupSettings({ ...startupSettings, mode: 'direct_home' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${startupSettings.mode === 'direct_home' ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-800 mb-1">🏠 Direct Home</div>
                      <p className="text-xs text-gray-500">Skip all animations. Go straight to Home Dashboard.</p>
                    </button>
                  </div>
                </div>

                {/* Show Once Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <h4 className="font-bold text-gray-800">Show Intro Only Once</h4>
                    <p className="text-xs text-gray-500">If enabled, visitors will skip the intro after seeing it once.</p>
                  </div>
                  <button 
                    onClick={() => setStartupSettings({ ...startupSettings, showOnce: !startupSettings.showOnce })}
                    className={`text-2xl transition-colors ${startupSettings.showOnce ? 'text-green-500' : 'text-gray-300'}`}
                  >
                    {startupSettings.showOnce ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                  </button>
                </div>

                {/* Reset Seen Status */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Current Status: <span className="font-bold">{startupSettings.hasSeen ? 'Seen (Intro Skipped)' : 'Not Seen (Intro Active)'}</span>
                    </span>
                    <button 
                      onClick={() => setStartupSettings({ ...startupSettings, hasSeen: false })}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300"
                    >
                      Reset "Seen" Status
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Useful for testing the intro experience again.</p>
                </div>

              </div>
            </div>
          )}

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Manage Home Visibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(cardVisibility).map(key => (
                  <div key={key} className="bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm">
                    <span className="font-mono text-gray-600">{key}</span>
                    <button 
                      onClick={() => toggleCard(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${cardVisibility[key] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {cardVisibility[key] ? <Eye size={16}/> : <EyeOff size={16}/>}
                      {cardVisibility[key] ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOURNEY TAB */}
          {activeTab === 'journey' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Timeline Events</h2>
              
              <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-700">Add New Event</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input placeholder="Year (e.g. 2025)" className="p-2 border rounded" value={newTimeline.year} onChange={e => setNewTimeline({...newTimeline, year: e.target.value})} />
                  <input placeholder="Title" className="p-2 border rounded" value={newTimeline.title} onChange={e => setNewTimeline({...newTimeline, title: e.target.value})} />
                  <input placeholder="Image URL (Optional)" className="p-2 border rounded" value={newTimeline.image} onChange={e => setNewTimeline({...newTimeline, image: e.target.value})} />
                  <textarea placeholder="Description" className="p-2 border rounded col-span-full" rows={2} value={newTimeline.description} onChange={e => setNewTimeline({...newTimeline, description: e.target.value})} />
                </div>
                <button onClick={addTimelineEvent} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-700">
                  <Plus size={16} /> Add Event
                </button>
              </div>

              <div className="space-y-2">
                {timelineData.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                    <div>
                      <span className="font-bold text-rose-500">{item.year}</span> - <span className="font-semibold">{item.title}</span>
                      <p className="text-xs text-gray-500 truncate max-w-md">{item.description}</p>
                    </div>
                    <button onClick={() => deleteTimelineEvent(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Gallery Images</h2>
               <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-4">
                  <input className="flex-1 p-2 border rounded" placeholder="Image URL (https://...)" value={newImage} onChange={e => setNewImage(e.target.value)} />
                  <button onClick={addGalleryImage} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold">Add</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {galleryImages.map(img => (
                   <div key={img.id} className="relative group rounded-lg overflow-hidden h-32 bg-gray-100">
                     <img src={img.url} className="w-full h-full object-cover" />
                     <button onClick={() => deleteGalleryImage(img.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                       <Trash2 />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* REELS TAB */}
           {activeTab === 'reels' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Reels</h2>
               <div className="bg-white p-4 rounded-xl border shadow-sm flex gap-4">
                  <input className="flex-1 p-2 border rounded" placeholder="Video/Image URL" value={newReel} onChange={e => setNewReel(e.target.value)} />
                  <button onClick={addReel} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold">Add Reel</button>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {reelsData.map(reel => (
                   <div key={reel.id} className="relative group rounded-lg overflow-hidden h-48 bg-black">
                     <img src={reel.thumbnail} className="w-full h-full object-cover opacity-80" />
                     <button onClick={() => deleteReel(reel.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                       <Trash2 />
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* MUSIC TAB */}
          {activeTab === 'music' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Playlist</h2>
               <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
                  <input className="flex-1 p-2 border rounded" placeholder="Song Title" value={newTrack.title} onChange={e => setNewTrack({...newTrack, title: e.target.value})} />
                  <input className="flex-1 p-2 border rounded" placeholder="Artist" value={newTrack.artist} onChange={e => setNewTrack({...newTrack, artist: e.target.value})} />
                  <button onClick={addTrack} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold">Add Track</button>
               </div>
               <div className="space-y-2">
                 {musicTracks.map(track => (
                   <div key={track.id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden"><img src={track.cover} className="w-full h-full object-cover"/></div>
                       <div><p className="font-bold text-sm">{track.title}</p><p className="text-xs text-gray-500">{track.artist}</p></div>
                     </div>
                     <button onClick={() => deleteTrack(track.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* MESSAGE TAB */}
          {activeTab === 'message' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Special Message</h2>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <textarea 
                  className="w-full p-4 border rounded-xl text-lg font-script text-gray-700 focus:outline-none focus:border-rose-300" 
                  rows={6}
                  value={birthdayMessage}
                  onChange={(e) => setBirthdayMessage(e.target.value)}
                />
                <div className="mt-4 flex justify-end text-sm text-gray-500">
                  Auto-saved
                </div>
              </div>
            </div>
          )}

          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Moderation - Notes</h2>
              <div className="space-y-2">
                {notes.length === 0 && <p className="text-gray-400">No notes yet.</p>}
                {notes.map(note => (
                  <div key={note.id} className="bg-white p-4 rounded-lg border flex justify-between items-start">
                    <div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${note.author === 'Me' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>{note.author}</span>
                      <p className="mt-2 text-gray-800">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.date}</p>
                    </div>
                    <button onClick={() => setNotes(notes.filter(n => n.id !== note.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

           {/* VAULT TAB */}
           {activeTab === 'vault' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Vault Security & Content</h2>
              
              <div className="bg-white p-6 rounded-xl border shadow-sm max-w-md mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Change Access PIN</label>
                <input 
                  type="text" 
                  maxLength={4}
                  className="w-full p-3 border rounded-lg text-2xl tracking-[1em] font-mono text-center"
                  value={vaultPin}
                  onChange={(e) => setVaultPin(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <p className="text-xs text-gray-500 mt-2">Current access code for the vault page.</p>
              </div>

              <h3 className="font-bold text-gray-700 mb-2">Manage Vault Content</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vaultItems.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white flex-shrink-0 ${item.type === 'image' ? 'bg-blue-400' : item.type === 'note' ? 'bg-yellow-400' : 'bg-purple-400'}`}>
                           {item.type === 'image' && <ImageIcon size={16}/>}
                           {item.type === 'note' && <MessageCircle size={16}/>}
                           {item.type === 'music' && <Music size={16}/>}
                        </div>
                        <div className="truncate">
                           <p className="font-bold text-sm truncate">{item.label}</p>
                           <p className="text-xs text-gray-500 truncate">{item.content}</p>
                        </div>
                      </div>
                      <button onClick={() => setVaultItems(vaultItems.filter(v => v.id !== item.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Admin;