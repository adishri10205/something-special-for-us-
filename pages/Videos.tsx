import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Plus, Trash2, Play, ExternalLink } from 'lucide-react';
import { useData } from '../context/DataContext';
import { YoutubeVideo } from '../types';

const Videos: React.FC = () => {
    const { youtubeVideos, setYoutubeVideos, isAdmin } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');

    const [playingId, setPlayingId] = useState<string | null>(null);

    // Helper: Extract ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleAddVideo = (e: React.FormEvent) => {
        e.preventDefault();
        const id = getYoutubeId(newUrl);
        if (!id) {
            alert("Invalid YouTube URL");
            return;
        }

        const newVideo: YoutubeVideo = {
            id: Date.now().toString(),
            url: newUrl,
            title: newTitle || 'Untitled Video',
            addedAt: new Date().toISOString()
        };

        setYoutubeVideos([...youtubeVideos, newVideo]);
        setNewUrl('');
        setNewTitle('');
        setIsAddModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Remove this video?")) {
            setYoutubeVideos(youtubeVideos.filter(v => v.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <Youtube size={24} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">Video Library</h1>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Plus size={16} /> Add Video
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {youtubeVideos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Youtube size={64} strokeWidth={1} className="mb-4 text-gray-300" />
                        <p className="text-lg">No videos yet.</p>
                        {isAdmin && <p className="text-sm">Tap 'Add Video' to start the playlist!</p>}
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {youtubeVideos.map((video) => {
                            const videoId = getYoutubeId(video.url);
                            const isPlaying = playingId === video.id;

                            return (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="break-inside-avoid relative mb-6 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                                >
                                    {/* Video Player / Thumbnail Area */}
                                    <div className={`bg-black relative ${video.url.includes('shorts') ? 'aspect-[9/16]' : 'aspect-video'}`}>
                                        {isPlaying && videoId ? (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                                title={video.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full relative cursor-pointer"
                                                onClick={() => setPlayingId(video.id)}
                                            >
                                                <img
                                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                                    onError={(e) => e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} // Fallback if maxres doesn't exist
                                                    alt={video.title}
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/40 shadow-lg">
                                                        <Play fill="white" className="text-white ml-1" size={32} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Area */}
                                    <div className="p-4 flex flex-col">
                                        <div>
                                            <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight mb-2">
                                                {video.title}
                                            </h3>
                                        </div>

                                        <div className="flex items-center justify-between mt-2 border-t pt-3 border-gray-50">
                                            <a
                                                href={video.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-500 font-medium flex items-center gap-1 hover:underline"
                                            >
                                                Open on YouTube <ExternalLink size={10} />
                                            </a>

                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDelete(video.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete Video"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Youtube className="text-red-600" /> Add New Video
                            </h2>
                            <form onSubmit={handleAddVideo} className="flex flex-col gap-4">
                                <div>
                                    <div className="flex items-center bg-gray-50 rounded-xl px-3 border border-gray-200 focus-within:ring-2 focus-within:ring-red-500">
                                        <input
                                            type="url"
                                            value={newUrl}
                                            onChange={e => setNewUrl(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=... or /shorts/..."
                                            className="w-full bg-transparent py-3 outline-none text-gray-700 placeholder-gray-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Title (Optional)</label>
                                    <input
                                        type="text"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Our Trip Vlog..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Add Video
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Videos;
