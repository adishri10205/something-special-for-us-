import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Heart, Share2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import EditModal from '../components/EditModal';

const Reels: React.FC = () => {
  const { reelsData, setReelsData, isAdmin } = useData();
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this reel?')) {
      setReelsData(reelsData.filter(r => r.id !== id));
    }
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setReelsData(reelsData.map(r => r.id === id ? { ...r, ...updatedData } : r));
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 pb-24 md:pb-4 overflow-hidden">
      <div className="h-full w-full max-w-md overflow-y-auto snap-y snap-mandatory no-scrollbar rounded-2xl shadow-2xl border-4 border-white/40 bg-black">
        {reelsData.map((reel) => (
          <div key={reel.id} className="snap-start h-full w-full relative bg-black flex items-center justify-center group">
            {/* Simulated Video Placeholder */}
            <img 
              src={reel.videoUrl} 
              alt="Reel" 
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Admin Controls */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                 <button onClick={() => setEditingItem(reel)} className="bg-blue-600/80 p-2 rounded-full text-white hover:bg-blue-600 backdrop-blur-md">
                   <Edit size={20} />
                 </button>
                 <button onClick={() => handleDelete(reel.id)} className="bg-red-600/80 p-2 rounded-full text-white hover:bg-red-600 backdrop-blur-md">
                   <Trash2 size={20} />
                 </button>
              </div>
            )}

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 flex flex-col justify-end p-6 pointer-events-none">
               <div className="flex items-end justify-between pointer-events-auto">
                 <div className="text-white space-y-2">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-xs font-bold">
                       ❤️
                     </div>
                     <span className="font-semibold text-sm">Us Forever</span>
                   </div>
                   <p className="text-sm font-light opacity-90">{reel.caption}</p>
                 </div>
                 
                 <div className="flex flex-col items-center gap-6 text-white mb-4">
                   <div className="flex flex-col items-center gap-1">
                     <Heart className="w-8 h-8 hover:fill-rose-500 hover:text-rose-500 transition-colors cursor-pointer" />
                     <span className="text-xs">{reel.likes}</span>
                   </div>
                   <Share2 className="w-7 h-7" />
                   <MoreHorizontal className="w-7 h-7" />
                 </div>
               </div>
            </div>
            
            {/* Play Button Overlay (Simulated) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center blur-sm opacity-50"></div>
            </div>
          </div>
        ))}
        {reelsData.length === 0 && (
          <div className="h-full flex items-center justify-center text-white">No reels yet.</div>
        )}
      </div>

      <EditModal 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        onSave={handleUpdate} 
        type="reels" 
        data={editingItem} 
      />
    </div>
  );
};

export default Reels;