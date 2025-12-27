import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { Plus, X, Mic, Trash2, Upload, Loader2, Video, Play, Pause, Edit2 } from 'lucide-react';
import { VoiceNote } from '../types';
import { createMuxUpload, uploadFileToMux, getMuxUploadStatus, getMuxAsset } from '../src/services/muxService';
import { useAudio } from '../context/AudioContext';

// Simple Audio Player for Voice Notes
const SimpleVoicePlayer = ({ note }: { note: VoiceNote }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration, seek } = useAudio();
    const isCurrent = currentTrack?.id === note.id;
    const isThisPlaying = isCurrent && isPlaying;

    const handlePlayClick = () => {
        if (isCurrent) {
            togglePlay();
        } else {
            // Convert VoiceNote to Track format for AudioContext
            const track = {
                id: note.id,
                title: note.title,
                artist: note.createdBy || 'Voice Note',
                duration: '0:00',
                cover: '',
                url: note.url.includes('http') ? note.url : `https://stream.mux.com/${note.url}.m3u8`
            };
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

    const displayProgress = isCurrent ? progress : 0;
    const displayDuration = isCurrent ? duration : 0;

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/50 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Decorative Gradient Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="flex items-center gap-4 relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300 border border-white">
                    <Mic size={24} className="text-purple-600 drop-shadow-sm" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate text-lg leading-tight">{note.title}</h4>
                    <p className="text-xs text-purple-600/80 font-bold uppercase tracking-wider truncate mt-0.5">
                        {note.createdBy ? `by ${note.createdBy}` : 'Voice Note'} • {note.createdAt}
                    </p>
                </div>

                {/* Play Button */}
                <button
                    onClick={handlePlayClick}
                    className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-gray-900/30 hover:bg-black"
                >
                    {isThisPlaying ? (
                        <Pause size={20} fill="currentColor" className="text-purple-100" />
                    ) : (
                        <Play size={20} fill="currentColor" className="ml-1 text-purple-100" />
                    )}
                </button>
            </div>

            {/* Progress Bar */}
            <div className={`mt-5 flex items-center gap-3 transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                <span className="text-[10px] text-gray-400 font-medium font-mono min-w-[32px] text-right">{formatTime(displayProgress)}</span>

                <div
                    className={`flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative group/progress ${isCurrent ? 'cursor-pointer' : ''}`}
                    onClick={handleSeek}
                >
                    <div className="absolute inset-0 bg-gray-200 opacity-0 group-hover/progress:opacity-50 transition-opacity" />
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all duration-100 ease-linear"
                        style={{ width: `${displayDuration ? (displayProgress / displayDuration) * 100 : 0}%` }}
                    >
                        {isCurrent && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity translate-x-1" />}
                    </div>
                </div>

                <span className="text-[10px] text-gray-400 font-medium font-mono min-w-[32px]">{formatTime(displayDuration)}</span>
            </div>
        </div>
    );
};

const VoiceNotes: React.FC = () => {
    const { voiceNotes, setVoiceNotes } = useData();
    const { currentUser, hasPermission } = useAuth();
    const { setTitle } = useHeader();
    const canEdit = hasPermission('canEditVoiceNotes');

    // Folder/Playlist State
    const [folders, setFolders] = useState<string[]>(['All Notes', 'Favorites']);
    const [activeFolder, setActiveFolder] = useState('All Notes');
    const [noteFolders, setNoteFolders] = useState<Record<string, string>>({});
    const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'file' | 'playbackId'>('playbackId');
    const [playbackIdInput, setPlaybackIdInput] = useState('');

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatusText, setUploadStatusText] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [selectedFolderForUpload, setSelectedFolderForUpload] = useState('All Notes');

    // Edit State
    const [editingNote, setEditingNote] = useState<VoiceNote | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Determine current user identity
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const isAditya = userEmail.includes('aditya');
    const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');
    const authorName = isAditya ? 'Aditya' : (isShruti ? 'Shruti' : 'Admin');

    const modalTitle = isAditya ? 'Add Voice Note for Shruti 🎙️' : (isShruti ? 'Add Voice Note for Aditya 🎙️' : 'Add Voice Note');

    useEffect(() => {
        setTitle('Voice Notes');
    }, [setTitle]);

    // Get notes for active folder
    const getNotesForFolder = () => {
        if (activeFolder === 'All Notes') {
            return voiceNotes;
        }
        return voiceNotes.filter(note => noteFolders[note.id] === activeFolder);
    };

    const handleAddFolder = () => {
        if (!newFolderName.trim()) return;
        if (folders.includes(newFolderName)) {
            alert('Folder already exists!');
            return;
        }
        setFolders([...folders, newFolderName]);
        setNewFolderName('');
        setIsAddFolderOpen(false);
    };

    const handleDeleteFolder = (folderName: string) => {
        if (folderName === 'All Notes' || folderName === 'Favorites') {
            alert('Cannot delete default folders');
            return;
        }
        if (window.confirm(`Delete folder "${folderName}"?`)) {
            setFolders(folders.filter(f => f !== folderName));
            const newNoteFolders = { ...noteFolders };
            Object.keys(newNoteFolders).forEach(noteId => {
                if (newNoteFolders[noteId] === folderName) {
                    delete newNoteFolders[noteId];
                }
            });
            setNoteFolders(newNoteFolders);
            if (activeFolder === folderName) {
                setActiveFolder('All Notes');
            }
        }
    };

    const handleAddPlaybackId = () => {
        if (!playbackIdInput.trim() || !noteTitle.trim()) {
            alert('Please enter both title and Mux Playback ID');
            return;
        }

        const newNote: VoiceNote = {
            id: `vn-${Date.now()}`,
            title: noteTitle,
            url: playbackIdInput.trim(),
            createdAt: new Date().toLocaleDateString(),
            createdBy: authorName
        };

        setVoiceNotes([...voiceNotes, newNote]);

        if (selectedFolderForUpload !== 'All Notes') {
            setNoteFolders({ ...noteFolders, [newNote.id]: selectedFolderForUpload });
        }

        setPlaybackIdInput('');
        setNoteTitle('');
        setIsAddModalOpen(false);
    };

    const handleEditClick = (note: VoiceNote) => {
        setEditingNote(note);
        setEditTitle(note.title);
    };

    const handleSaveEdit = () => {
        if (!editingNote) return;

        const updatedNotes = voiceNotes.map(n =>
            n.id === editingNote.id
                ? { ...n, title: editTitle }
                : n
        );

        setVoiceNotes(updatedNotes);
        setEditingNote(null);
        setEditTitle('');
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            setUploadStatusText('Initializing upload...');

            // 1. Create Upload URL
            const { uploadId, uploadUrl } = await createMuxUpload();

            // 2. Upload File
            setUploadStatusText('Uploading audio...');
            await uploadFileToMux(uploadUrl, selectedFile, (percent) => {
                setUploadProgress(percent);
            });

            // 3. Poll for Asset Creation
            setUploadStatusText('Processing...');
            let assetId = null;
            let attempts = 0;
            const maxAttempts = 60;

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

            // 5. Create Voice Note
            const newNote: VoiceNote = {
                id: `vn-${Date.now()}`,
                title: noteTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
                url: playbackId,
                createdAt: new Date().toLocaleDateString(),
                createdBy: authorName
            };

            setVoiceNotes([...voiceNotes, newNote]);

            if (selectedFolderForUpload !== 'All Notes') {
                setNoteFolders({ ...noteFolders, [newNote.id]: selectedFolderForUpload });
            }

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

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setPlaybackIdInput('');
        setSelectedFile(null);
        setNoteTitle('');
        setUploadProgress(0);
        setIsUploading(false);
        setUploadMode('playbackId');
        setUploadStatusText('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Remove this voice note?')) {
            setVoiceNotes(voiceNotes.filter(n => n.id !== id));
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 pb-32 max-w-2xl mx-auto">

            {/* Header + Add Buttons */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-4xl font-script text-gray-800">Voice Notes</h2>
                    <p className="text-gray-500 text-sm mt-1">Little echoes of our conversations 🎙️</p>
                </div>
                <div className="flex gap-2 items-center">
                    {canEdit && (
                        <>
                            <button
                                onClick={() => setIsAddFolderOpen(true)}
                                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                                title="New Folder"
                            >
                                <Plus size={20} />
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                                title="Add Voice Note"
                            >
                                <Mic size={20} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Folder Tabs */}
            <div className="mb-8 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                    {folders.map((folder) => (
                        <div key={folder} className="relative group">
                            <button
                                onClick={() => setActiveFolder(folder)}
                                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${activeFolder === folder
                                    ? 'bg-purple-500 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {folder}
                            </button>
                            {canEdit && folder !== 'All Notes' && folder !== 'Favorites' && (
                                <button
                                    onClick={() => handleDeleteFolder(folder)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete folder"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* List of Voice Notes */}
            <div className="space-y-4">
                {getNotesForFolder().length === 0 && (
                    <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                        <Mic size={48} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-400">
                            {activeFolder === 'All Notes' ? 'No voice notes added yet.' : `No notes in "${activeFolder}"`}
                        </p>
                    </div>
                )}

                {getNotesForFolder().map((note) => (
                    <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative group"
                    >
                        {canEdit && (
                            <div className="absolute -top-3 -right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditClick(note)}
                                    className="bg-white text-blue-500 p-2 rounded-full shadow-md hover:bg-blue-50"
                                    title="Edit title"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50"
                                    title="Remove note"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}

                        <SimpleVoicePlayer note={note} />
                    </motion.div>
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
                        onClick={!isUploading ? handleCloseModal : undefined}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">{modalTitle}</h3>
                                {!isUploading && (
                                    <button onClick={handleCloseModal}>
                                        <X size={24} className="text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                            </div>

                            {/* Mode Toggle */}
                            <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                                <button
                                    onClick={() => setUploadMode('playbackId')}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'playbackId' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
                                        }`}
                                >
                                    <Video size={14} />
                                    Mux ID
                                </button>
                                <button
                                    onClick={() => setUploadMode('file')}
                                    disabled={isUploading}
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'file' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
                                        }`}
                                >
                                    <Upload size={14} />
                                    Upload
                                </button>
                            </div>

                            {/* Playback ID Mode */}
                            {uploadMode === 'playbackId' && (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Enter a Mux Playback ID to add a voice note.
                                    </p>

                                    <input
                                        type="text"
                                        value={noteTitle}
                                        onChange={(e) => setNoteTitle(e.target.value)}
                                        placeholder="Title"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 mb-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />

                                    <input
                                        type="text"
                                        value={playbackIdInput}
                                        onChange={(e) => setPlaybackIdInput(e.target.value)}
                                        placeholder="Mux Playback ID"
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                    />

                                    <select
                                        value={selectedFolderForUpload}
                                        onChange={(e) => setSelectedFolderForUpload(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 mb-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        {folders.map(folder => (
                                            <option key={folder} value={folder}>{folder}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleAddPlaybackId}
                                        disabled={!playbackIdInput || !noteTitle}
                                        className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        Add Voice Note
                                    </button>
                                </>
                            )}

                            {/* File Upload Mode */}
                            {uploadMode === 'file' && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                                        <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center ${isUploading ? 'opacity-50' : 'cursor-pointer hover:border-indigo-500'}`}>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="audio-upload"
                                                disabled={isUploading}
                                            />
                                            <label htmlFor="audio-upload" className="cursor-pointer">
                                                {selectedFile ? (
                                                    <>
                                                        <Mic size={40} className="mx-auto text-indigo-600 mb-2" />
                                                        <p className="font-semibold text-gray-800 text-sm">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={40} className="mx-auto text-gray-400 mb-2" />
                                                        <p className="text-gray-600 text-sm">Click to upload audio</p>
                                                        <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A, FLAC</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <input
                                            type="text"
                                            value={noteTitle}
                                            onChange={(e) => setNoteTitle(e.target.value)}
                                            placeholder="Note title (optional)"
                                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <select
                                            value={selectedFolderForUpload}
                                            onChange={(e) => setSelectedFolderForUpload(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            {folders.map(folder => (
                                                <option key={folder} value={folder}>{folder}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Progress Bar */}
                                    {isUploading && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>{uploadStatusText}</span>
                                                <span>{Math.round(uploadProgress)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-full rounded-full transition-all"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleFileUpload}
                                        disabled={!selectedFile || isUploading}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Upload Voice Note
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Folder Modal */}
            <AnimatePresence>
                {isAddFolderOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsAddFolderOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">New Folder</h3>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddFolderOpen(false)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFolder}
                                    disabled={!newFolderName.trim()}
                                    className="flex-1 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingNote && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setEditingNote(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Voice Note</h3>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Title"
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingNote(null)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-2 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-colors"
                                >
                                    Save
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
