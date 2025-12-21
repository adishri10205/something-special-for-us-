import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Smile, Zap, Coffee, Moon, Sun, Heart, Music, Book, Briefcase, RefreshCw } from 'lucide-react';
import { ref, update, get } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { UserStatusType } from '../types';

const MOODS = [
    { label: 'Happy', icon: Smile, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Excited', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Relaxed', icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Busy', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Tired', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Energetic', icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Loving', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Vibing', icon: Music, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Studious', icon: Book, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const Profile: React.FC = () => {
    const { currentUser, toggleViewMode, isAdmin } = useAuth(); // Assuming viewAsUser toggle is just for UI 'view' mode, but here we want 'Edit' mode.
    // Actually, let's use a local state for "Target User" to edit.
    const [status, setStatus] = useState<UserStatusType>('online');
    const [mood, setMood] = useState<string>('');
    const [customStatus, setCustomStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [partnerUser, setPartnerUser] = useState<any>(null);
    const [isEditingPartner, setIsEditingPartner] = useState(false);

    // Identify Partner
    useEffect(() => {
        const fetchPartner = async () => {
            if (!currentUser) return;
            try {
                const usersRef = ref(db, 'users');
                const snapshot = await get(usersRef);
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const usersArray = Object.values(usersData);

                    const isAditya = currentUser.email?.toLowerCase().includes('aditya');
                    const isShruti = currentUser.email?.toLowerCase().includes('shruti') || currentUser.email?.toLowerCase().includes('adishri');

                    let foundPartner = null;
                    if (isAditya) {
                        foundPartner = usersArray.find((u: any) => u.email?.toLowerCase().includes('shruti') || u.email?.toLowerCase().includes('adishri'));
                    } else if (isShruti) {
                        foundPartner = usersArray.find((u: any) => u.email?.toLowerCase().includes('aditya'));
                    }

                    if (foundPartner) {
                        setPartnerUser(foundPartner);
                    }
                }
            } catch (err) {
                console.error("Error fetching partner", err);
            }
        };
        fetchPartner();
    }, [currentUser]);

    // Target User is either current user or partner (if editing partner)
    const targetUser = isEditingPartner && partnerUser ? partnerUser : currentUser;
    const targetUid = targetUser?.uid;

    useEffect(() => {
        const fetchTargetUserData = async () => {
            if (targetUid) {
                const userRef = ref(db, `users/${targetUid}`);
                const snapshot = await get(userRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setMood(data.mood || '');
                    setStatus(data.status || 'online');
                    setCustomStatus(data.customStatus || '');
                } else {
                    // Reset if no data found/new user
                    setMood('');
                    setStatus('online');
                    setCustomStatus('');
                }
            }
        }
        fetchTargetUserData();
    }, [targetUid]);

    const handleUpdateProfile = async () => {
        if (!targetUid) return;
        setIsSaving(true);
        try {
            const userRef = ref(db, `users/${targetUid}`);
            await update(userRef, {
                mood,
                status,
                customStatus,
                lastSeen: new Date().toISOString()
            });
            alert(`Profile Updated for ${targetUser.displayName || 'User'}! ✨`);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentUser) return <div className="p-8 text-center text-gray-500">Please login to view profile.</div>;

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto min-h-screen pb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
                {/* Header Banner - Dynamic Color based on who we are editing */}
                <div className={`h-32 bg-gradient-to-r ${isEditingPartner ? 'from-purple-400 to-indigo-400' : 'from-rose-400 to-orange-300'} relative transition-colors duration-500`}>
                    <div className="absolute -bottom-12 left-8">
                        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                            {targetUser?.photoURL ? (
                                <img src={targetUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{targetUser?.displayName || 'User'}</h1>
                            <p className="text-gray-500 text-sm mb-6">{targetUser?.email}</p>
                        </div>
                        {/* Admin Switcher */}
                        {isAdmin && partnerUser && (
                            <button
                                onClick={() => setIsEditingPartner(!isEditingPartner)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${isEditingPartner ? 'bg-rose-100 text-rose-600 hover:bg-rose-200' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                    }`}
                            >
                                <RefreshCw size={16} />
                                {isEditingPartner ? "Edit My Profile" : `Edit ${partnerUser.displayName?.split(' ')[0] || 'Partner'}'s Profile`}
                            </button>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Status</h3>
                        <div className="flex gap-3 flex-wrap">
                            {['online', 'busy', 'away', 'offline'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s as UserStatusType)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${status === s
                                        ? 'bg-gray-800 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {s === 'online' && '🟢 '}
                                    {s === 'busy' && '🔴 '}
                                    {s === 'away' && '🟡 '}
                                    {s === 'offline' && 'xxxx '}
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood Selection */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Describe Mood</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {MOODS.map((m) => {
                                const isSelected = mood === m.label;
                                return (
                                    <button
                                        key={m.label}
                                        onClick={() => setMood(m.label)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${isSelected
                                            ? `border-rose-400 ${m.bg} scale-105 shadow-md`
                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <m.icon className={`mb-2 ${m.color}`} size={24} />
                                        <span className={`text-xs font-medium ${isSelected ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {m.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Status */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom Activity</h3>
                        <input
                            type="text"
                            placeholder={isEditingPartner ? `What is ${partnerUser?.displayName?.split(' ')[0]} doing?` : "What are you doing?"}
                            value={customStatus}
                            onChange={(e) => setCustomStatus(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-rose-200 focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 ${isEditingPartner ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-200' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                            }`}
                    >
                        {isSaving ? 'Updating...' : (isEditingPartner ? `Save ${partnerUser?.displayName?.split(' ')[0]}'s Status` : 'Save Profile Status')}
                    </button>

                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
