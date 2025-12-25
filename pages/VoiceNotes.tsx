import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { Plus, X, Trash2, Mic, Play, Pause, Upload, Video, Loader2 } from 'lucide-react';
import { VoiceNote, Track } from '../types';
import { createMuxUpload, uploadFileToMux, getMuxUploadStatus, getMuxAsset } from '../src/services/muxService';

// --- Components ---

const VoiceNotePlayer = ({ note, onDelete, canEdit }: { note: VoiceNote, onDelete: (id: string) => void, canEdit: boolean }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration, seek } = useAudio();

    // Map VoiceNote to Track for the AudioContext
    const track: Track = {
        id: note.id,
        title: note.title,
        artist: note.createdBy || 'Unknown',
        duration: '0:00',
        cover: '',
        url: note.url,
        addedBy: note.createdBy?.toLowerCase().includes('aditya') ? 'aditya' : 'shruti'
    };

    const isCurrent = currentTrack?.id === track.id;
    const isThisPlaying = isCurrent && isPlaying;

    const handlePlayClick = () => {
        if (isCurrent) {
            togglePlay();
        } else {
            playTrack(track);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isCurrent) return;
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${isCurrent ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={handlePlayClick}
                    className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-colors shadow-sm ${isThisPlaying ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {isThisPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 truncate pr-2">{note.title}</h3>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{note.createdAt}</span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            {note.createdBy === 'Aditya' ? '👦' : (note.createdBy === 'Shruti' ? '👧' : '🎙️')}
                            {note.createdBy}
                        </span>
                    </div>

                    {/* Progress Bar (Only visible if current) */}
                    <div className={`mt-2 flex items-center gap-2 transition-all ${isCurrent ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                        <span className="text-[10px] font-mono text-gray-500 w-8 text-right">{formatTime(progress)}</span>
                        <div
                            className="relative flex-1 h-1.5 bg-gray-100 rounded-full cursor-pointer group"
                            onClick={handleSeek}
                        >
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full transition-all duration-100"
                                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                            />
                            {/* Hover seeker hint */}
                            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 rounded-full transition-opacity" />
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 w-8">{formatTime(duration)}</span>
                    </div>
                </div>

                {canEdit && (
                    <button
                        onClick={() => onDelete(note.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete Note"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

// --- Page Component ---

const VoiceNotes: React.FC = () => {
    const { voiceNotes, setVoiceNotes } = useData();
    const { currentUser, hasPermission } = useAuth();
    const canEdit = hasPermission('canEditVoiceNotes');

    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'file' | 'playbackId'>('file');

    // Input State
    const [title, setTitle] = useState('');
    const [playbackIdInput, setPlaybackIdInput] = useState('');

    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatusText, setUploadStatusText] = useState('');

    // Identity Logic
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const isAditya = userEmail.includes('aditya');
    const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');
    const authorName = isAditya ? 'Aditya' : (isShruti ? 'Shruti' : 'Admin');

    const handleCloseModal = () => {
        if (isUploading) return;
        setIsAddModalOpen(false);
        setTitle('');
        setPlaybackIdInput('');
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStatusText('');
        setUploadMode('file');
    };

    const handleAddPlaybackId = () => {
        if (!playbackIdInput.trim() || !title.trim()) return;

        const newNote: VoiceNote = {
            id: `vn-${Date.now()}`,
            title,
            url: `https://stream.mux.com/${playbackIdInput}.m3u8`,
            createdAt: new Date().toLocaleDateString(),
            createdBy: authorName
        };

        setVoiceNotes([newNote, ...voiceNotes]);
        handleCloseModal();
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !title.trim()) return;

        try {
            setIsUploading(true);
            setUploadStatusText('Initializing upload...');

            // 1. Create Upload URL - passing title as passthrough
            const { uploadId, uploadUrl } = await createMuxUpload(title); // Pass title for server identification

            // 2. Upload File
            setUploadStatusText('Uploading audio...');
            await uploadFileToMux(uploadUrl, selectedFile, (percent) => {
                setUploadProgress(percent);
            });

            // 3. Poll for Asset Creation
            setUploadStatusText('Processing...');
            let assetId = null;
            let attempts = 0;
            const maxAttempts = 60; // 2 minutes timeout

            while (!assetId && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 2000));
                const status = await getMuxUploadStatus(uploadId);

                if (status.status === 'asset_created') {
                    assetId = status.asset_id;
                } else if (status.status === 'errored') {
                    throw new Error(status.error?.message || 'Upload processing failed');
                }
                attempts++;
            }

            if (!assetId) throw new Error('Timeout waiting for asset creation');

            // 4. Get Playback ID
            setUploadStatusText('Finalizing...');
            const asset = await getMuxAsset(assetId);
            const playbackId = asset.playback_ids?.find((p: any) => p.policy === 'public')?.id;

            if (!playbackId) throw new Error('No public playback ID found');

            // 5. Create Note
            const newNote: VoiceNote = {
                id: `vn-${Date.now()}`,
                title: title || selectedFile.name.replace(/\.[^/.]+$/, ''),
                url: `https://stream.mux.com/${playbackId}.m3u8`,
                createdAt: new Date().toLocaleDateString(),
                createdBy: authorName
            };

            setVoiceNotes([newNote, ...voiceNotes]);
            handleCloseModal();

        } catch (error) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            setUploadStatusText('');
            setUploadProgress(0);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this voice note?")) {
            setVoiceNotes(voiceNotes.filter(n => n.id !== id));
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 pb-32 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-4xl font-script text-gray-800">Voice Notes</h2>
                    <p className="text-gray-500 mt-2">Little echoes of our conversations 🎙️</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-transform hover:scale-105"
                        title="Add Voice Note"
                    >
                        <Plus size={24} />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="space-y-4">
                {voiceNotes.length === 0 && (
                    <div className="text-center py-16 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl">
                        <Mic size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-400">No voice notes recorded yet.</p>
                    </div>
                )}

                {voiceNotes.map((note) => (
                    <VoiceNotePlayer
                        key={note.id}
                        note={note}
                        onDelete={handleDelete}
                        canEdit={canEdit}
                    />
                ))}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Add Voice Note</h3>
                                {!isUploading && (
                                    <button onClick={handleCloseModal}>
                                        <X size={24} className="text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                                <button
                                    onClick={() => setUploadMode('file')}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'file' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}
                                >
                                    <Upload size={14} />
                                    Upload File
                                </button>
                                <button
                                    onClick={() => setUploadMode('playbackId')}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'playbackId' ? 'bg-white text-pink-600 shadow' : 'text-gray-600'}`}
                                >
                                    <Video size={14} />
                                    Mux ID
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        disabled={isUploading}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="Title (e.g. Morning thoughts)"
                                    />
                                </div>

                                {uploadMode === 'playbackId' && (
                                    <div>
                                        <input
                                            type="text"
                                            value={playbackIdInput}
                                            onChange={e => setPlaybackIdInput(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none text-sm font-mono"
                                            placeholder="Mux Playback ID"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Enter the public playback ID from Mux.</p>
                                    </div>
                                )}

                                {uploadMode === 'file' && (
                                    <div>
                                        <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors ${isUploading ? 'opacity-50' : 'cursor-pointer hover:border-indigo-500'}`}>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="audio-upload"
                                                disabled={isUploading}
                                            />
                                            <label htmlFor="audio-upload" className="cursor-pointer w-full h-full block">
                                                {selectedFile ? (
                                                    <div className="flex flex-col items-center">
                                                        <Mic size={32} className="text-indigo-600 mb-2" />
                                                        <p className="font-medium text-gray-800 text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload size={32} className="text-gray-400 mb-2" />
                                                        <p className="text-gray-600 text-sm">Tap to select audio file</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                {isUploading && (
                                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 table-fixed w-full">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={12} className="animate-spin" />
                                                <span>{uploadStatusText}</span>
                                            </div>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={uploadMode === 'file' ? handleFileUpload : handleAddPlaybackId}
                                    disabled={!title || (uploadMode === 'file' ? !selectedFile : !playbackIdInput) || isUploading}
                                    className={`w-full py-3 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 ${uploadMode === 'file' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pink-600 hover:bg-pink-700'}`}
                                >
                                    {isUploading ? 'Uploading...' : 'Add Voice Note'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceNotes;
