import { CLOUDINARY_CONFIG } from '../cloudinaryConfig';

interface CloudinaryUploadResponse {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    created_at: string;
    error?: { message: string };
    resource_type?: string;
    thumbnail_url?: string;
}

const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        // If not an image, return original
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if larger than 1920px
            const MAX_DIMENSION = 1920;

            if (width > height) {
                if (width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                }
            } else {
                if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file); // Fallback
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Only use compressed if it's actually smaller
                    if (newFile.size < file.size) {
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                },
                'image/jpeg',
                0.8 // 80% quality
            );
        };

        img.onerror = () => resolve(file);
        reader.onerror = () => resolve(file);

        reader.readAsDataURL(file);
    });
};

export const uploadToCloudinary = async (file: File, folder: string = 'gallery', resourceType: 'image' | 'video' | 'auto' = 'auto'): Promise<CloudinaryUploadResponse> => {
    // 1. Compress image before uploading (ONLY if it is an image)
    let fileToUpload = file;
    try {
        if (file.type.startsWith('image/')) {
            fileToUpload = await compressImage(file);
        }
    } catch (err) {
        console.warn('Image compression failed, using original file', err);
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

    // Folder Logic
    // If folder is 'reels', store in root 'reels'.
    // If folder is 'gallery' or empty, store in 'gallery' (or 'All').
    // Otherwise, check if we should prepend gallery.
    let finalFolder = folder;
    if (folder === 'reels') {
        finalFolder = 'reels';
    } else if (folder !== 'gallery' && !folder.startsWith('gallery/') && folder !== 'reels') {
        // Default behavior for gallery subfolders
        finalFolder = `gallery/${folder}`;
    }

    formData.append('folder', finalFolder);

    // Tags
    if (folder === 'reels') {
        formData.append('tags', 'easebook_reels,reels');
    } else if (folder === 'music') {
        formData.append('tags', 'easebook_music,music');
    } else {
        formData.append('tags', 'easebook_gallery,gallery');
    }

    // IMPORTANT: Defaults to 'auto' to handle images AND videos cleanly
    const endpointType = resourceType === 'auto' ? 'auto' : resourceType;

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${endpointType}/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("Cloudinary Upload Error Details:", data);
        throw new Error(data.error?.message || 'Upload failed');
    }

    return data;
};
