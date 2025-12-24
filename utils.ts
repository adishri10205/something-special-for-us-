
import { CLOUDINARY_CONFIG } from './src/cloudinaryConfig';

/**
 * Generates an optimized Cloudinary URL
 */
export const getCloudinaryUrl = (publicId: string, options: { width?: number; quality?: string; blur?: number } = {}) => {
    if (!publicId) return '';
    const cloudName = CLOUDINARY_CONFIG.cloudName;
    const { width, quality = 'auto', blur } = options;

    let transformations = `f_auto,q_${quality}`;
    if (width) transformations += `,w_${width}`;
    if (blur) transformations += `,e_blur:${blur}`;

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
};

/**
 * Transforms various image URL formats into a direct displayable URL.
 * Handles Cloudinary Public IDs and legacy conversion.
 */
export const getOptimizedImageUrl = (
    image: { url?: string; publicId?: string } | string | undefined,
    width: number = 800
): string => {
    if (!image) return 'https://picsum.photos/400/300';

    // Handle object input (from GalleryImage)
    if (typeof image === 'object') {
        if (image.publicId) {
            return getCloudinaryUrl(image.publicId, { width });
        }
        if (image.url) {
            // Fallback to legacy URL handler
            return getLegacyOptimizedUrl(image.url);
        }
        return 'https://picsum.photos/400/300';
    }

    // Handle string input
    return getLegacyOptimizedUrl(image);
};

const getLegacyOptimizedUrl = (url: string): string => {
    if (!url) return 'https://picsum.photos/400/300';

    if (url.includes('drive.google.com') && url.includes('/folders/')) {
        return 'https://placehold.co/400x300?text=Folder+Link+Error';
    }

    const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?.*id=)([-a-zA-Z0-9_]+)/;
    const match = url.match(driveRegex);

    if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}=w2000-h2000`;
    }

    return url;
};
