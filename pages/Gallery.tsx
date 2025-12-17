import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { X, ZoomIn } from 'lucide-react';

const Gallery: React.FC = () => {
  const { galleryImages } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-12 min-h-screen">
       <div className="text-center mb-10">
        <h2 className="font-script text-4xl text-rose-600">Captured Moments</h2>
        <p className="text-gray-500 mt-2">Every picture tells a story of us.</p>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {galleryImages.map((image) => (
          <motion.div
            key={image.id}
            layoutId={`card-${image.id}`}
            onClick={() => setSelectedId(image.id)}
            className="break-inside-avoid relative rounded-xl overflow-hidden cursor-zoom-in group mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
          >
            <img 
              src={image.url} 
              alt={image.caption} 
              className="w-full h-auto object-cover rounded-xl shadow-md border border-white/50"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="text-white w-8 h-8" />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`card-${selectedId}`}
              className="relative bg-white p-2 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl z-10"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <X size={20} />
              </button>
              
              <div className="w-full h-full flex flex-col">
                <img 
                  src={galleryImages.find(img => img.id === selectedId)?.url} 
                  className="w-full h-full object-contain rounded-xl max-h-[70vh]"
                />
                <div className="p-4 text-center">
                  <p className="text-gray-700 font-medium font-script text-2xl">
                    {galleryImages.find(img => img.id === selectedId)?.caption}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;