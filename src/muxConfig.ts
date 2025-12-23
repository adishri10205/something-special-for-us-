// Mux Configuration
// Documentation: https://docs.mux.com/

export const MUX_CONFIG = {
    // Asset ID - Used for video uploads and management
    assetId: 'M01WFwR4wk1IsHK5XRc01iI5R008K01vsjytVTF6ODGYFOw',

    // Environment Configuration (Production)
    environment: {
        id: 'sdgpmb',
        key: 'vk777i5883qtr7h23ulcvgj3b',
        name: 'Production'
    },

    // Playback Configuration
    playback: {
        // Stream URL format: https://stream.mux.com/{PLAYBACK_ID}.m3u8
        streamBaseUrl: 'https://stream.mux.com',

        // Thumbnail URL format: https://image.mux.com/{PLAYBACK_ID}/thumbnail.png
        thumbnailBaseUrl: 'https://image.mux.com'
    }
};

// Helper functions
export const getMuxStreamUrl = (playbackId: string) => {
    return `${MUX_CONFIG.playback.streamBaseUrl}/${playbackId}.m3u8`;
};

export const getMuxThumbnailUrl = (playbackId: string) => {
    return `${MUX_CONFIG.playback.thumbnailBaseUrl}/${playbackId}/thumbnail.png`;
};

export const getMuxPlayerUrl = (playbackId: string) => {
    return playbackId; // MuxPlayer component accepts just the playback ID
};
