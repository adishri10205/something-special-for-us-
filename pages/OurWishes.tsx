import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus, Trash2, CheckCircle2, Circle, Edit2, Sparkles, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { OurWish } from '../types';

const OurWishes: React.FC = () => {
    const { currentUser, hasPermission, isAdmin } = useAuth();
    const [wishes, setWishes] = useState<OurWish[]>([]);
    const [newWish, setNewWish] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        const wishesRef = ref(db, 'our_wishes');
        const unsubscribe = onValue(wishesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort: Pending first, then by priority (High > Medium > Low), then by Date
                list.sort((a, b) => {
                    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
                    // Custom priority sort
                    const pMap = { high: 3, medium: 2, low: 1 };
                    const pA = pMap[a.priority || 'medium'];
                    const pB = pMap[b.priority || 'medium'];
                    if (pA !== pB) return pB - pA;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setWishes(list);
            } else {
                setWishes([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAddWish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWish.trim() || !currentUser) return;
        if (!hasPermission('canAddWishes')) {
            alert("Insufficient permissions to add wishes.");
            return;
        }

        const wishRef = push(ref(db, 'our_wishes'));
        const newEntry: Omit<OurWish, 'id'> = {
            text: newWish,
            status: 'pending',
            priority,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || 'Anonymous',
            createdByName: currentUser.displayName || 'Anonymous',
        };

        try {
            await set(wishRef, newEntry);
            setNewWish('');
            setPriority('medium');
        } catch (e) {
            console.error("Add failed", e);
        }
    };

    const handleDelete = async (id: string, uid: string) => {
        const isAuthor = currentUser?.uid === uid;
        if (!isAdmin && !isAuthor) {
            alert("Cannot delete this wish.");
            return;
        }
        if (confirm("Remove this wish?")) {
            await remove(ref(db, `our_wishes/${id}`));
        }
    };

    const toggleStatus = async (wish: OurWish) => {
        if (!hasPermission('canEditWishes')) return;
        const newStatus = wish.status === 'pending' ? 'fulfilled' : 'pending';
        await update(ref(db, `our_wishes/${wish.id}`), { status: newStatus });
    };

    const startEdit = (wish: OurWish) => {
        if (!hasPermission('canEditWishes') && currentUser?.uid !== wish.createdBy) return;
        setEditingId(wish.id);
        setEditText(wish.text);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        await update(ref(db, `our_wishes/${editingId}`), { text: editText });
        setEditingId(null);
        setEditText('');
    };

    if (!hasPermission('canViewWishes')) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center text-gray-500">
                    <ShieldAlert size={48} className="mx-auto mb-2 text-rose-300" />
                    <p>Access Restricted to Wishes</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-4 text-yellow-500 shadow-lg shadow-yellow-200">
                        <Star size={32} fill="currentColor" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Wishes</h1>
                    <p className="text-gray-500">Dreams we want to turn into reality.</p>
                </div>

                {/* Input */}
                {(hasPermission('canAddWishes') || hasPermission('canEditWishes')) && (
                    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 mb-8">
                        <form onSubmit={handleAddWish}>
                            <textarea
                                value={newWish}
                                onChange={(e) => setNewWish(e.target.value)}
                                placeholder="I wish for..."
                                className="w-full p-4 bg-purple-50/50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[80px]"
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p as any)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${priority === p
                                                ? (p === 'high' ? 'bg-red-100 text-red-600' : p === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600')
                                                : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newWish.trim()}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 hover:bg-purple-700 transition-all flex items-center gap-2"
                                >
                                    <Sparkles size={16} /> Wish it
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {wishes.map(wish => (
                            <motion.div
                                key={wish.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`bg-white p-5 rounded-2xl shadow-sm border relative group overflow-hidden ${wish.status === 'fulfilled' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                                    }`}
                            >
                                {wish.status === 'fulfilled' && (
                                    <div className="absolute -right-4 -top-4 bg-green-100 text-green-600 px-8 py-1 rotate-45 text-xs font-bold shadow-sm">
                                        Fulfilled
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => toggleStatus(wish)}
                                        className={`mt-1 flex-shrink-0 transition-colors ${wish.status === 'fulfilled' ? 'text-green-500' : 'text-gray-300 hover:text-purple-500'}`}
                                    >
                                        {wish.status === 'fulfilled' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>

                                    <div className="flex-1">
                                        {editingId === wish.id ? (
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    className="w-full p-2 bg-gray-50 rounded border border-gray-200 outline-none"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={saveEdit} className="text-xs bg-green-500 text-white px-3 py-1 rounded">Save</button>
                                                    <button onClick={() => setEditingId(null)} className="text-xs bg-gray-300 text-gray-700 px-3 py-1 rounded">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className={`text-lg transition-all ${wish.status === 'fulfilled' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {wish.text}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${wish.priority === 'high' ? 'bg-red-50 text-red-500' : wish.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                                                        }`}>
                                                        {wish.priority}
                                                    </span>
                                                    <span>• {new Date(wish.createdAt).toLocaleDateString()}</span>
                                                    {wish.createdByName && <span>• by {wish.createdByName}</span>}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {editingId !== wish.id && (
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(hasPermission('canEditWishes') || currentUser?.uid === wish.createdBy) && (
                                                <button onClick={() => startEdit(wish)} className="text-gray-400 hover:text-blue-500 p-1">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            {(isAdmin || currentUser?.uid === wish.createdBy) && (
                                                <button onClick={() => handleDelete(wish.id, wish.createdBy)} className="text-gray-400 hover:text-red-500 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default OurWishes;
