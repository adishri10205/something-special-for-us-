import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Music as MusicIcon, Loader2, CheckCircle, XCircle, Copy, Trash2 } from 'lucide-react';
import * as UpChunk from '@mux/upchunk';

interface UploadedFile {
    id: string;
    type: 'video' | 'audio';
    filename: string;
    assetId?: string;
    playbackId?: string;
    uploadId?: string;
    status: 'uploading' | 'processing' | 'ready' | 'error';
    progress: number;
    error?: string;
    createdAt: Date;
}

const MuxUploader: React.FC = () => {
    const [uploads, setUploads] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [muxAccessToken, setMuxAccessToken] = useState('');
    const [muxSecretKey, setMuxSecretKey] = useState('');

    // Load credentials from environment variables on component mount
    useEffect(() => {
        const envToken = import.meta.env.VITE_MUX_TOKEN_ID;
        const envSecret = import.meta.env.VITE_MUX_SECRET_KEY;

        if (envToken) setMuxAccessToken(envToken);
        if (envSecret) setMuxSecretKey(envSecret);
    }, []);

    // Function to create Mux Direct Upload
    const createMuxUpload = async (type: 'video' | 'audio'): Promise<{ uploadUrl: string, assetId: string, uploadId: string }> => {
        // In production, this should be done on your backend
        // For demo purposes, showing the flow
        const response = await fetch('https://api.mux.com/video/v1/uploads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${muxAccessToken}:${muxSecretKey}`)}`
            },
            body: JSON.stringify({
                cors_origin: window.location.origin,
                new_asset_settings: {
                    playback_policy: ['public'],
                    mp4_support: type === 'video' ? 'standard' : 'none',
                    audio_only: type === 'audio'
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create Mux upload');
        }

        const data = await response.json();
        return {
            uploadUrl: data.data.url,
            assetId: data.data.asset_id,
            uploadId: data.data.id
        };
    };

    // Handle file selection and upload
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'audio') => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!muxAccessToken || !muxSecretKey) {
            alert('Please enter your Mux Access Token and Secret Key first!');
            return;
        }

        const uploadFile: UploadedFile = {
            id: Date.now().toString(),
            type,
            filename: file.name,
            status: 'uploading',
            progress: 0,
            createdAt: new Date()
        };

        setUploads(prev => [uploadFile, ...prev]);
        setIsUploading(true);

        try {
            // Create Mux upload
            const { uploadUrl, assetId, uploadId } = await createMuxUpload(type);

            // Update with asset info
            setUploads(prev => prev.map(u =>
                u.id === uploadFile.id
                    ? { ...u, assetId, uploadId }
                    : u
            ));

            // Upload file using UpChunk
            const upload = UpChunk.createUpload({
                endpoint: uploadUrl,
                file,
                chunkSize: 5120, // 5MB chunks
            });

            upload.on('error', (error) => {
                setUploads(prev => prev.map(u =>
                    u.id === uploadFile.id
                        ? { ...u, status: 'error', error: error.detail }
                        : u
                ));
                setIsUploading(false);
            });

            upload.on('progress', (progress) => {
                setUploads(prev => prev.map(u =>
                    u.id === uploadFile.id
                        ? { ...u, progress: progress.detail }
                        : u
                ));
            });

            upload.on('success', async () => {
                setUploads(prev => prev.map(u =>
                    u.id === uploadFile.id
                        ? { ...u, status: 'processing', progress: 100 }
                        : u
                ));

                // Poll for asset readiness
                pollAssetStatus(uploadFile.id, assetId);
            });

        } catch (error) {
            setUploads(prev => prev.map(u =>
                u.id === uploadFile.id
                    ? { ...u, status: 'error', error: (error as Error).message }
                    : u
            ));
            setIsUploading(false);
        }
    };

    // Poll Mux API to check if asset is ready
    const pollAssetStatus = async (uploadId: string, assetId: string) => {
        const maxAttempts = 30;
        let attempts = 0;

        const poll = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
                    headers: {
                        'Authorization': `Basic ${btoa(`${muxAccessToken}:${muxSecretKey}`)}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const asset = data.data;

                    if (asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0) {
                        const playbackId = asset.playback_ids[0].id;

                        setUploads(prev => prev.map(u =>
                            u.id === uploadId
                                ? { ...u, status: 'ready', playbackId }
                                : u
                        ));
                        clearInterval(poll);
                        setIsUploading(false);
                    } else if (asset.status === 'errored') {
                        setUploads(prev => prev.map(u =>
                            u.id === uploadId
                                ? { ...u, status: 'error', error: 'Asset processing failed' }
                                : u
                        ));
                        clearInterval(poll);
                        setIsUploading(false);
                    }
                }

                if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    setUploads(prev => prev.map(u =>
                        u.id === uploadId
                            ? { ...u, status: 'error', error: 'Timeout waiting for asset' }
                            : u
                    ));
                    setIsUploading(false);
                }
            } catch (error) {
                clearInterval(poll);
                setUploads(prev => prev.map(u =>
                    u.id === uploadId
                        ? { ...u, status: 'error', error: 'Failed to check asset status' }
                        : u
                ));
                setIsUploading(false);
            }
        }, 3000); // Poll every 3 seconds
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const deleteUpload = (id: string) => {
        if (confirm('Delete this upload?')) {
            setUploads(prev => prev.filter(u => u.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Mux Media Uploader</h2>
                <p className="text-gray-500 text-sm">Upload videos and audio files to Mux for streaming</p>
            </div>

            {/* Mux Credentials */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> Mux API Credentials
                </h3>
                <p className="text-xs text-yellow-700">
                    Get your credentials from <a href="https://dashboard.mux.com/settings/access-tokens" target="_blank" rel="noopener noreferrer" className="underline font-bold">Mux Dashboard</a>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Access Token ID</label>
                        <input
                            type="text"
                            value={muxAccessToken}
                            onChange={(e) => setMuxAccessToken(e.target.value)}
                            placeholder="Enter Mux Access Token..."
                            className="w-full p-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Secret Key</label>
                        <input
                            type="password"
                            value={muxSecretKey}
                            onChange={(e) => setMuxSecretKey(e.target.value)}
                            placeholder="Enter Mux Secret Key..."
                            className="w-full p-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileSelect(e, 'video')}
                        className="hidden"
                        disabled={isUploading || !muxAccessToken || !muxSecretKey}
                    />
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading || !muxAccessToken || !muxSecretKey
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                            }`}
                    >
                        <Video size={48} className="text-blue-600 mb-3" />
                        <h3 className="font-bold text-blue-800 mb-1">Upload Video</h3>
                        <p className="text-xs text-blue-600">Click to select video file</p>
                    </motion.div>
                </label>

                <label className="relative">
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileSelect(e, 'audio')}
                        className="hidden"
                        disabled={isUploading || !muxAccessToken || !muxSecretKey}
                    />
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading || !muxAccessToken || !muxSecretKey
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                            : 'bg-purple-50 border-purple-300 hover:bg-purple-100'
                            }`}
                    >
                        <MusicIcon size={48} className="text-purple-600 mb-3" />
                        <h3 className="font-bold text-purple-800 mb-1">Upload Audio</h3>
                        <p className="text-xs text-purple-600">Click to select audio file</p>
                    </motion.div>
                </label>
            </div>

            {/* Upload List */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-700">Uploads ({uploads.length})</h3>
                {uploads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Upload size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No uploads yet. Start by uploading a file above.</p>
                    </div>
                ) : (
                    uploads.map((upload) => (
                        <motion.div
                            key={upload.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border rounded-xl p-4 shadow-sm"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={`p-2 rounded-lg ${upload.type === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {upload.type === 'video' ? <Video size={20} /> : <MusicIcon size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 text-sm">{upload.filename}</h4>
                                        <p className="text-xs text-gray-500">{upload.type.toUpperCase()} • {upload.createdAt.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {upload.status === 'ready' && (
                                        <CheckCircle size={20} className="text-green-600" />
                                    )}
                                    {upload.status === 'error' && (
                                        <XCircle size={20} className="text-red-600" />
                                    )}
                                    {(upload.status === 'uploading' || upload.status === 'processing') && (
                                        <Loader2 size={20} className="text-blue-600 animate-spin" />
                                    )}
                                    <button
                                        onClick={() => deleteUpload(upload.id)}
                                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {upload.status === 'uploading' && (
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Uploading...</span>
                                        <span>{Math.round(upload.progress)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${upload.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Status Messages */}
                            {upload.status === 'processing' && (
                                <div className="bg-blue-50 text-blue-700 p-2 rounded text-xs">
                                    Processing... This may take a few minutes.
                                </div>
                            )}

                            {upload.status === 'error' && (
                                <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
                                    Error: {upload.error}
                                </div>
                            )}

                            {/* Playback ID */}
                            {upload.status === 'ready' && upload.playbackId && (
                                <div className="space-y-2">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <label className="block text-xs font-bold text-green-800 mb-1">Playback ID</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white p-2 rounded border text-xs font-mono text-gray-800 overflow-x-auto">
                                                {upload.playbackId}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(upload.playbackId!)}
                                                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Stream URL</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-white p-2 rounded border text-xs font-mono text-gray-800 overflow-x-auto">
                                                https://stream.mux.com/{upload.playbackId}.m3u8
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(`https://stream.mux.com/${upload.playbackId}.m3u8`)}
                                                className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                                title="Copy to clipboard"
                                            >
                                                <Copy size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MuxUploader;
