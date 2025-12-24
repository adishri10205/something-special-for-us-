import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  type: 'journey' | 'gallery' | 'reels' | 'music' | 'notes' | 'vault';
  data: any;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, type, data }) => {
  const [formData, setFormData] = useState<any>(data || {});

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (data && data.id) {
      onSave(data.id, formData);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-[101] flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Edit {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {type === 'journey' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Year</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.year || ''} onChange={e => handleChange('year', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                    <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.description || ''} onChange={e => handleChange('description', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.image || ''} onChange={e => handleChange('image', e.target.value)} />
                  </div>
                </>
              )}

              {type === 'gallery' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.url || ''} onChange={e => handleChange('url', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Caption</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.caption || ''} onChange={e => handleChange('caption', e.target.value)} />
                  </div>
                </>
              )}

              {type === 'reels' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Video/Image URL</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.videoUrl || ''} onChange={e => handleChange('videoUrl', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Author</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.uploadedBy || ''} onChange={e => handleChange('uploadedBy', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Caption</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.caption || ''} onChange={e => handleChange('caption', e.target.value)} />
                  </div>
                </>
              )}

              {type === 'music' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Artist</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.artist || ''} onChange={e => handleChange('artist', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Cover URL</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.cover || ''} onChange={e => handleChange('cover', e.target.value)} />
                  </div>
                </>
              )}

              {type === 'notes' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
                    <textarea className="w-full p-2 border rounded-lg" rows={4} value={formData.text || ''} onChange={e => handleChange('text', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Author</label>
                    <select className="w-full p-2 border rounded-lg" value={formData.author || 'Me'} onChange={e => handleChange('author', e.target.value)}>
                      <option value="Me">Me</option>
                      <option value="You">You</option>
                    </select>
                  </div>
                </>
              )}

              {type === 'vault' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Label</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.label || ''} onChange={e => handleChange('label', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Content / URL</label>
                    <textarea className="w-full p-2 border rounded-lg" rows={3} value={formData.content || ''} onChange={e => handleChange('content', e.target.value)} />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg flex items-center gap-2 hover:bg-rose-700">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditModal;