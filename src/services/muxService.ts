
// Update to use local proxy to avoid CORS
const MUX_API_BASE = '/api/mux';

// WARNING: In a real production app, these keys should NOT be exposed on the client.
// Requests should be proxied through a backend server.
const MUX_TOKEN_ID = import.meta.env.VITE_MUX_TOKEN_ID;
const MUX_SECRET_KEY = import.meta.env.VITE_MUX_SECRET_KEY;

// validate keys
if (!MUX_TOKEN_ID || !MUX_SECRET_KEY) {
    console.error("Mux Keys Missing in environment!");
}

const getAuthHeader = () => {
    if (!MUX_TOKEN_ID || !MUX_SECRET_KEY) {
        throw new Error("Missing Mux API Keys in environment variables");
    }
    return `Basic ${btoa(`${MUX_TOKEN_ID}:${MUX_SECRET_KEY}`)}`;
};

export interface MuxUploadConfig {
    file: File;
    onProgress?: (percent: number) => void;
}

export interface MuxAsset {
    uploadId: string;
    assetId?: string;
    playbackId?: string;
    status: 'waiting' | 'uploading' | 'processing' | 'ready' | 'error';
}

export const createMuxUpload = async (title?: string): Promise<{ uploadId: string; uploadUrl: string }> => {
    const response = await fetch(`${MUX_API_BASE}/uploads`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            new_asset_settings: {
                playback_policy: ['public'],
                passthrough: title || 'Voice Note',
                // mp4_support: 'standard' 
            },
            cors_origin: window.location.origin,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Mux create upload failed:", response.status, errorText);
        let message = 'Failed to create upload URL';
        try {
            const errorJson = JSON.parse(errorText);
            message = errorJson.error?.message || errorJson.message || message;
        } catch (e) { }
        throw new Error(message);
    }

    const data = await response.json();
    return {
        uploadId: data.data.id,
        uploadUrl: data.data.url,
    };
};

export const uploadFileToMux = async (uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type); // Optional but good practice

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percentComplete = (event.loaded / event.total) * 100;
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));

        xhr.send(file);
    });
};

export const getMuxUploadStatus = async (uploadId: string): Promise<any> => {
    const response = await fetch(`${MUX_API_BASE}/uploads/${uploadId}`, {
        headers: {
            'Authorization': getAuthHeader(),
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch upload status');
    }

    const data = await response.json();
    return data.data;
};

export const getMuxAsset = async (assetId: string): Promise<any> => {
    const response = await fetch(`${MUX_API_BASE}/assets/${assetId}`, {
        headers: {
            'Authorization': getAuthHeader(),
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch asset');
    }

    const data = await response.json();
    return data.data;
};
