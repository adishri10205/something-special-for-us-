import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Note } from '../types';
import { Search, FileText, Plus, X, ChevronLeft, Save, Eye, PenTool, Trash2, Edit } from 'lucide-react';

const Notes: React.FC = () => {
  const navigate = useNavigate();
  const { notes, setNotes, isAdmin } = useData();
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');

  // Editor State
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [previewMode, setPreviewMode] = useState(true);

  // Hide Bottom Navigation when Editor is Open
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('hide-bottom-nav', { detail: isEditorOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent('hide-bottom-nav', { detail: false }));
    };
  }, [isEditorOpen]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const query = searchQuery.toLowerCase();
      return (note.title?.toLowerCase().includes(query) || note.text.toLowerCase().includes(query));
    });
  }, [notes, searchQuery]);

  // Strict Permission Check
  const canEdit = useMemo(() => isAdmin || hasPermission('canEditNotes'), [isAdmin, hasPermission]);
  const canDelete = useMemo(() => isAdmin || hasPermission('canDeleteNotes'), [isAdmin, hasPermission]);

  const handleOpenCreate = () => {
    setEditorMode('create');
    setEditId(null);
    setEditTitle('');
    setEditContent('');
    // New notes start in Edit mode
    setPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditorMode('edit');
    setEditId(note.id);
    setEditTitle(note.title || '');
    setEditContent(note.text);
    // Existing notes open in Preview mode by default
    setPreviewMode(true);
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!editContent.trim()) return;
    if (editorMode === 'edit' && !canEdit) return; // Guard

    if (editorMode === 'create') {
      const newNote: Note = {
        id: Date.now().toString(),
        author: 'Me',
        title: editTitle || 'Untitled Note',
        text: editContent,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        reactions: 0
      };
      setNotes([newNote, ...notes]);
    } else if (editorMode === 'edit' && editId) {
      setNotes(notes.map(n => n.id === editId ? {
        ...n,
        title: editTitle || 'Untitled Note',
        text: editContent,
        // date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      } : n));
    }
    setIsEditorOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canDelete) return;
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  // Random pastel colors for list items
  const getNoteColor = (index: number) => {
    const colors = [
      'bg-blue-50 border-blue-100 text-blue-500',
      'bg-yellow-50 border-yellow-100 text-yellow-500',
      'bg-green-50 border-green-100 text-green-500',
      'bg-pink-50 border-pink-100 text-pink-500',
      'bg-purple-50 border-purple-100 text-purple-500',
      'bg-orange-50 border-orange-100 text-orange-500',
      'bg-teal-50 border-teal-100 text-teal-500',
      'bg-rose-50 border-rose-100 text-rose-500',
      'bg-indigo-50 border-indigo-100 text-indigo-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-8 px-6 pb-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/home')}
            className="p-2 bg-rose-100 rounded-full text-rose-500 hover:bg-rose-200 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            {/* More Actions if needed */}
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 to-blue-400 bg-clip-text text-transparent mb-6">
          My Notes
        </h1>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={20} className="text-rose-300" />
          </div>
          <input
            type="text"
            placeholder="Search note"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-10 pr-4 rounded-xl border border-rose-100 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 text-gray-600 placehoder-rose-200 transition-all"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="px-4 pb-24 space-y-3">
        <AnimatePresence>
          {filteredNotes.map((note, index) => {
            const colorClass = getNoteColor(index);
            const bgClass = colorClass.split(' ')[0];
            const borderClass = colorClass.split(' ')[1];
            const textClass = colorClass.split(' ')[2];

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOpenEdit(note)}
                className={`p-4 rounded-2xl border ${bgClass} ${borderClass} flex items-center gap-4 cursor-pointer hover:shadow-sm transition-all`}
              >
                <div className={`p-3 bg-white rounded-xl shadow-sm ${textClass}`}>
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate mb-1">
                    {note.title || note.text.slice(0, 30) || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {note.date}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={(e) => handleDelete(e, note.id)}
                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:bg-white/50 rounded-full transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300 opacity-60">
            <FileText size={48} className="mb-4" />
            <p className="text-xl font-sans">No notes found...</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        onClick={handleOpenCreate}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 md:bottom-12 right-6 w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full shadow-xl flex items-center justify-center text-white z-40"
      >
        <Plus size={28} />
      </motion.button>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            {/* Editor Header */}
            <div className="px-4 py-4 pt-16 md:pt-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-50">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <h2 className="text-lg font-bold text-gray-800">
                {editorMode === 'create' ? 'New Note' : (previewMode ? '' : 'Edit Note')}
              </h2>

              <div className="flex items-center gap-2">
                {/* Show Edit Button if in Preview Mode and User has Permission */}
                {editorMode === 'edit' && previewMode && canEdit && (
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                    title="Edit Note"
                  >
                    <PenTool size={22} />
                  </button>
                )}

                {/* Show Save Button if NOT in Preview Mode (Creating or Editing) */}
                {!previewMode && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 text-blue-600 font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Title Input */}
            <div className="px-4 pt-4 pb-0">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                readOnly={previewMode}
                placeholder={previewMode ? "" : "Note Title..."}
                className={`w-full text-2xl font-bold p-2 rounded-xl border-0 focus:ring-0 outline-none transition-all text-gray-900 placeholder-gray-300 ${previewMode ? 'bg-transparent px-0' : 'bg-gray-50'}`}
              />
            </div>

            {/* Content Area */}
            <div className={`flex-1 p-4 overflow-hidden flex flex-col`}>
              <div className={`flex-1 ${!previewMode ? 'border border-gray-200 rounded-xl bg-gray-50' : ''} overflow-hidden relative`}>
                {previewMode ? (
                  <div className="absolute inset-0 p-2 overflow-y-auto prose prose-rose max-w-none">
                    {editContent.split('\n').map((line, i) => (
                      <p key={i} className={`mb-2 text-gray-700 leading-relaxed ${line.startsWith('**') ? 'font-bold' : ''} ${line.startsWith('-') ? 'pl-4' : ''}`}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                    {editContent === '' && <span className="text-gray-400 italic">No content...</span>}
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start typing..."
                    className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none outline-none font-sans text-gray-700 leading-relaxed custom-scrollbar"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;