import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2, Plus, MessageSquareQuote, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { Complaint } from '../types';

const ComplainBox: React.FC = () => {
    const { currentUser, hasPermission } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [newComplaint, setNewComplaint] = useState('');
    // const [category, setCategory] = useState<'Partners' | 'Both'>('Partners'); 
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'solved'>('active');

    useEffect(() => {
        const complaintsRef = ref(db, 'complaints');
        const unsubscribe = onValue(complaintsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by date descending
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setComplaints(list);
            } else {
                setComplaints([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleResolve = async (id: string, currentStatus: boolean) => {
        try {
            await update(ref(db, `complaints/${id}`), {
                resolved: !currentStatus
            });
        } catch (e) {
            console.error("Update failed", e);
        }
    };

    const displayedComplaints = complaints.filter(c =>
        activeTab === 'active' ? !c.resolved : c.resolved
    );

    const handleAddComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComplaint.trim() || !currentUser) return;

        if (!hasPermission('canAddComplaints')) {
            alert("You need permission to post complaints.");
            return;
        }

        const complaintRef = push(ref(db, 'complaints'));
        const newEntry: Omit<Complaint, 'id'> = {
            text: newComplaint,
            category: 'Partners',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName || 'Anonymous',
            resolved: false
        };

        try {
            await set(complaintRef, newEntry);
            setNewComplaint('');
        } catch (error) {
            console.error("Failed to add complaint", error);
            alert("Failed to submit complaint.");
        }
    };

    const handleDelete = async (id: string, uid: string) => {
        // Only author or admin/special permission can delete
        const isAuthor = currentUser?.uid === uid;
        const canDelete = isAuthor || hasPermission('canDeleteComplaints');

        if (!canDelete) {
            alert("You can only delete your own complaints unless authorized.");
            return;
        }

        if (confirm("Are you sure you want to remove this complaint?")) {
            try {
                await remove(ref(db, `complaints/${id}`));
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    if (!hasPermission('canViewComplaints')) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center text-gray-500">
                    <ShieldAlert size={48} className="mx-auto mb-2 text-rose-300" />
                    <p>Access Restricted to Complain Box</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 bg-gray-50 flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4 text-red-500">
                        <AlertCircle size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Complain Box</h1>
                    <p className="text-gray-500">Let's resolve our issues together.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6 w-full max-w-sm mx-auto">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Active Issues
                    </button>
                    <button
                        onClick={() => setActiveTab('solved')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'solved' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Solved
                    </button>
                </div>

                {/* Input Form (Only visible in Active Tab) */}
                {activeTab === 'active' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                        <form onSubmit={handleAddComplaint}>
                            <textarea
                                value={newComplaint}
                                onChange={(e) => setNewComplaint(e.target.value)}
                                placeholder="What's bothering you?"
                                className="w-full p-4 bg-gray-50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-red-100 transition-all min-h-[100px]"
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex-1"></div>
                                <button
                                    type="submit"
                                    disabled={!newComplaint.trim()}
                                    className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-red-200 disabled:opacity-50 hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Post
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                        {displayedComplaints.length > 0 ? (
                            displayedComplaints.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className={`bg-white p-5 rounded-2xl shadow-sm border ${item.resolved ? 'border-green-100' : 'border-gray-100'} relative group`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full flex-shrink-0 cursor-pointer transition-colors ${item.resolved ? 'bg-green-100 text-green-600' : 'bg-rose-50 text-rose-500 hover:bg-green-50 hover:text-green-500'}`}
                                            onClick={() => toggleResolve(item.id, !!item.resolved)}
                                            title={item.resolved ? "Mark Unresolved" : "Mark Resolved"}
                                        >
                                            {item.resolved ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{item.text}</p>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                                <span className="font-bold text-gray-500">{item.createdByName}</span>
                                                <span>•</span>
                                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>

                                            </div>
                                        </div>
                                        {(hasPermission('canDeleteComplaints') || currentUser?.uid === item.createdBy) && (
                                            <button
                                                onClick={() => handleDelete(item.id, item.createdBy)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                                title="Delete Complaint"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-40">
                                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-2" />
                                <h3 className="text-lg font-bold text-gray-600">No Complaints!</h3>
                                <p>Everything is peaceful... for now.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};

export default ComplainBox;
