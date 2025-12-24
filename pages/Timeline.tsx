import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { Calendar, Heart, Edit, Trash2 } from 'lucide-react';
import EditModal from '../components/EditModal';

import { TIMELINE_DATA } from '../constants'; // Import constants

const Timeline: React.FC = () => {
  const { timelineData, setTimelineData, isAdmin } = useData();
  const { hasPermission } = useAuth();
  const { setTitle } = useHeader();
  const canEdit = isAdmin || hasPermission('canEditTimeline');

  useEffect(() => {
    setTitle('Journey');
  }, [setTitle]);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (window.confirm('Are you sure you want to delete this memory?')) {
      setTimelineData(timelineData.filter(item => item.id !== id));
    }
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setTimelineData(timelineData.map(item => item.id === id ? { ...item, ...updatedData } : item));
  };

  const handleLoadDefaults = () => {
    if (window.confirm("Load default journey memories? This will overwrite current data.")) {
      setTimelineData(TIMELINE_DATA);
    }
  }

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 max-w-4xl mx-auto overflow-x-hidden">



      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 md:mb-16 relative z-10"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-500 mb-4 shadow-sm border border-white animate-pulse-slow">
          <Heart size={28} fill="currentColor" className="drop-shadow-sm" />
        </div>
        <h2 className="font-script text-5xl md:text-6xl text-gray-800 mb-2 drop-shadow-sm">Besties Forever</h2>
        <p className="text-gray-500 max-w-md mx-auto text-base font-light tracking-wide">Every moment with you is a favorite memory.</p>
      </motion.div>

      <div className="relative">
        {/* Center Line */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 md:w-1 bg-gradient-to-b from-rose-200 via-rose-300 to-rose-100 transform md:-translate-x-1/2 rounded-full opacity-60" />

        <div className="space-y-12 md:space-y-24 pb-32">
          {timelineData.map((event, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: isEven ? -30 : 30, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`relative flex flex-col md:flex-row ${isEven ? 'md:flex-row-reverse' : ''
                  } items-center md:justify-between group`}
              >
                {/* Dot on Line */}
                <motion.div
                  whileInView={{ scale: [0, 1.2, 1] }}
                  className="absolute left-6 md:left-1/2 w-4 h-4 md:w-5 md:h-5 bg-white border-[3px] border-rose-400 rounded-full transform -translate-x-1/2 z-10 shadow-md"
                />

                {/* Connector Line (Mobile only) */}
                <div className="md:hidden absolute left-6 w-6 h-px bg-rose-200 top-6 transform -translate-y-1/2 -z-10" />

                {/* Date Floating Label (Desktop only - opposite side) */}
                <div className={`hidden md:flex w-[45%] ${isEven ? 'justify-start' : 'justify-end'} items-center`}>
                  <span className="text-rose-200 font-bold text-5xl md:text-7xl font-script select-none transition-colors duration-700 group-hover:text-rose-400">
                    {event.year}
                  </span>
                </div>

                {/* Content Card */}
                <div className="ml-12 md:ml-0 md:w-[45%] w-[calc(100%-3rem)] relative">

                  {/* ADMIN CONTROLS */}
                  {canEdit && (
                    <div className="absolute -top-3 -right-3 z-30 flex gap-2">
                      <button
                        onClick={() => setEditingItem(event)}
                        className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(244, 63, 94, 0.15)" }}
                    className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white shadow-lg overflow-hidden relative transition-all duration-300"
                  >
                    {/* Image Section */}
                    {event.image && (
                      <div className="relative h-40 md:h-48 overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                        {/* Date Badge over Image */}
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <Calendar size={12} className="text-rose-500" />
                          <span className="text-[10px] md:text-xs font-bold text-gray-800 tracking-wider">{event.year}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 md:p-6 relative">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-rose-600 transition-colors duration-300">{event.title}</h3>
                      <p className="text-gray-500 leading-relaxed text-sm font-light">
                        {event.description}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdate}
        type="journey"
        data={editingItem}
      />
    </div>
  );
};

export default Timeline;