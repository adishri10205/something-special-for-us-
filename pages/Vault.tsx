import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, FileText, Music, Image as ImageIcon, Trash2, Edit, Plus, X, Upload, Loader2, StickyNote, FileAudio, FileImage } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import EditModal from '../components/EditModal';
import { uploadToCloudinary } from '../src/services/uploadService'; // Import upload service
import { VaultItem } from '../types';

const Vault: React.FC = () => {
  const { vaultPin, vaultItems, setVaultItems, isAdmin } = useData();
  const { hasPermission } = useAuth();

  // Access Control
  if (!hasPermission('canViewVault')) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-8 rounded-xl text-center max-w-sm">
          <Lock size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p>You do not have permission to view the Vault.</p>
        </div>
      </div>
    );
  }

  // --- STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<any>(null);

  // Add/Upload State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'image' | 'note' | 'music'>('image');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemText, setNewItemText] = useState(''); // For notes
  const [newItemFile, setNewItemFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // --- LOCK LOGIC ---
  const handlePin = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === vaultPin) {
          setTimeout(() => setIsUnlocked(true), 300);
        } else {
          setTimeout(() => {
            setError(true);
            setPin('');
          }, 300);
        }
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };


  // --- CRUD LOGIC ---
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this item from vault?')) {
      setVaultItems(vaultItems.filter(v => v.id !== id));
    }
  };

  const handleEdit = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setEditingItem(item);
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setVaultItems(vaultItems.map(v => v.id === id ? { ...v, ...updatedData } : v));
  };

  // --- ADD ITEM LOGIC ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItemFile(e.target.files[0]);
    }
  };

  const handleAddItem = async () => {
    setIsUploading(true);
    try {
      let content = '';

      if (addType === 'note') {
        content = newItemText;
        if (!content) throw new Error("Please enter some text for the note.");
      } else {
        // Image or Music Upload
        if (!newItemFile) throw new Error("Please select a file to upload.");

        // Determine folder (default to 'vault' or specific)
        const folder = 'vault';
        const result = await uploadToCloudinary(newItemFile, folder);

        // If music, we might want to ensure resource type, but uploadToCloudinary handles auto
        content = result.secure_url;
      }

      const newItem: VaultItem = {
        id: Date.now().toString(),
        type: addType,
        content: content,
        label: newItemLabel || (addType === 'image' ? 'New Photo' : addType === 'music' ? 'New Track' : 'New Note')
      };

      setVaultItems([...vaultItems, newItem]);

      // Cleanup
      setIsAddModalOpen(false);
      setNewItemLabel('');
      setNewItemText('');
      setNewItemFile(null);
      setAddType('image');

    } catch (err: any) {
      alert("Error adding item: " + err.message);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };


  if (isUnlocked) {
    return (
      <div className="min-h-screen p-6 md:p-12 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="mb-8 relative">
            <Unlock className="w-16 h-16 text-rose-500 mx-auto mb-2" />
            <h2 className="text-3xl font-bold text-gray-800">My Secret Vault</h2>
            <p className="text-gray-500 text-sm">Shh... it's our secret.</p>

            {/* ADD BUTTON */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="absolute right-0 top-0 md:top-2 px-4 py-2 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition flex items-center gap-2 text-sm font-bold"
            >
              <Plus size={18} /> Add Secret
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-24">
            {vaultItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-rose-100 flex flex-col group relative"
                onClick={() => {
                  if (item.type === 'image' || item.type === 'music') {
                    window.open(item.content, '_blank');
                  }
                }}
              >
                {/* Admin/Edit Controls */}
                {(isAdmin || hasPermission('canViewVault')) && (
                  <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEdit(e, item)} className="p-1.5 bg-white/90 rounded-full text-blue-500 hover:bg-blue-100"><Edit size={14} /></button>
                    <button onClick={(e) => handleDelete(e, item.id)} className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                )}

                {item.type === 'image' && (
                  <div className="aspect-square relative cursor-pointer">
                    <img src={item.content} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <ImageIcon size={10} /> Photo
                    </div>
                  </div>
                )}

                {item.type === 'note' && (
                  <div className="aspect-square bg-yellow-50 p-4 flex flex-col justify-center items-center text-center relative cursor-default">
                    <FileText className="text-yellow-400 mb-2" size={24} />
                    <p className="text-gray-700 font-script text-lg leading-tight line-clamp-4">"{item.content}"</p>
                  </div>
                )}

                {item.type === 'music' && (
                  <div className="aspect-square bg-purple-50 p-4 flex flex-col justify-center items-center text-center cursor-pointer">
                    <Music className="text-purple-400 mb-2" size={32} />
                    <p className="text-xs text-purple-700 font-bold mt-2 break-all line-clamp-2">{item.label}</p>
                    <div className="mt-2 bg-purple-200 p-1 rounded-full"><Plus size={12} className="text-purple-600" /></div>
                  </div>
                )}

                <div className="p-3 bg-white border-t border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 truncate">{item.label}</p>
                </div>
              </motion.div>
            ))}

            {vaultItems.length === 0 && (
              <div className="col-span-full py-12 text-gray-400">
                The vault is empty. Add something special.
              </div>
            )}
          </div>
        </motion.div>

        {/* --- ADD ITEM MODAL --- */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Add to Vault</h3>
                  <button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                {/* Type Selector */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                  <button
                    onClick={() => setAddType('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${addType === 'image' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}
                  >
                    <FileImage size={16} /> Photo
                  </button>
                  <button
                    onClick={() => setAddType('note')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${addType === 'note' ? 'bg-white shadow text-yellow-600' : 'text-gray-500'}`}
                  >
                    <StickyNote size={16} /> Note
                  </button>
                  <button
                    onClick={() => setAddType('music')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${addType === 'music' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
                  >
                    <FileAudio size={16} /> Audio
                  </button>
                </div>

                {/* Content Inputs */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title / Label</label>
                    <input
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="e.g. Secret Memory"
                      value={newItemLabel}
                      onChange={e => setNewItemLabel(e.target.value)}
                    />
                  </div>

                  {addType === 'note' ? (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Your Note</label>
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-200 outline-none min-h-[100px]"
                        placeholder="Type something sweet..."
                        value={newItemText}
                        onChange={e => setNewItemText(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Upload File</label>
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept={addType === 'image' ? "image/*" : "audio/*,video/*"}
                          onChange={handleFileSelect}
                        />
                        {newItemFile ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                            <div className="bg-green-100 p-1 rounded-full"><Upload size={14} /></div>
                            <span className="truncate max-w-[150px]">{newItemFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center gap-2">
                            <Upload size={24} />
                            <span className="text-xs font-medium">Click to select {addType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddItem}
                  disabled={isUploading}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                  {isUploading ? 'Uploading...' : 'Add to Vault'}
                </button>

              </motion.div>
            </div>
          )}
        </AnimatePresence>


        <EditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleUpdate}
          type="vault"
          data={editingItem}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60 w-full max-w-sm"
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Enter PIN</h2>

        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors duration-200 ${i < pin.length ? 'bg-rose-500' : 'bg-gray-300'
                }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePin(num.toString())}
              className="w-16 h-16 rounded-full bg-white/50 hover:bg-white text-xl font-semibold text-gray-700 shadow-sm transition-all active:scale-95 mx-auto"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePin('0')}
            className="w-16 h-16 rounded-full bg-white/50 hover:bg-white text-xl font-semibold text-gray-700 shadow-sm transition-all active:scale-95 mx-auto"
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-full text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-all active:scale-95 mx-auto flex items-center justify-center"
          >
            CLR
          </button>
        </div>
      </motion.div>
    </div>
  );
};


export default Vault;