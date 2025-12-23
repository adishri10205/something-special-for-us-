import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MuxPlayer from '@mux/mux-player-react';
import * as UpChunk from '@mux/upchunk';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Trash2, Mic, Play, Pause, ExternalLink, Upload, Loader2, Music as MusicIcon, Link as LinkIcon } from 'lucide-react';
import { VoiceNote } from '../types';
import { createMuxUpload, getMuxAsset, getMuxUploadStatus } from '../src/services/muxService';

const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

interface VoiceNoteItemProps {
    note: VoiceNote;
    activeId: string | null;
    onPlay: (id: string) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    getStreamUrl: (url: string) => string | null;
}

const VoiceNoteItem: React.FC<VoiceNoteItemProps> = ({ note, activeId, onPlay, onDelete, canEdit, getStreamUrl }) => {
    // Custom Player State (Legacy Drive Link)
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const isCurrent = activeId === note.id;
    const directUrl = note.url ? getStreamUrl(note.url) : null;

    // --- Legacy Player Logic ---
    useEffect(() => {
        if (!isCurrent && isPlaying) {
            setIsPlaying(false);
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
            setCurrentTime(0);
        }
    }, [activeId, isPlaying, isCurrent]);

    const togglePlay = () => {
        if (isCurrent && isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            onPlay(note.id);
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Play failed", e));
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            if (duration === Infinity) {
                audioRef.current.currentTime = 1e101;
                audioRef.current.ontimeupdate = () => {
                    audioRef.current!.ontimeupdate = () => handleTimeUpdate();
                    audioRef.current!.currentTime = 0;
                    setDuration(audioRef.current!.duration);
                }
            }
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;

        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        audioRef.current.currentTime = percent * duration;
        setCurrentTime(percent * duration);
    };

    useEffect(() => {
        if (!isCurrent && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isCurrent]);

    // --- Render ---

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="group relative bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300"
        >
            {/* Decorative Gradient Bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

            <div className="flex items-center gap-4 relative z-10">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 flex items-center justify-center shadow-inner border border-white">
                    {note.muxPlaybackId ? (
                        <MusicIcon size={24} className="text-fuchsia-600 drop-shadow-sm" />
                    ) : (
                        <Mic size={24} className="text-violet-600 drop-shadow-sm" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 truncate text-lg leading-tight">{note.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${note.createdBy === 'Aditya' ? 'text-blue-500' : (note.createdBy === 'Shruti' ? 'text-pink-500' : 'text-gray-500')}`}>
                            {note.createdBy}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">• {note.createdAt}</span>
                    </div>
                </div>

                {/* Actions (Absolute Top Right on Hover, or Inline) */}
                <div className="flex items-center gap-2">
                    {/* External Link */}
                    {note.url && (
                        <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                            title="Open Link"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}

                    {/* Play Button (Only for Drive Links since Mux has its own) */}
                    {!note.muxPlaybackId && (
                        <button
                            onClick={togglePlay}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isCurrent && isPlaying
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-900 text-white hover:bg-black'
                                }`}
                        >
                            {isCurrent && isPlaying ? (
                                <Pause size={20} fill="currentColor" className="text-fuchsia-100" />
                            ) : (
                                <Play size={20} fill="currentColor" className="ml-1 text-fuchsia-100" />
                            )}
                        </button>
                    )}

                    {/* Delete Action (Top right absolute) */}
                    {canEdit && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onDelete(note.id)}
                                className="p-2 bg-white/90 backdrop-blur text-red-500 hover:bg-red-50 rounded-full shadow-sm"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Progress Bar or Mux Player */}
            <div className="mt-5">
                {note.muxPlaybackId ? (
                    <div className="rounded-xl overflow-hidden shadow-sm border border-fuchsia-100/50">
                        <MuxPlayer
                            streamType="on-demand"
                            playbackId={note.muxPlaybackId}
                            audio
                            style={{
                                height: '48px',
                                width: '100%',
                                '--media-primary-color': '#d946ef',
                                '--media-secondary-color': '#ffffff',
                                '--media-control-bar-height': '48px',
                                '--media-font-family': 'inherit',
                            } as React.CSSProperties}
                            primaryColor="#d946ef"
                            secondaryColor="#ffffff"
                        />
                    </div>
                ) : (
                    /* Legacy Player Custom Progress Bar */
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-medium font-mono min-w-[32px] text-right">{formatTime(currentTime)}</span>

                        <div
                            className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative group/slider cursor-pointer"
                            onClick={handleSeek}
                        >
                            <div className="absolute inset-0 bg-gray-200 opacity-0 group-hover/slider:opacity-50 transition-opacity" />
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full relative transition-all duration-100 ease-linear"
                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/slider:opacity-100 transition-opacity translate-x-1" />
                            </div>
                        </div>

                        <span className="text-[10px] text-gray-400 font-medium font-mono min-w-[32px]">{formatTime(duration)}</span>
                    </div>
                )}
            </div>

            {directUrl && !note.muxPlaybackId && (
                <audio
                    ref={audioRef}
                    src={directUrl}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => { setIsPlaying(true); onPlay(note.id); }}
                    onError={(e) => {
                        console.error("Audio playback error:", e);
                        setIsPlaying(false);
                    }}
                />
            )}
        </motion.div>
    );
};

const VoiceNotes: React.FC = () => {
    const { voiceNotes, setVoiceNotes } = useData();
    const { currentUser, hasPermission } = useAuth();
    const canEdit = hasPermission('canEditVoiceNotes');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [uploadMode, setUploadMode] = useState<'file' | 'link' | 'mux_id'>('file');
    const [title, setTitle] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [muxIdInput, setMuxIdInput] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');

    const [activeId, setActiveId] = useState<string | null>(null);

    // Identity Logic
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const isAditya = userEmail.includes('aditya');
    const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');
    const authorName = isAditya ? 'Aditya' : (isShruti ? 'Shruti' : 'Admin');

    const extractDriveId = (url: string) => {
        const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?.*id=)([-a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
    };

    const getStreamUrl = (url: string) => {
        const id = extractDriveId(url);
        return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const pollProcessing = async (uploadId: string, initialAssetId: string | undefined, noteTitle: string) => {
        setProcessingStatus('processing');
        console.log("Switching to processing state. Upload ID:", uploadId, "Initial Asset ID:", initialAssetId);

        const maxAttempts = 60; // 3 minutes timeout
        let attempts = 0;
        let currentAssetId = initialAssetId;

        const interval = setInterval(async () => {
            attempts++;
            console.log(`Polling attempt ${attempts}... Current Asset ID: ${currentAssetId || 'Not found yet'}`);

            try {
                // Stage 1: Get Asset ID if we don't have it yet
                if (!currentAssetId) {
                    const uploadStatus = await getMuxUploadStatus(uploadId);
                    console.log("Mux Upload Status:", uploadStatus);

                    if (uploadStatus.asset_id) {
                        currentAssetId = uploadStatus.asset_id;
                        console.log("Asset ID found:", currentAssetId);
                    } else if (attempts > maxAttempts) {
                        clearInterval(interval);
                        setProcessingStatus('error');
                        console.error("Timed out waiting for Asset ID to appear in upload status.");
                        alert("Timed out waiting for Asset ID.");
                        return;
                    }
                }

                // Stage 2: Poll Asset for Readiness
                if (currentAssetId) {
                    const asset = await getMuxAsset(currentAssetId);
                    console.log("Mux Asset Status:", asset.status, asset);

                    if (asset.status === 'ready' && asset.playback_ids?.[0]) {
                        clearInterval(interval);
                        setProcessingStatus('ready');
                        console.log("Asset ready! Creating voice note.");

                        // Create Note
                        const newNote: VoiceNote = {
                            id: `vn-${Date.now()}`,
                            title: noteTitle,
                            muxPlaybackId: asset.playback_ids[0].id,
                            muxAssetId: currentAssetId,
                            duration: asset.duration,
                            createdAt: new Date().toLocaleDateString(),
                            createdBy: authorName
                        };
                        setVoiceNotes(prev => [newNote, ...prev]);
                        resetForm();
                    } else if (asset.status === 'errored') {
                        clearInterval(interval);
                        setProcessingStatus('error');
                        console.error("Asset processing failed:", asset.errors);
                        alert("Media processing failed.");
                    }
                }
            } catch (e) {
                console.error("Polling error in attempt " + attempts, e);
            }

            if (attempts > maxAttempts * 2) {
                clearInterval(interval);
                setProcessingStatus('error');
                console.error("Global polling timeout reached.");
                alert("Processing timed out.");
            }
        }, 3000);
    };

    const handleUpload = async () => {
        if (!title) return;

        if (uploadMode === 'mux_id') {
            if (!muxIdInput) return;

            const newNote: VoiceNote = {
                id: `vn-${Date.now()}`,
                title,
                muxPlaybackId: muxIdInput,
                createdAt: new Date().toLocaleDateString(),
                createdBy: authorName
            };
            setVoiceNotes([newNote, ...voiceNotes]);
            resetForm();
            return;
        }

        if (uploadMode === 'link') {
            if (!driveLink) return;
            const streamUrl = getStreamUrl(driveLink);
            if (!streamUrl) {
                alert("Please enter a valid Google Drive Link");
                return;
            }
            const newNote: VoiceNote = {
                id: `vn-${Date.now()}`,
                title,
                url: driveLink,
                createdAt: new Date().toLocaleDateString(),
                createdBy: authorName
            };
            setVoiceNotes([newNote, ...voiceNotes]);
            resetForm();
            return;
        }

        // Mux Upload
        if (!selectedFile) return;
        setIsUploading(true);
        setProcessingStatus('uploading');

        try {
            const finalTitle = (title || selectedFile.name) + " - Voice Note";
            const { uploadUrl, assetId, uploadId } = await createMuxUpload({ audioOnly: true, title: finalTitle });

            // Note: assetId might be undefined initially for direct uploads, which is fine.
            // We will fetch it during polling if needed.

            const upload = UpChunk.createUpload({
                endpoint: uploadUrl,
                file: selectedFile,
                chunkSize: 5120, // 5MB
            });

            upload.on('progress', (progress) => {
                setUploadProgress(progress.detail);
            });

            upload.on('success', () => {
                setUploadProgress(100);
                pollProcessing(uploadId, assetId, title);
            });

            upload.on('error', (err) => {
                setIsUploading(false);
                setProcessingStatus('error');
                console.error(err);
                alert("Upload failed.");
            });

        } catch (e: any) {
            console.error("Upload Error:", e);
            setIsUploading(false);
            setProcessingStatus('error');
            alert(`Failed to create upload session: ${e.message || 'Unknown error'}`);
        }
    };

    const resetForm = () => {
        setIsAddModalOpen(false);
        setTitle('');
        setDriveLink('');
        setMuxIdInput('');
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
        setProcessingStatus('idle');
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this voice note?")) {
            setVoiceNotes(voiceNotes.filter(n => n.id !== id));
            if (activeId === id) setActiveId(null);
        }
    };

    const isFormValid = () => {
        if (!title) return false;
        if (isUploading) return false;
        if (uploadMode === 'file') return !!selectedFile;
        if (uploadMode === 'link') return !!driveLink;
        if (uploadMode === 'mux_id') return !!muxIdInput;
        return false;
    };

    return (
        <div className="min-h-screen p-6 md:p-12 pb-32 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-4xl font-script text-gray-800">Voice Notes</h2>
                    <p className="text-gray-500 mt-2">Little echoes of our conversations 🎙️</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-transform hover:scale-105"
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
                    <VoiceNoteItem
                        key={note.id}
                        note={note}
                        activeId={activeId}
                        onPlay={setActiveId}
                        onDelete={handleDelete}
                        canEdit={canEdit}
                        getStreamUrl={getStreamUrl}
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
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => !isUploading && resetForm()}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">New Voice Note</h3>
                                {!isUploading && (
                                    <button onClick={resetForm}>
                                        <X size={24} className="text-gray-400" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. Late night thoughts..."
                                        disabled={isUploading}
                                    />
                                </div>

                                {/* Tabs */}
                                <div className="bg-gray-100 p-1 rounded-xl flex mb-4">
                                    <button
                                        onClick={() => setUploadMode('file')}
                                        disabled={isUploading}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'file' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Upload size={16} /> File Upload
                                    </button>
                                    <button
                                        onClick={() => setUploadMode('link')}
                                        disabled={isUploading}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'link' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <LinkIcon size={16} /> Drive Link
                                    </button>
                                    <button
                                        onClick={() => setUploadMode('mux_id')}
                                        disabled={isUploading}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${uploadMode === 'mux_id' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Play size={16} /> Mux ID
                                    </button>
                                </div>

                                {uploadMode === 'file' && (
                                    /* File Input */
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white hover:border-indigo-300 transition-colors">
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            id="audio-upload"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            disabled={isUploading}
                                        />
                                        <label htmlFor="audio-upload" className="cursor-pointer block">
                                            {selectedFile ? (
                                                <div className="text-indigo-600 font-bold flex flex-col items-center">
                                                    <MusicIcon size={32} className="mb-2" />
                                                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                                    <span className="text-xs text-gray-500 font-normal">Click to change</span>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 flex flex-col items-center">
                                                    <Upload size={32} className="mb-2" />
                                                    <span className="font-medium">Click to select Audio</span>
                                                    <span className="text-xs mt-1">MP3, WAV, M4A supported</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}

                                {uploadMode === 'link' && (
                                    /* Link Input */
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Google Drive Link</label>
                                        <input
                                            type="text"
                                            value={driveLink}
                                            onChange={e => setDriveLink(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="https://drive.google.com/..."
                                        />
                                    </div>
                                )}

                                {uploadMode === 'mux_id' && (
                                    /* Mux ID Input */
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mux Playback ID</label>
                                        <input
                                            type="text"
                                            value={muxIdInput}
                                            onChange={e => setMuxIdInput(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Enter Mux Playback ID..."
                                        />
                                    </div>
                                )}

                                {/* Status / Progress */}
                                {processingStatus !== 'idle' && (
                                    <div className="bg-indigo-50 rounded-xl p-4">
                                        <div className="flex justify-between text-xs font-bold text-indigo-800 mb-2">
                                            <span className="capitalize">{processingStatus === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                                            <span>{Math.round(uploadProgress)}%</span>
                                        </div>
                                        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        {processingStatus === 'processing' && (
                                            <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" /> Preparing media for playback...
                                            </p>
                                        )}
                                    </div>
                                )}


                                <button
                                    onClick={handleUpload}
                                    disabled={!isFormValid()}
                                    className={`w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2`}
                                >
                                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : (uploadMode === 'file' ? 'Upload & Save' : 'Save Note')}
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
