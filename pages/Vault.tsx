import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, FileText, Music, Image, Trash2, Edit } from 'lucide-react';
import { useData } from '../context/DataContext';
import EditModal from '../components/EditModal';

const Vault: React.FC = () => {
  const { vaultPin, vaultItems, setVaultItems, isAdmin } = useData();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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

  if (isUnlocked) {
    return (
      <div className="min-h-screen p-6 md:p-12 relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="mb-8">
            <Unlock className="w-16 h-16 text-rose-500 mx-auto mb-2" />
            <h2 className="text-3xl font-bold text-gray-800">My Secret Vault</h2>
            <p className="text-gray-500 text-sm">Shh... it's our secret.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-24">
            {vaultItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-rose-100 flex flex-col group relative"
              >
                {/* Admin Controls */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEdit(e, item)} className="p-1.5 bg-white/90 rounded-full text-blue-500 hover:bg-blue-100"><Edit size={14} /></button>
                    <button onClick={(e) => handleDelete(e, item.id)} className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                )}

                {item.type === 'image' && (
                  <div className="aspect-square relative">
                    <img src={item.content} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
                      <Image size={10} /> Photo
                    </div>
                  </div>
                )}

                {item.type === 'note' && (
                  <div className="aspect-square bg-yellow-50 p-4 flex flex-col justify-center items-center text-center relative">
                    <FileText className="text-yellow-400 mb-2" size={24} />
                    <p className="text-gray-700 font-script text-lg leading-tight line-clamp-4">"{item.content}"</p>
                  </div>
                )}

                {item.type === 'music' && (
                  <div className="aspect-square bg-purple-50 p-4 flex flex-col justify-center items-center text-center">
                    <Music className="text-purple-400 mb-2" size={32} />
                    <img src={item.content} className="w-16 h-16 rounded-full shadow-lg mb-2 object-cover" alt="album art" />
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