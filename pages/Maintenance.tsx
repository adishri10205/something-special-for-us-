import React from 'react';
import { motion } from 'framer-motion';
import { Settings, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataContext';

const Maintenance: React.FC = () => {
    const { maintenanceMode } = useData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Settings size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Under Maintenance
                    </h1>
                    <p className="text-white/90 text-sm md:text-base">
                        We'll be back shortly
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12">
                    {/* Custom Image */}
                    {maintenanceMode.imageUrl && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-8"
                        >
                            <img
                                src={maintenanceMode.imageUrl}
                                alt="Maintenance"
                                className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
                            />
                        </motion.div>
                    )}

                    {/* Message */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-8"
                    >
                        <p className="text-gray-700 text-lg md:text-xl leading-relaxed whitespace-pre-line">
                            {maintenanceMode.message}
                        </p>
                    </motion.div>

                    {/* Animated Dots */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-center items-center gap-2 mb-8"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                                className="w-3 h-3 bg-orange-500 rounded-full"
                            />
                        ))}
                    </motion.div>

                    {/* Refresh Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={20} />
                        Refresh Page
                    </motion.button>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Thank you for your patience 💖
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Maintenance;
