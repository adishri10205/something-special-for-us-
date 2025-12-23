import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MuxPlayer from '@mux/mux-player-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Heart, Share2, MoreHorizontal, Edit, Trash2, Plus, X, Video, Link as LinkIcon, Play, Loader2, Volume2, VolumeX, Instagram, MessageCircle, Send, Music } from 'lucide-react';
import EditModal from '../components/EditModal';
import { Reel } from '../types';

const Reels: React.FC = () => {
  const { reelsData, setReelsData, isAdmin } = useData();
  const { hasPermission } = useAuth();
  const canEdit = isAdmin || hasPermission('canEditReels');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Navigation / Scroll State
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');

  // Audio State
  const [isMuted, setIsMuted] = useState(true);

  // --- HELPERS ---
  const extractDriveId = (url: string) => {
    const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?.*id=)([-a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  };

  const extractInstagramId = (url: string) => {
    const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const extractYoutubeShortsId = (url: string) => {
    const match = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const extractMuxId = (url: string) => {
    // Matches stream.mux.com/PLAYBACK_ID.m3u8
    const streamMatch = url.match(/stream\.mux.com\/([a-zA-Z0-9]+)/);
    if (streamMatch) return streamMatch[1];

    // Check if it's a direct Mux playback ID (alphanumeric string, typically 20-60 chars)
    if (/^[a-zA-Z0-9]{15,60}$/.test(url.trim())) {
      return url.trim();
    }

    return null;
  };

  const isDirectVideoUrl = (url: string) => {
    // Check if it's a direct video file URL
    return /\.(mp4|webm|mov|avi|m3u8)(\?.*)?$/i.test(url);
  };

  // --- SCROLL HANDLER ---
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight } = containerRef.current;
      const index = Math.round(scrollTop / clientHeight);
      if (index !== activeIndex && index >= 0 && index < reelsData.length) {
        setActiveIndex(index);
      }
    }
  };

  // --- HANDLERS ---
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this reel?')) {
      setReelsData(reelsData.filter(r => r.id !== id));
    }
  };

  const handleUpdate = (id: string, updatedData: any) => {
    setReelsData(reelsData.map(r => r.id === id ? { ...r, ...updatedData } : r));
  };

  const handleAddReel = () => {
    if (!uploadUrl) return;

    // Check Instagram
    const instaId = extractInstagramId(uploadUrl);
    if (instaId) {
      const newReel: Reel = {
        id: `reel-${Date.now()}`,
        videoUrl: `https://www.instagram.com/reel/${instaId}/embed`,
        thumbnail: '',
        caption: uploadCaption,
        likes: 0
      };
      setReelsData([newReel, ...reelsData]);
      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadCaption('');
      return;
    }

    // Check Google Drive
    const driveId = extractDriveId(uploadUrl);
    if (driveId) {
      const newReel: Reel = {
        id: `reel-${Date.now()}`,
        videoUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
        thumbnail: `https://lh3.googleusercontent.com/d/${driveId}=w400-h400`,
        caption: uploadCaption,
        likes: 0
      };
      setReelsData([newReel, ...reelsData]);
      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadCaption('');
      return;
    }

    // Check YouTube Shorts
    const shortsId = extractYoutubeShortsId(uploadUrl);
    if (shortsId) {
      const newReel: Reel = {
        id: `reel-${Date.now()}`,
        videoUrl: `https://www.youtube.com/embed/${shortsId}`,
        thumbnail: `https://img.youtube.com/vi/${shortsId}/0.jpg`,
        caption: uploadCaption,
        likes: 0
      };
      setReelsData([newReel, ...reelsData]);
      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadCaption('');
      return;
    }

    // Check Mux (stream URL or direct playback ID)
    const muxId = extractMuxId(uploadUrl);
    if (muxId) {
      const newReel: Reel = {
        id: `reel-${Date.now()}`,
        videoUrl: `https://stream.mux.com/${muxId}.m3u8`,
        thumbnail: `https://image.mux.com/${muxId}/thumbnail.png`,
        caption: uploadCaption,
        likes: 0
      };
      setReelsData([newReel, ...reelsData]);
      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadCaption('');
      return;
    }

    // Check if it's a direct video URL (.mp4, .webm, etc.)
    if (isDirectVideoUrl(uploadUrl)) {
      const newReel: Reel = {
        id: `reel-${Date.now()}`,
        videoUrl: uploadUrl,
        thumbnail: '', // No thumbnail for direct URLs
        caption: uploadCaption,
        likes: 0
      };
      setReelsData([newReel, ...reelsData]);
      setIsUploadModalOpen(false);
      setUploadUrl('');
      setUploadCaption('');
      return;
    }

    alert("Invalid Link. Supported formats:\n• Instagram Reel URLs\n• Google Drive video links\n• YouTube Shorts URLs\n• Mux playback IDs or stream URLs\n• Direct video URLs (.mp4, .webm, .mov, .m3u8)");
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };


  return (
    <div className="h-screen w-full flex items-center justify-center md:p-4 md:pb-4 overflow-hidden relative bg-black md:bg-black/5">
      {/* Full screen on mobile, centered with padding on desktop */}

      {/* HEADER ACTIONS (ADMIN) - Hidden on mobile to avoid conflict with bottom menu */}
      <div className="hidden md:flex absolute top-4 right-4 z-50 flex-col gap-3">
        {canEdit && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="p-3 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition-all transform hover:scale-105"
            title="Add Reel Link"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full md:max-w-md overflow-y-auto snap-y snap-mandatory no-scrollbar md:rounded-2xl md:shadow-2xl md:border-4 md:border-white/20 bg-black scroll-smooth pb-24 md:pb-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 100px)' }}
      >
        {reelsData.map((reel, index) => {
          const isActive = index === activeIndex;
          const isInstagram = reel.videoUrl.includes('instagram.com');
          const driveId = extractDriveId(reel.videoUrl);
          const isDrive = !!driveId;
          const isYoutube = reel.videoUrl.includes('youtube.com') || reel.videoUrl.includes('youtu.be');
          const muxId = extractMuxId(reel.videoUrl);
          const isMux = !!muxId;

          return (
            <div key={reel.id} className="snap-start h-full w-full relative bg-black flex items-center justify-center group overflow-hidden">

              {/* THUMBNAIL BACKGROUND */}
              {(!isInstagram && !isYoutube && !isMux) && (
                <div className="absolute inset-0 bg-black">
                  <img
                    src={reel.thumbnail}
                    className="w-full h-full object-cover opacity-60 blur-md scale-110"
                    alt="bg"
                  />
                </div>
              )}

              {/* VIDEO PLAYER */}
              <div className="w-full h-full relative pointer-events-auto z-10 bg-black flex items-center justify-center">
                {isActive ? (
                  isInstagram ? (
                    <iframe
                      src={reel.videoUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      title="Instagram Reel"
                    />
                  ) : isDrive ? (
                    <iframe
                      src={`https://drive.google.com/file/d/${driveId}/preview`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title="Drive Video"
                    />
                  ) : isYoutube ? (
                    <iframe
                      src={`${reel.videoUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${reel.videoUrl.split('/').pop()}`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title="YouTube Short"
                    />
                  ) : isMux ? (
                    <MuxPlayer
                      playbackId={muxId}
                      streamType="on-demand"
                      autoPlay={true}
                      loop={true}
                      muted={isMuted}
                      className="w-full h-full object-cover"
                      style={{ height: '100%', width: '100%' }}
                      metadata={{ video_title: reel.caption || 'Reel' }}
                    />
                  ) : (
                    <VideoPlayer
                      src={reel.videoUrl || ''}
                      isMuted={isMuted}
                      poster={reel.thumbnail}
                    />
                  )
                ) : (
                  // Placeholder
                  isInstagram ? (
                    <div className="text-white/50 flex flex-col items-center gap-2">
                      <Instagram size={48} />
                      <span className="text-xs">Instagram Reel</span>
                    </div>
                  ) : isMux || isYoutube ? (
                    <div className="relative w-full h-full">
                      <img src={reel.thumbnail || `https://image.mux.com/${muxId}/thumbnail.png`} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={48} className="text-white/80 fill-white/20" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img src={reel.thumbnail} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={48} className="text-white/50 fill-white/20" />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Mute Button - Top Right Corner */}
              <button
                onClick={toggleMute}
                className="absolute top-4 right-4 z-50 p-3 bg-black/40 rounded-full text-white/90 backdrop-blur-sm hover:bg-black/60 transition-all pointer-events-auto"
              >
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>

              {/* Admin Controls */}
              {canEdit && (
                <div className="absolute top-16 right-4 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                  <button onClick={() => setEditingItem(reel)} className="bg-blue-600/80 p-2 rounded-full text-white hover:bg-blue-600 backdrop-blur-md shadow-md">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => handleDelete(reel.id)} className="bg-red-600/80 p-2 rounded-full text-white hover:bg-red-600 backdrop-blur-md shadow-md">
                    <Trash2 size={20} />
                  </button>
                </div>
              )}

              {/* Overlay UI - Instagram Style */}
              {!isInstagram && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-black/30 to-black/80 flex flex-col justify-end p-5 pb-32 md:pb-6 pointer-events-none z-20">
                  {/* Caption Section */}
                  <div className="text-white space-y-2 pointer-events-auto">
                    {reel.title && (
                      <h3 className="text-base font-bold drop-shadow-lg">
                        {reel.title}
                      </h3>
                    )}
                    {reel.caption && (
                      <p className="text-sm font-normal leading-relaxed drop-shadow-md line-clamp-2">
                        {reel.caption}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {reelsData.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/50 gap-4 p-8">
            <Video size={48} />
            <p>No reels yet. <br />Add a Drive Link or Instagram Reel!</p>
          </div>
        )}
      </div>

      <EditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdate}
        type="reels"
        data={editingItem}
      />

      {/* ADD LINK MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsUploadModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add Reel Link</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* URL Input */}
              <div className="mb-4">
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Video Link (Drive / Insta)</label>
                <div className="flex items-center bg-zinc-800 rounded-lg px-3 border border-zinc-700 focus-within:ring-2 focus-within:ring-rose-500">
                  <LinkIcon size={18} className="text-zinc-500 mr-2" />
                  <input
                    type="text"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="Paste link here..."
                    className="w-full bg-transparent text-white py-3 outline-none text-sm"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  * Supports Drive (anyone w/ link) or Instagram Reels.
                </p>
              </div>

              {/* Caption */}
              <div className="mb-6">
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Caption</label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full bg-zinc-800 border-zinc-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <button
                onClick={handleAddReel}
                disabled={!uploadUrl}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Reel
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div >
  );
};

// -- SUB COMPONENT FOR VIDEO HANDLING --
const VideoPlayer: React.FC<{ src: string, isMuted: boolean, poster: string }> = ({ src, isMuted, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
          // Usually due to interaction requirements if not muted
        });
      }
    }
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Loader2 className="animate-spin text-white/50" size={32} />
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        autoPlay
        poster={poster}
        onLoadedData={() => setIsLoading(false)}
        onClick={(e) => {
          e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause();
        }}
      />
    </div>
  );
};

export default Reels;