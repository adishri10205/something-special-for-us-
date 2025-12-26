import React from 'react';
import { Heart, Smile, Frown, Meh, Shield, AlertCircle, TrendingUp, Lock, Unlock } from 'lucide-react';
import { useEmotion } from '../context/EmotionContext';
import { motion } from 'framer-motion';

const EmotionDashboard: React.FC = () => {
    const { emotionProfile, hasAccess, loading } = useEmotion();

    if (loading || !emotionProfile) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
            </div>
        );
    }

    const { mainProgress, meters, accessThreshold } = emotionProfile;

    // Get mood icon and color
    const getMoodDisplay = (mood: number) => {
        if (mood > 50) return { icon: Smile, color: 'text-green-500', bg: 'bg-green-50', label: 'Happy' };
        if (mood > 0) return { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Normal' };
        if (mood > -50) return { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Sad' };
        return { icon: Frown, color: 'text-red-500', bg: 'bg-red-50', label: 'Angry' };
    };

    const moodDisplay = getMoodDisplay(meters.mood);
    const MoodIcon = moodDisplay.icon;

    // Normalize mood for display (0-100)
    const normalizedMood = ((meters.mood + 100) / 200) * 100;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Main Progress Bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl p-8 shadow-xl border-2 border-rose-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${hasAccess ? 'bg-green-100' : 'bg-red-100'}`}>
                            {hasAccess ? (
                                <Unlock className="text-green-600" size={28} />
                            ) : (
                                <Lock className="text-red-600" size={28} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Our Relationship Health</h2>
                            <p className="text-sm text-gray-600">
                                {hasAccess ? '✨ Full Access Unlocked' : `🔒 Need ${accessThreshold}% for full access`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-rose-600">{mainProgress}%</div>
                        <div className="text-xs text-gray-500 mt-1">Overall Score</div>
                    </div>
                </div>

                {/* Main Progress Bar */}
                <div className="relative h-8 bg-white/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mainProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${mainProgress >= 75
                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                            : mainProgress >= 50
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : mainProgress >= 25
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                            } shadow-lg`}
                    />
                    {/* Threshold Marker */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-gray-400 opacity-50"
                        style={{ left: `${accessThreshold}%` }}
                    >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                            Threshold
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Emotion Meters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mood Meter */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`${moodDisplay.bg} rounded-2xl p-6 shadow-lg border-2 border-${moodDisplay.color.replace('text-', '')}/20`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 ${moodDisplay.bg} rounded-full text-4xl`}>
                            {meters.mood >= 95 ? '🤣' :
                                meters.mood >= 85 ? '😂' :
                                    meters.mood >= 70 ? '😆' :
                                        meters.mood >= 50 ? '😁' :
                                            meters.mood >= 30 ? '🥰' :
                                                meters.mood >= 15 ? '😊' :
                                                    meters.mood >= 5 ? '🤗' :
                                                        meters.mood >= -5 ? '🙂' :
                                                            meters.mood >= -10 ? '😶' :
                                                                meters.mood >= -20 ? '😑' :
                                                                    meters.mood >= -30 ? '😐' :
                                                                        meters.mood >= -40 ? '😭' :
                                                                            meters.mood >= -50 ? '😓' :
                                                                                meters.mood >= -60 ? '😩' :
                                                                                    meters.mood >= -70 ? '😖' :
                                                                                        meters.mood >= -80 ? '😒' : '😡'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Mood Meter</h3>
                            <p className="text-sm text-gray-600">
                                {meters.mood >= 85 ? 'Ecstatic 🎉' :
                                    meters.mood >= 70 ? 'Joyful 😄' :
                                        meters.mood >= 50 ? 'Very Happy 😁' :
                                            meters.mood >= 30 ? 'Happy 🥰' :
                                                meters.mood >= 15 ? 'Good 😊' :
                                                    meters.mood >= 5 ? 'Nice 🤗' :
                                                        meters.mood >= -5 ? 'Normal 🙂' :
                                                            meters.mood >= -20 ? 'Neutral 😶' :
                                                                meters.mood >= -40 ? 'Sad 😭' :
                                                                    meters.mood >= -60 ? 'Very Sad 😢' :
                                                                        meters.mood >= -80 ? 'Upset 😖' : 'Very Angry 😡'}
                            </p>
                        </div>
                    </div>
                    <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${normalizedMood}%` }}
                            className={`h-full bg-gradient-to-r ${meters.mood > 50
                                ? 'from-green-400 to-green-500'
                                : meters.mood > 0
                                    ? 'from-yellow-400 to-yellow-500'
                                    : 'from-red-400 to-red-500'
                                }`}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>😡 Angry</span>
                        <span className="font-semibold">{meters.mood > 0 ? '+' : ''}{meters.mood}</span>
                        <span>🤣 Happy</span>
                    </div>
                </motion.div>

                {/* Trust Meter */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-100"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-full text-4xl">
                            {meters.trust >= 90 ? '🛡️' :
                                meters.trust >= 75 ? '🔐' :
                                    meters.trust >= 60 ? '🤝' :
                                        meters.trust >= 45 ? '👍' :
                                            meters.trust >= 30 ? '🤷' :
                                                meters.trust >= 15 ? '😕' : '🔓'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Trust Meter</h3>
                            <p className="text-sm text-gray-600">
                                {meters.trust >= 90 ? 'Unbreakable 🛡️' :
                                    meters.trust >= 75 ? 'Very Strong 💪' :
                                        meters.trust >= 60 ? 'Strong Trust ✨' :
                                            meters.trust >= 45 ? 'Good Trust' :
                                                meters.trust >= 30 ? 'Building Trust...' :
                                                    meters.trust >= 15 ? 'Low Trust 😞' : 'Need to Build Trust'}
                            </p>
                        </div>
                    </div>
                    <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${meters.trust}%` }}
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>🔓 Low</span>
                        <span className="font-semibold">{meters.trust}%</span>
                        <span>🛡️ High</span>
                    </div>
                </motion.div>

                {/* Love Meter */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-pink-50 rounded-2xl p-6 shadow-lg border-2 border-pink-100"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-pink-100 rounded-full text-4xl">
                            {meters.love >= 95 ? '💖' :
                                meters.love >= 80 ? '💝' :
                                    meters.love >= 65 ? '❤️' :
                                        meters.love >= 50 ? '💕' :
                                            meters.love >= 35 ? '💗' :
                                                meters.love >= 20 ? '💓' : '💔'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">My Love for You</h3>
                            <p className="text-sm text-gray-600">
                                {meters.love >= 95 ? 'Beyond Infinite 💖✨' :
                                    meters.love >= 80 ? 'Infinite Love 💝' :
                                        meters.love >= 65 ? 'Deep Love ❤️' :
                                            meters.love >= 50 ? 'Strong Love 💕' :
                                                meters.love >= 35 ? 'Growing Love 💗' :
                                                    meters.love >= 20 ? 'Developing 💓' : 'New Love 💔'}
                            </p>
                        </div>
                    </div>
                    <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${meters.love}%` }}
                            className="h-full bg-gradient-to-r from-pink-400 via-rose-500 to-red-500"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>💔 Growing</span>
                        <span className="font-semibold">{meters.love}%</span>
                        <span>💖 Infinite</span>
                    </div>
                </motion.div>

                {/* Complaints Meter */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-orange-50 rounded-2xl p-6 shadow-lg border-2 border-orange-100"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-100 rounded-full text-4xl">
                            {meters.complaints >= 75 ? '🚨' :
                                meters.complaints >= 50 ? '❗' :
                                    meters.complaints >= 30 ? '⚠️' :
                                        meters.complaints >= 15 ? '💬' : '✅'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Complaints</h3>
                            <p className="text-sm text-gray-600">
                                {meters.complaints >= 75 ? 'Critical Issues 🚨' :
                                    meters.complaints >= 50 ? 'Many Problems ❗' :
                                        meters.complaints >= 30 ? 'Some Issues ⚠️' :
                                            meters.complaints >= 15 ? 'Few Concerns 💬' : 'All Good ✅'}
                            </p>
                        </div>
                    </div>
                    <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${meters.complaints}%` }}
                            className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>✅ All Good</span>
                        <span className="font-semibold">{meters.complaints}%</span>
                        <span>🚨 Many Issues</span>
                    </div>
                </motion.div>
            </div>

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-lg border-2 border-purple-100"
            >
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-purple-600 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-gray-800 mb-2">How It Works</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Your relationship health is calculated based on mood (25%), trust (30%), love (35%), and complaints (10%).
                            Maintain a score above {accessThreshold}% to keep full access to all features.
                            Positive actions, trust, and love increase your score, while complaints and negative emotions decrease it.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EmotionDashboard;
