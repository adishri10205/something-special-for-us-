import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { Plus, X, Music, Trash2, User, Upload, Loader2, Link as LinkIcon, Play, Pause, Edit2, Video, Lock, ShieldCheck } from 'lucide-react';
import { Track } from '../types';
import { createMuxUpload, uploadFileToMux, getMuxUploadStatus, getMuxAsset } from '../src/services/muxService';
import { useAudio } from '../context/AudioContext';

// Simple Spotify Embed Component
const SpotifyEmbed = ({ link }: { link: string }) => {
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      // Handle standard open.spotify.com links
      if (urlObj.hostname === 'open.spotify.com') {
        const path = urlObj.pathname; // e.g., /track/12345 or /playlist/abcde
        return `https://open.spotify.com/embed${path}?utm_source=generator&theme=0`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const embedUrl = getEmbedUrl(link);

  if (!embedUrl) return null;

  return (
    <iframe
      style={{ borderRadius: '12px' }}
      src={embedUrl}
      width="100%"
      height="152"
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="shadow-lg mb-2"
    />
  );
};

// Simple Audio Player for Mux tracks
// Simple Audio Player for Mux tracks
const SimpleAudioPlayer = ({ track }: { track: Track }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration, seek } = useAudio();
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
    // Only seek if this track is the one playing
    if (!isCurrent) return;

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  // Local display progress (if this track is playing, show global progress, else 0)
  const displayProgress = isCurrent ? progress : 0;
  const displayDuration = isCurrent ? duration : 0; // Or track.duration if we parsed it, but mostly 0 until loaded

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/50 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
      {/* Decorative Gradient Bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

      <div className="flex items-center gap-4 relative z-10">
        {/* Cover / Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-50 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300 border border-white">
          <Music size={24} className="text-fuchsia-600 drop-shadow-sm" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-800 truncate text-lg leading-tight">{track.title}</h4>
          <p className="text-xs text-fuchsia-600/80 font-bold uppercase tracking-wider truncate mt-0.5">{track.artist}</p>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-gray-900/30 hover:bg-black group-hover:rotate-0"
        >
          {isThisPlaying ? (
            <Pause size={20} fill="currentColor" className="text-fuchsia-100" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-1 text-fuchsia-100" />
          )}
        </button>
      </div>

      {/* Progress Bar Area - Only show active progress/seek if current track */}
      <div className={`mt-5 flex items-center gap-3 transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-50 grayscale'}`}>
        <span className="text-[10px] text-gray-400 font-medium font-mono min-w-[32px] text-right">{formatTime(displayProgress)}</span>

        <div
          className={`flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative group/progress ${isCurrent ? 'cursor-pointer' : ''}`}
          onClick={handleSeek}
        >
          <div
            className="absolute inset-0 bg-gray-200 opacity-0 group-hover/progress:opacity-50 transition-opacity"
          />
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full relative transition-all duration-100 ease-linear"
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

const MusicPage: React.FC = () => {
  const { musicTracks, setMusicTracks, isAdmin, vaultPin } = useData();
  const { currentUser, hasPermission } = useAuth();
  const { setTitle, isMusicMode, setIsMusicMode } = useHeader();
  const canEdit = isAdmin || hasPermission('canEditMusic');

  // Folder/Playlist State
  const [folders, setFolders] = useState<string[]>(['All Songs', 'Favorites']);
  const [activeFolder, setActiveFolder] = useState('All Songs');
  const [trackFolders, setTrackFolders] = useState<Record<string, string>>({});
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'spotify' | 'file' | 'playbackId'>('spotify');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [playbackIdInput, setPlaybackIdInput] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState('All Songs');

  // Edit State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  // Lock Screen State for Exiting Music Mode
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Determine current user identity for tagging
  const userEmail = currentUser?.email?.toLowerCase() || '';
  const isAditya = userEmail.includes('aditya');
  const isShruti = userEmail.includes('adishri') || userEmail.includes('shruti');

  // Tag to save with the track
  const currentTagger = isAditya ? 'aditya' : (isShruti ? 'shruti' : 'unknown');

  // Display text for the Modal
  const modalTitle = isAditya ? 'Add Music for Shruti ❤️' : (isShruti ? 'Add Music for Aditya 🎸' : 'Add Song');

  useEffect(() => {
    setTitle('Music');
  }, [setTitle]);

  // Trap Back Button in Music Mode
  useEffect(() => {
    if (isMusicMode) {
      // Push state to prevent immediate back navigation
      window.history.pushState(null, '', window.location.href);

      const handlePopState = (event: PopStateEvent) => {
        // Prevent back navigation by pushing state again
        window.history.pushState(null, '', window.location.href);
        // Show lock modal safely if not already open
        if (!isLockModalOpen) {
          setIsLockModalOpen(true);
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isMusicMode, isLockModalOpen]);

  // Get tracks for active folder
  const getTracksForFolder = () => {
    if (activeFolder === 'All Songs') {
      return musicTracks;
    }
    return musicTracks.filter(track => trackFolders[track.id] === activeFolder);
  };

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    if (folders.includes(newFolderName)) {
      alert('Playlist already exists!');
      return;
    }
    setFolders([...folders, newFolderName]);
    setNewFolderName('');
    setIsAddFolderOpen(false);
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === 'All Songs' || folderName === 'Favorites') {
      alert('Cannot delete default playlists');
      return;
    }
    if (window.confirm(`Delete playlist "${folderName}"?`)) {
      setFolders(folders.filter(f => f !== folderName));
      // Remove folder assignments for tracks in this folder
      const newTrackFolders = { ...trackFolders };
      Object.keys(newTrackFolders).forEach(trackId => {
        if (newTrackFolders[trackId] === folderName) {
          delete newTrackFolders[trackId];
        }
      });
      setTrackFolders(newTrackFolders);
      if (activeFolder === folderName) {
        setActiveFolder('All Songs');
      }
    }
  };

  const handleAddSpotifyLink = () => {
    if (!spotifyLink) return;

    // Basic check for Spotify URL
    if (!spotifyLink.includes('open.spotify.com')) {
      alert('Please enter a valid Spotify link (e.g., https://open.spotify.com/track/...)');
      return;
    }

    const newTrack: Track = {
      id: `spotify-${Date.now()}`,
      title: 'Spotify Track',
      artist: 'Spotify',
      duration: '0:00',
      cover: '',
      url: spotifyLink,
      addedBy: currentTagger
    };

    setMusicTracks([...musicTracks, newTrack]);

    // Assign to folder if not "All Songs"
    if (selectedFolderForUpload !== 'All Songs') {
      setTrackFolders({ ...trackFolders, [newTrack.id]: selectedFolderForUpload });
    }

    setSpotifyLink('');
    setSpotifyLink('');
    setIsAddModalOpen(false);
  };

  const handleAddPlaybackId = () => {
    if (!playbackIdInput.trim()) return;

    const newTrack: Track = {
      id: `mux-${Date.now()}`,
      title: trackTitle || `Mux Track ${playbackIdInput.slice(0, 5)}`,
      artist: trackArtist || 'Unknown Artist',
      duration: '0:00',
      cover: '',
      url: `https://stream.mux.com/${playbackIdInput}.m3u8`,
      addedBy: currentTagger
    };

    setMusicTracks([...musicTracks, newTrack]);

    if (selectedFolderForUpload !== 'All Songs') {
      setTrackFolders({ ...trackFolders, [newTrack.id]: selectedFolderForUpload });
    }

    setPlaybackIdInput('');
    setTrackTitle('');
    setTrackArtist('');
    setIsAddModalOpen(false);
  };

  const handleEditClick = (track: Track) => {
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
  };

  const handleSaveEdit = () => {
    if (!editingTrack) return;

    const updatedTracks = musicTracks.map(t =>
      t.id === editingTrack.id
        ? { ...t, title: editTitle, artist: editArtist }
        : t
    );

    setMusicTracks(updatedTracks);
    setEditingTrack(null);
    setEditTitle('');
    setEditTitle('');
    setEditArtist('');
  };

  const handleToggleMusicMode = () => {
    if (isMusicMode) {
      // If currently ON, open Lock Modal to confirm exit
      setIsLockModalOpen(true);
    } else {
      // Turn ON directly
      setIsMusicMode(true);
    }
  };

  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        // Verify against user's MPIN, fallback to Vault PIN if no MPIN set (though unlikely if logged in)
        const correctPin = currentUser?.mpin || vaultPin;

        if (newPin === correctPin) {
          setTimeout(() => {
            setIsMusicMode(false);
            setIsLockModalOpen(false);
            setPin('');
          }, 200);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPin('');
            setPinError(false);
          }, 500);
        }
      }
    }
  };

  const clearPin = () => {
    setPin('');
    setPinError(false);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadStatusText('Initializing upload...');

      // 1. Create Upload URL
      const finalTitle = (trackTitle || selectedFile.name) + " - Music";
      const { uploadId, uploadUrl } = await createMuxUpload({ audioOnly: true, title: finalTitle });

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

      // 5. Create Track
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        title: trackTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
        artist: trackArtist || currentUser?.displayName || 'Unknown Artist',
        duration: '0:00',
        cover: '',
        url: `https://stream.mux.com/${playbackId}.m3u8`,
        addedBy: currentTagger
      };

      setMusicTracks([...musicTracks, newTrack]);

      // Assign to folder if not "All Songs"
      if (selectedFolderForUpload !== 'All Songs') {
        setTrackFolders({ ...trackFolders, [newTrack.id]: selectedFolderForUpload });
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
    setSpotifyLink('');
    setPlaybackIdInput('');
    setSelectedFile(null);
    setTrackTitle('');
    setTrackArtist('');
    setUploadProgress(0);
    setIsUploading(false);
    setUploadMode('spotify');
    setUploadStatusText('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Remove this track?')) {
      setMusicTracks(musicTracks.filter(t => t.id !== id));
    }
  };

  const isSpotifyTrack = (track: Track) => {
    return track.url?.includes('spotify.com') || track.id.startsWith('spotify-');
  };

  return (
    <div className="min-h-screen p-6 md:p-12 pb-32 max-w-2xl mx-auto">

      {/* Header + Add Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-4xl font-script text-gray-800">Our Vibe</h2>
          <p className="text-gray-500 text-sm mt-1">Songs that remind me of you</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Music Mode Toggle */}
          <button
            onClick={handleToggleMusicMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all ${isMusicMode
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-white text-gray-600 hover:bg-rose-50'
              }`}
          >
            {isMusicMode ? <Lock size={16} /> : <Music size={16} />}
            {isMusicMode ? 'Exit Mode' : 'Music Mode'}
          </button>

          {canEdit && (
            <>
              <button
                onClick={() => setIsAddFolderOpen(true)}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                title="New Playlist"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                title="Add Track"
              >
                <Music size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Folder/Playlist Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {folders.map((folder) => (
            <div key={folder} className="relative group">
              <button
                onClick={() => setActiveFolder(folder)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${activeFolder === folder
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {folder}
              </button>
              {canEdit && folder !== 'All Songs' && folder !== 'Favorites' && (
                <button
                  onClick={() => handleDeleteFolder(folder)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete playlist"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* List of Tracks */}
      <div className="space-y-8">
        {getTracksForFolder().length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
            <Music size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400">
              {activeFolder === 'All Songs' ? 'No songs added yet.' : `No songs in "${activeFolder}"`}
            </p>
          </div>
        )}

        {getTracksForFolder().map((track) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >


            {canEdit && (
              <div className="absolute -top-3 -right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(track)}
                  className="bg-white text-blue-500 p-2 rounded-full shadow-md hover:bg-blue-50"
                  title="Edit details"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(track.id)}
                  className="bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50"
                  title="Remove track"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Render Spotify Embed or Audio Player */}
            {isSpotifyTrack(track) ? (
              <SpotifyEmbed link={track.url || ''} />
            ) : (
              <SimpleAudioPlayer track={track} />
            )}
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
                  onClick={() => setUploadMode('spotify')}
                  disabled={isUploading}
                  className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'spotify' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
                    }`}
                >
                  <LinkIcon size={14} />
                  Spotify
                </button>
                <button
                  onClick={() => setUploadMode('playbackId')}
                  disabled={isUploading}
                  className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'playbackId' ? 'bg-white text-pink-600 shadow' : 'text-gray-600'
                    }`}
                >
                  <Video size={14} />
                  Mux ID
                </button>
                <button
                  onClick={() => setUploadMode('file')}
                  disabled={isUploading}
                  className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-2 ${uploadMode === 'file' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
                    }`}
                >
                  <Upload size={14} />
                  File
                </button>
              </div>

              {/* Spotify Link Mode */}
              {uploadMode === 'spotify' && (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Paste a Spotify link to share a song with {isAditya ? 'Shruti' : 'Aditya'}.
                  </p>

                  <input
                    type="text"
                    value={spotifyLink}
                    onChange={(e) => setSpotifyLink(e.target.value)}
                    placeholder="Paste Spotify Link here..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                  />

                  <button
                    onClick={handleAddSpotifyLink}
                    disabled={!spotifyLink}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Add to Playlist
                  </button>
                </>
              )}

              {/* Playback ID Mode */}
              {uploadMode === 'playbackId' && (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter a Mux Playback ID to add a stream directly.
                  </p>

                  <input
                    type="text"
                    value={playbackIdInput}
                    onChange={(e) => setPlaybackIdInput(e.target.value)}
                    placeholder="Mux Playback ID"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:ring-2 focus:ring-pink-500 outline-none font-mono text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <input
                      type="text"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <input
                      type="text"
                      value={trackArtist}
                      onChange={(e) => setTrackArtist(e.target.value)}
                      placeholder="Artist"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  <select
                    value={selectedFolderForUpload}
                    onChange={(e) => setSelectedFolderForUpload(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 mb-4 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                  >
                    {folders.map(folder => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddPlaybackId}
                    disabled={!playbackIdInput}
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Add Mux Track
                  </button>
                </>
              )}

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audio File</label>
                    <div className={`border-2 border-dashed border-gray-300 rounded-xl p-6 text-center ${isUploading ? 'opacity-50' : 'cursor-pointer hover:border-purple-500'}`}>
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
                            <Music size={40} className="mx-auto text-purple-600 mb-2" />
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
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      placeholder="Track title (optional)"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <input
                      type="text"
                      value={trackArtist}
                      onChange={(e) => setTrackArtist(e.target.value)}
                      placeholder="Artist name (optional)"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <select
                      value={selectedFolderForUpload}
                      onChange={(e) => setSelectedFolderForUpload(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
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
                          className="bg-purple-600 h-full rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Upload to Mux
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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAddFolderOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Create Playlist</h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Playlist name..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleAddFolder()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddFolderOpen(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Track Modal */}
      <AnimatePresence>
        {editingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingTrack(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Details</h3>
                <button onClick={() => setEditingTrack(null)}>
                  <X size={24} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                  <input
                    type="text"
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditingTrack(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music Mode Unlock Modal */}
      <AnimatePresence>
        {isLockModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-600" />

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Security Check</h2>
                <p className="text-gray-500 text-sm mt-1">Enter PIN to exit Music Mode</p>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-rose-500 scale-110' : 'bg-gray-200'
                      } ${pinError ? 'animate-bounce bg-red-500' : ''}`}
                  />
                ))}
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="w-14 h-14 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-rose-100 active:text-rose-600 transition-colors mx-auto"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinInput('0')}
                  className="w-14 h-14 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-rose-100 active:text-rose-600 transition-colors mx-auto"
                >
                  0
                </button>
                <button
                  onClick={clearPin}
                  className="w-14 h-14 rounded-full text-rose-500 hover:bg-rose-50 font-bold text-xs flex items-center justify-center mx-auto"
                >
                  CLR
                </button>
              </div>

              <button
                onClick={() => setIsLockModalOpen(false)}
                className="w-full py-3 mt-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
              >
                Cancel / Stay in Music Mode
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default MusicPage;
