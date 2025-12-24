import React, { useState, useEffect } from 'react';
import { useEmotion } from '../context/EmotionContext';
import { Save, Sliders } from 'lucide-react';
import EmotionDashboard from '../components/EmotionDashboard';

const EmotionAdminTab: React.FC = () => {
    const { emotionProfile, updateMood, updateTrust, updateLove, addComplaint, resolveComplaint, setAccessThreshold, setLockMessage } = useEmotion();

    const [moodValue, setMoodValue] = useState(0);
    const [trustValue, setTrustValue] = useState(0);
    const [loveValue, setLoveValue] = useState(0);
    const [thresholdValue, setThresholdValue] = useState(50);
    const [lockMessageValue, setLockMessageValue] = useState('');

    useEffect(() => {
        if (emotionProfile) {
            setMoodValue(emotionProfile.meters.mood);
            setTrustValue(emotionProfile.meters.trust);
            setLoveValue(emotionProfile.meters.love);
            setThresholdValue(emotionProfile.accessThreshold);
            setLockMessageValue(emotionProfile.lockMessage || '');
        }
    }, [emotionProfile]);

    const handleSave = async () => {
        await Promise.all([
            updateMood(moodValue),
            updateTrust(trustValue),
            updateLove(loveValue),
            setAccessThreshold(thresholdValue),
            setLockMessage(lockMessageValue),
        ]);
        alert('✅ Emotion profile updated successfully!');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Emotion & Access Control</h2>
                <p className="text-gray-500 text-sm">Manage friendship health meters and access control settings</p>
            </div>

            {/* Dashboard Preview */}
            <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Current Status</h3>
                <EmotionDashboard />
            </div>

            {/* Admin Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-100 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sliders className="text-purple-600" size={24} />
                    <h3 className="text-xl font-bold text-gray-800">Adjust Emotion Meters</h3>
                </div>

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

                {/* Custom Lock Message */}
                <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Custom Lock Message
                    </label>
                    <textarea
                        value={lockMessageValue}
                        onChange={(e) => setLockMessageValue(e.target.value)}
                        placeholder="Enter custom message shown when access is denied..."
                        className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This message will be shown to users when they try to access locked features
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
            </div>
        </div>
    );
};

export default EmotionAdminTab;
