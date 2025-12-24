import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Activity } from 'lucide-react';
import { useEmotion } from '../context/EmotionContext';

const AccessDenied: React.FC = () => {
    const navigate = useNavigate();
    const { emotionProfile } = useEmotion();

    const defaultMessage = "Access to this feature is currently locked. Please improve your friendship health to unlock!";
    const message = emotionProfile?.lockMessage || defaultMessage;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {/* Lock Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <Lock className="text-red-600" size={48} />
                    </motion.div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        🔒 Access Denied
                    </h1>

                    {/* Custom Message */}
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        {message}
                    </p>

                    {/* Progress Info */}
                    {emotionProfile && (
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Current Progress</span>
                                <span className="text-lg font-bold text-red-600">{emotionProfile.mainProgress}%</span>
                            </div>
                            <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${emotionProfile.mainProgress}%` }}
                                    className="h-full bg-gradient-to-r from-red-400 to-orange-500"
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">Required</span>
                                <span className="text-sm font-bold text-gray-700">{emotionProfile.accessThreshold}%</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/emotion-profile')}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Activity size={20} />
                            View Profile & Progress
                        </button>

                        <button
                            onClick={() => navigate('/home')}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={20} />
                            Back to Home
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessDenied;
