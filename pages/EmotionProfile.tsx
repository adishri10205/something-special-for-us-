import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import EmotionDashboard from '../components/EmotionDashboard';
import { useAuth } from '../context/AuthContext';
import { Sliders, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { Complaint } from '../types';

const EmotionProfilePage: React.FC = () => {
    const { emotionProfile, updateMood, updateTrust, updateLove, addComplaint, resolveComplaint, setAccessThreshold } = useEmotion();
    const { isAdmin } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);

    const [showControls, setShowControls] = useState(false);
    const [moodValue, setMoodValue] = useState(0);
    const [trustValue, setTrustValue] = useState(0);
    const [loveValue, setLoveValue] = useState(0);
    const [thresholdValue, setThresholdValue] = useState(50);

    React.useEffect(() => {
        if (emotionProfile) {
            setMoodValue(emotionProfile.meters.mood);
            setTrustValue(emotionProfile.meters.trust);
            setLoveValue(emotionProfile.meters.love);
            setThresholdValue(emotionProfile.accessThreshold);
        }
    }, [emotionProfile]);

    // Fetch complaints
    useEffect(() => {
        const complaintsRef = ref(db, 'complaints');
        const unsubscribe = onValue(complaintsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort: unresolved first, then by date
                list.sort((a, b) => {
                    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
                setComplaints(list);
            } else {
                setComplaints([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        await Promise.all([
            updateMood(moodValue),
            updateTrust(trustValue),
            updateLove(loveValue),
            setAccessThreshold(thresholdValue),
        ]);
        alert('✅ Emotion profile updated successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-24 md:pb-8 md:pl-24">
            <div className="pt-16 md:pt-8">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
                            💖 Our Emotional Journey
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Track our relationship health and emotional connection
                        </p>
                    </motion.div>

                    {/* Dashboard */}
                    <EmotionDashboard />

                    {/* Complaints List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertCircle className="text-red-500" size={28} />
                            Complaints ({complaints.filter(c => !c.resolved).length} Active)
                        </h2>

                        {complaints.length > 0 ? (
                            <div className="space-y-3">
                                {complaints.map((complaint) => (
                                    <motion.div
                                        key={complaint.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`p-4 rounded-xl border-2 ${complaint.resolved
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full ${complaint.resolved
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-500'
                                                }`}>
                                                {complaint.resolved ? (
                                                    <CheckCircle2 size={20} />
                                                ) : (
                                                    <AlertCircle size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-base ${complaint.resolved
                                                        ? 'text-gray-500 line-through'
                                                        : 'text-gray-800 font-medium'
                                                    }`}>
                                                    {complaint.text}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <span className="font-semibold">{complaint.createdByName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                                    {complaint.resolved && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-green-600 font-semibold">✓ Resolved</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white rounded-xl border-2 border-gray-100">
                                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-2" />
                                <p className="text-gray-500 font-medium">No complaints! Everything is peaceful 🌸</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Admin Controls */}
                    {isAdmin && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-8"
                        >
                            <button
                                onClick={() => setShowControls(!showControls)}
                                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Sliders size={20} />
                                {showControls ? 'Hide' : 'Show'} Admin Controls
                            </button>

                            {showControls && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-6 bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-100 space-y-6"
                                >
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Adjust Emotion Meters</h3>

                                    {/* Mood Slider */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Mood: {moodValue > 0 ? '+' : ''}{moodValue}
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({moodValue > 50 ? 'Happy' : moodValue > 0 ? 'Normal' : moodValue > -50 ? 'Sad' : 'Angry'})
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={moodValue}
                                            onChange={(e) => setMoodValue(Number(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Angry/Sad (-100)</span>
                                            <span>Happy (+100)</span>
                                        </div>
                                    </div>

                                    {/* Trust Slider */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Trust: {trustValue}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={trustValue}
                                            onChange={(e) => setTrustValue(Number(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Low Trust (0%)</span>
                                            <span>High Trust (100%)</span>
                                        </div>
                                    </div>

                                    {/* Love Slider */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Love: {loveValue}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={loveValue}
                                            onChange={(e) => setLoveValue(Number(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Growing (0%)</span>
                                            <span>Infinite ❤️ (100%)</span>
                                        </div>
                                    </div>

                                    {/* Access Threshold */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Access Threshold: {thresholdValue}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={thresholdValue}
                                            onChange={(e) => setThresholdValue(Number(e.target.value))}
                                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Minimum score needed for full website access
                                        </p>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={addComplaint}
                                                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                + Add Complaint
                                            </button>
                                            <button
                                                onClick={resolveComplaint}
                                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
                                            >
                                                ✓ Resolve Complaint
                                            </button>
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSave}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} />
                                        Save Changes
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmotionProfilePage;
