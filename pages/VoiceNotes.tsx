import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Trash2, Mic, Play, Pause, ExternalLink } from 'lucide-react';
import { VoiceNote } from '../types';

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
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const isCurrent = activeId === note.id;
    const directUrl = getStreamUrl(note.url);

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
            // Wait for parent to update activeId, then this effect might not trigger play immediately 
            // but the next render with isCurrent=true will allow us to play if we trigger it.
            // Actually, better to just play if isCurrent matches, or set local state.
            // Simpler: If we are already current, just play. If not, parent switches us to current.
            // We need to react to isCurrent changing to true? No, easier to just handle click.
            if (audioRef.current) {
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error("Play failed", e));
            }
        }
    };

    // Effect to play when becoming active is tricky if we don't track "shouldPlay".
    // For now, let's just let the click handler handle the play call directly for the newly active item.
    // But since `onPlay` updates state in parent, we might re-render.

    // Improved Logic:
    // Parent keeps track of WHO is the active ID.
    // If activeId !== note.id, we MUST pause.
    // If activeId === note.id, we are ALLOWED to play, but user might have just paused us.
    // So `isPlaying` state is local.

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            if (duration === Infinity) {
                // Initial infinity fix for some streams
                audioRef.current.currentTime = 1e101;
                audioRef.current.ontimeupdate = () => {
                    audioRef.current!.ontimeupdate = () => handleTimeUpdate(); // restore normal handler
                    audioRef.current!.currentTime = 0;
                    setDuration(audioRef.current!.duration);
                }
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    // Fix: When parent switches activeId to THIS note, we want to auto-play ONLY if it was triggered by user click on THIS note.
    // The `togglePlay` handles the user interaction. 

    useEffect(() => {
        // If we became NOT active, pause.
        if (!isCurrent && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, [isCurrent]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${isCurrent ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-colors shadow-sm ${isCurrent && isPlaying ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                    {isCurrent && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800 truncate pr-2">{note.title}</h3>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{note.createdAt}</span>
                    </div>

                    <div className="mt-2 w-full">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-500">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 h-1 bg-gray-100 rounded-full">
                                <div
                                    className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full transition-all duration-100"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        {note.createdBy && (
                            <span className={`${note.createdBy === 'Aditya' ? 'text-blue-500' : 'text-rose-500'} font-medium flex items-center gap-1`}>
                                {note.createdBy === 'Aditya' ? '👦' : (note.createdBy === 'Shruti' ? '👧' : '🛡️')} {note.createdBy}
                            </span>
                        )}
                        <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-gray-400 hover:text-indigo-500 transition-colors"
                            title="Open Drive Link"
                        >
                            <ExternalLink size={14} />
                        </a>
                        {canEdit && (
                            <button
                                onClick={() => onDelete(note.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {directUrl && (
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
                        alert("Could not play audio. Please check if the Google Drive link is valid and public.");
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
    const [title, setTitle] = useState('');
    const [driveLink, setDriveLink] = useState('');

    // Playback State
    const [activeId, setActiveId] = useState<string | null>(null);

    // Identity Logic
    const userEmail = currentUser?.email?.toLowerCase() || '';
    const isAditya = userEmail.includes('aditya');
    const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');
    const authorName = isAditya ? 'Aditya' : (isShruti ? 'Shruti' : 'Admin');

    const extractDriveId = (url: string) => {
        if (!url) return null;
        const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?.*id=)([-a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
    };

    const getStreamUrl = (url: string) => {
        if (!url) return null;
        const id = extractDriveId(url);
        // Matches user's exact "Working" request format
        return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
    };

    const handleAddNote = () => {
        if (!title || !driveLink) return;

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

        setVoiceNotes([...voiceNotes, newNote]);
        setTitle('');
        setDriveLink('');
        setIsAddModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this voice note?")) {
            setVoiceNotes(voiceNotes.filter(n => n.id !== id));
            if (activeId === id) setActiveId(null);
        }
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
                        onClick={() => setIsAddModalOpen(false)}
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
                                <button onClick={() => setIsAddModalOpen(false)}>
                                    <X size={24} className="text-gray-400" />
                                </button>
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
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Google Drive Link</label>
                                    <input
                                        type="text"
                                        value={driveLink}
                                        onChange={e => setDriveLink(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="https://drive.google.com/..."
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Make sure link is 'Anyone with link'</p>
                                </div>

                                <button
                                    onClick={handleAddNote}
                                    disabled={!title || !driveLink}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-2"
                                >
                                    Save Note
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
