import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Note } from '../types';
import { Send, Plus, PenTool, Trash2, Edit } from 'lucide-react';
import EditModal from '../components/EditModal';

const Notes: React.FC = () => {
  const { notes, setNotes, isAdmin } = useData();
  const { hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission('canEditNotes');
  const [inputText, setInputText] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      author: 'Me', // Simulated logged in user
      text: inputText,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      reactions: 0
    };

    setNotes([...notes, newNote]);
    setInputText('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleEdit = (e: React.MouseEvent, note: any) => {
    e.stopPropagation();
    setEditingItem(note);
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updatedData } : n));
  };

  return (
    <div className="min-h-screen p-4 md:p-12 pb-32 md:pb-12 bg-stone-50">
      <div className="text-center mb-10">
        <h2 className="font-script text-5xl text-rose-600 mb-2 drop-shadow-sm">Our Notebook</h2>
        <p className="text-gray-500 font-light">Thoughts, promises, and little love notes.</p>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 4 - 2 }}
              animate={{ opacity: 1, scale: 1, rotate: (index % 2 === 0 ? 1 : -1) }}
              exit={{ opacity: 0, scale: 0.5 }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
              className="relative bg-yellow-50 h-64 shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between group"
              style={{
                // Simple lined paper effect
                backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px)',
                backgroundSize: '100% 32px',
                lineHeight: '32px'
              }}
            >
              {/* Pin Element */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-4 h-4 rounded-full bg-rose-400 shadow-sm border-2 border-white/80" />
                <div className="w-8 h-8 absolute -top-1 -left-2 bg-black/10 blur-md -z-10 rounded-full" />
              </div>

              {/* Tape Element (random visual variation) */}
              {index % 3 === 0 && (
                <div className="absolute -top-4 left-4 w-12 h-6 bg-white/40 backdrop-blur-sm transform -rotate-3 border-l border-r border-white/20 shadow-sm" />
              )}

              {/* Admin Controls */}
              {canEdit && (
                <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleEdit(e, note)} className="p-1.5 bg-white/80 rounded-full text-blue-500 hover:bg-blue-100"><Edit size={14} /></button>
                  <button onClick={(e) => handleDelete(e, note.id)} className="p-1.5 bg-white/80 rounded-full text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                </div>
              )}

              {/* Note Content */}
              <div className="flex-1 mt-2 overflow-y-auto no-scrollbar">
                <p className="font-script text-2xl md:text-3xl text-gray-800 leading-[32px] break-words">
                  {note.text}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2 border-t border-rose-200/50 flex justify-between items-center text-xs font-sans text-gray-400 uppercase tracking-widest bg-yellow-50/80 backdrop-blur-[1px]">
                <span>{note.date}</span>
                <span className={`font-bold ${note.author === 'Me' ? 'text-rose-500' : 'text-blue-500'}`}>
                  - {note.author}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State / Add Hint */}
        {notes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-300 opacity-60">
            <PenTool size={48} className="mb-4" />
            <p className="text-xl font-script">The pages are empty... start writing your story.</p>
          </div>
        )}
      </div>

      {/* Floating Input Area */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 px-4 flex justify-center z-40 pointer-events-none">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-2 rounded-full shadow-2xl border border-rose-100 flex items-center gap-2 max-w-lg w-full pointer-events-auto transform transition-transform focus-within:scale-105"
        >
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <PenTool size={18} />
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a memory..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent px-2 py-2 outline-none text-gray-700 placeholder-gray-400 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </motion.div>
      </div>

      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdate}
        type="notes"
        data={editingItem}
      />
    </div>
  );
};

export default Notes;