import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Heart, Share2, MoreHorizontal } from 'lucide-react';

const Reels: React.FC = () => {
  const { reelsData } = useData();

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 pb-24 md:pb-4 overflow-hidden">
      <div className="h-full w-full max-w-md overflow-y-auto snap-y snap-mandatory no-scrollbar rounded-2xl shadow-2xl border-4 border-white/40">
        {reelsData.map((reel) => (
          <div key={reel.id} className="snap-start h-full w-full relative bg-black flex items-center justify-center">
            {/* Simulated Video Placeholder */}
            <img 
              src={reel.videoUrl} 
              alt="Reel" 
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 flex flex-col justify-end p-6">
               <div className="flex items-end justify-between">
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
      </div>
    </div>
  );
};

export default Reels;