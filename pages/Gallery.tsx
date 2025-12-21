import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { X, ChevronLeft, ChevronRight, Upload, Plus, Trash2, Loader2, FolderInput, RefreshCw, Images, CheckCircle, Edit3 } from 'lucide-react';
import { getOptimizedImageUrl, getCloudinaryUrl } from '../utils';
import { GalleryImage } from '../types';
import { uploadToCloudinary } from '../src/services/uploadService';
import { CLOUDINARY_CONFIG } from '../src/cloudinaryConfig';

const Gallery: React.FC = () => {
  const { galleryImages, setGalleryImages, isAdmin } = useData();
  const [selectedDisplayIndex, setSelectedDisplayIndex] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [movingItem, setMovingItem] = useState<GalleryImage | null>(null);

  // State Ref for stable access
  const galleryImagesRef = useRef(galleryImages);
  useEffect(() => {
    galleryImagesRef.current = galleryImages;
  }, [galleryImages]);

  // Navigation State
  const [viewMode, setViewMode] = useState<'folders' | 'grid'>('folders'); // Default to folder view
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [customFolders, setCustomFolders] = useState<Set<string>>(new Set());

  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderName, setUploadFolderName] = useState('All');
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & Drop State
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  // --- HELPERS ---
  const getFolderNameFromImage = (img: GalleryImage): string | null => {
    // Priority 1: App-level overridden folder name
    if (img.folder) return img.folder;

    // Priority 2: Derive from Public ID (Cloudinary path)
    if (img.publicId) {
      const parts = img.publicId.split('/');
      if (parts.length > 2 && parts[0] === 'gallery') {
        return parts[1];
      }
    }
    return null;
  };

  // --- DERIVED STATE ---

  const folders = React.useMemo(() => {
    const folderSet = new Set<string>();
    // Note: 'All' is handled separately as a special card

    // 1. From Images
    galleryImages.forEach(img => {
      const folder = getFolderNameFromImage(img);
      if (folder) folderSet.add(folder);
    });

    // 2. Custom Folders
    customFolders.forEach(f => folderSet.add(f));

    return Array.from(folderSet).sort();
  }, [galleryImages, customFolders]);

  const filteredImages = React.useMemo(() => {
    if (activeFolder === 'All') return galleryImages;
    return galleryImages.filter(img => {
      const folder = getFolderNameFromImage(img);
      return folder === activeFolder;
    });
  }, [galleryImages, activeFolder]);

  // Helper to get preview images for a folder
  const getFolderPreviews = (folderName: string) => {
    const images = folderName === 'All'
      ? galleryImages
      : galleryImages.filter(img => getFolderNameFromImage(img) === folderName);
    return images.slice(0, 4);
  };

  const getFolderCount = (folderName: string) => {
    if (folderName === 'All') return galleryImages.length;
    return galleryImages.filter(img => getFolderNameFromImage(img) === folderName).length;
  };


  // --- AUTO SYNC ---
  const syncWithCloudinary = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true);

    try {
      const cloudName = CLOUDINARY_CONFIG.cloudName;
      const tagsToFetch = ['easebook_gallery', 'gallery'];

      const fetchPromises = tagsToFetch.map(tag => {
        const url = `https://res.cloudinary.com/${cloudName}/image/list/${tag}.json?v=${Date.now()}`;
        return fetch(url).then(res => res.ok ? res.json() : { resources: [] }).catch(() => ({ resources: [] }));
      });

      const searchResults = await Promise.all(fetchPromises);
      const allResources = searchResults.flatMap(data => data.resources || []);
      const uniqueResourcesMap = new Map();
      allResources.forEach((res: any) => uniqueResourcesMap.set(res.public_id, res));
      const cloudResources = Array.from(uniqueResourcesMap.values());

      const currentImages = galleryImagesRef.current; // Use Ref for latest
      const existingPublicIds = new Set(currentImages.map(img => img.publicId));

      const newImages: GalleryImage[] = cloudResources
        .filter((res: any) => !existingPublicIds.has(res.public_id))
        .map((res: any) => {
          // Determine initial folder from publicId
          let initialFolder = undefined;
          const parts = res.public_id.split('/');
          if (parts.length > 2 && parts[0] === 'gallery') {
            initialFolder = parts[1];
          }

          return {
            id: `img-sync-${res.public_id}`,
            publicId: res.public_id,
            folder: initialFolder, // Set initial folder
            width: res.width,
            height: res.height,
            createdAt: res.created_at,
            caption: '',
          };
        });

      if (newImages.length > 0) {
        setGalleryImages([...newImages, ...currentImages]);
        if (isManual) alert(`✨ Sync Complete! Added ${newImages.length} new memories.`);
      } else if (isManual) {
        alert(`✅ Gallery is up to date!`);
      }

    } catch (error: any) {
      console.error('Sync failed:', error);
      if (isManual) alert(`❌ Sync failed: ${error.message}`);
    } finally {
      if (isManual) setIsSyncing(false);
    }
  }, [setGalleryImages]);

  useEffect(() => {
    if (galleryImages.length === 0) syncWithCloudinary();
  }, []);


  // --- HANDLERS ---

  const handleCreateFolder = () => {
    const name = prompt("Enter new folder name:");
    if (name) {
      const cleanName = name.replace(/[^a-zA-Z0-9\-_ ]/g, ''); // Allow spaces
      if (cleanName) {
        setCustomFolders(prev => new Set(prev).add(cleanName));
      }
    }
  };

  const handleOpenFolder = (folder: string) => {
    setActiveFolder(folder);
    setViewMode('grid');
  };

  const handleBackToFolders = () => {
    setViewMode('folders');
  };

  const handleRenameFolder = (oldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    const newName = prompt(`Rename folder "${oldName}" to:`, oldName);
    if (!newName || newName === oldName) return;

    const cleanName = newName.replace(/[^a-zA-Z0-9\-_ ]/g, ''); // Allow spaces
    if (!cleanName) return;

    if (window.confirm(`Rename "${oldName}" to "${cleanName}"?\nThis updates the folder name in the App.`)) {
      const currentImages = galleryImagesRef.current;

      // Update all images in this folder to have the new 'folder' property
      const updatedImages = currentImages.map(img => {
        if (getFolderNameFromImage(img) === oldName) {
          return { ...img, folder: cleanName };
        }
        return img;
      });

      setGalleryImages(updatedImages);

      // Update custom folders set if it was empty/custom
      setCustomFolders(prev => {
        const next = new Set(prev);
        if (next.has(oldName)) {
          next.delete(oldName);
          next.add(cleanName);
        }
        return next;
      });

      if (activeFolder === oldName) setActiveFolder(cleanName);
    }
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (folderName === 'All') return;

    if (window.confirm(`Delete folder "${folderName}" and all its photos?\n\nThis will remove them from the app. (Cloudinary files retained safe)`)) {
      const currentImages = galleryImagesRef.current;
      // Filter out matching images
      const newImages = currentImages.filter(img => {
        return getFolderNameFromImage(img) !== folderName;
      });

      setGalleryImages(newImages);

      if (activeFolder === folderName) {
        setActiveFolder('All');
        setViewMode('folders');
      }

      setCustomFolders(prev => {
        const next = new Set(prev);
        next.delete(folderName);
        return next;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...selectedFiles]);
      if (!isUploadModalOpen) {
        setIsUploadModalOpen(true);
        setUploadFolderName(viewMode === 'grid' && activeFolder !== 'All' ? activeFolder : 'All');
        setIsNewFolder(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!e.dataTransfer) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

    if (droppedFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...droppedFiles]);
      if (!isUploadModalOpen) {
        setIsUploadModalOpen(true);
        setUploadFolderName(viewMode === 'grid' && activeFolder !== 'All' ? activeFolder : 'All');
        setIsNewFolder(false);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadConfirm = async () => {
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress({ current: 0, total: uploadFiles.length });

    const results: GalleryImage[] = [];
    const errors: string[] = [];
    const targetFolderName = isNewFolder ? uploadFolderName : uploadFolderName;

    // Cloudinary Folder: Either 'gallery' or 'gallery/Name'.
    // Not changing this to ensure compatibility
    const folderToSend = targetFolderName === 'All' ? 'gallery' : targetFolderName;

    await Promise.all(uploadFiles.map(async (file) => {
      try {
        const data = await uploadToCloudinary(file, folderToSend);

        results.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          publicId: data.public_id,
          folder: targetFolderName === 'All' ? undefined : targetFolderName, // Set explicit folder
          width: data.width,
          height: data.height,
          createdAt: data.created_at,
          caption: '',
        });
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        errors.push(file.name);
      } finally {
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    }));

    if (results.length > 0) {
      const currentImages = galleryImagesRef.current;
      setGalleryImages([...results, ...currentImages]);

      if (targetFolderName !== 'All' && targetFolderName !== 'gallery') {
        setCustomFolders(prev => new Set(prev).add(targetFolderName));
      }
      // Force refresh view to show new folder
      if (isNewFolder || targetFolderName !== activeFolder) {
        setActiveFolder(targetFolderName);
        setViewMode('grid');
      }
    }

    if (errors.length > 0) {
      alert(`Finished with errors. \n${errors.length} images failed to upload.\nCheck console for details.`);
    }

    setIsUploading(false);
    setIsUploadModalOpen(false);
    setUploadFiles([]);
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this memory?')) {
      setGalleryImages(galleryImagesRef.current.filter(img => img.id !== id));
    }
  };

  const handleMoveConfirm = (targetFolder: string) => {
    if (!movingItem) return;

    // Moving Logic
    const updatedImages = galleryImagesRef.current.map(img => {
      if (img.id === movingItem.id) {
        return {
          ...img,
          folder: targetFolder === 'All' ? undefined : targetFolder
        };
      }
      return img;
    });

    setGalleryImages(updatedImages);
    setMovingItem(null);
  };


  // --- DRAG & DROP LOGIC ---

  const handleImageDragStart = (e: React.DragEvent, id: string) => {
    setDraggedImageId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedImageId || draggedImageId === targetId) return;

    const newImages = [...galleryImages];
    const fromIndex = newImages.findIndex(img => img.id === draggedImageId);
    const toIndex = newImages.findIndex(img => img.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [movedItem] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedItem);
      setGalleryImages(newImages);
    }
    setDraggedImageId(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folderName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedImageId) return;

    const updatedImages = galleryImages.map(img => {
      if (img.id === draggedImageId) {
        return {
          ...img,
          folder: folderName === 'All' ? undefined : folderName
        };
      }
      return img;
    });

    setGalleryImages(updatedImages);
    setDraggedImageId(null);
  };

  // --- LIGHTBOX ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDisplayIndex(null);
      if (e.key === 'ArrowLeft') navigateImage(-1);
      if (e.key === 'ArrowRight') navigateImage(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDisplayIndex, galleryImages.length]);

  const navigateImage = useCallback((direction: number) => {
    setSelectedDisplayIndex((prev) => {
      if (prev === null) return null;
      const newIndex = prev + direction;
      if (newIndex < 0) return galleryImages.length - 1;
      if (newIndex >= galleryImages.length) return 0;
      return newIndex;
    });
  }, [galleryImages.length]);


  return (
    <div className="min-h-screen pb-24 bg-gray-50/50">

      {/* HEADER SECTION */}
      <div className="pt-8 pb-4 px-4 text-center bg-white/80 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-100/50">
        <h2 className="font-script text-5xl text-rose-600 mb-2 drop-shadow-sm">Our Gallery</h2>
        <p className="text-gray-500 font-light mb-4">Collecting moments, one picture at a time.</p>

        {/* CONTROLS BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between max-w-[1600px] mx-auto px-4 w-full gap-4">

          {/* LEFT: Navigation / Breadcrumbs */}
          <div className="flex items-center gap-3">
            {viewMode === 'grid' && (
              <button
                onClick={handleBackToFolders}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors"
              >
                <ChevronLeft size={20} />
                Folders
              </button>
            )}

            {viewMode === 'grid' && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-2xl font-bold text-gray-800">{activeFolder === 'All' ? 'All Memories' : activeFolder}</span>
              </>
            )}
          </div>


          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && viewMode === 'folders' && (
              <button
                onClick={handleCreateFolder}
                className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 hover:border-rose-300 hover:text-rose-600 px-4 py-2 rounded-full shadow-sm transition-all"
              >
                <Plus size={18} />
                New Folder
              </button>
            )}

            {isAdmin && (
              <>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
                <button
                  onClick={() => {
                    setUploadFolderName(viewMode === 'grid' && activeFolder !== 'All' ? activeFolder : 'All');
                    setIsNewFolder(false);
                    setIsUploadModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-full shadow-lg shadow-rose-200 transition-all transform hover:-translate-y-0.5"
                >
                  <Images size={18} />
                  <span>Add Photos</span>
                </button>

                <button
                  onClick={() => syncWithCloudinary(true)}
                  disabled={isSyncing}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Sync Cloud"
                >
                  <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Filter Bar (Only in Grid View) */}
        {viewMode === 'grid' && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 no-scrollbar mt-2 border-t border-gray-100">
            <button
              onClick={() => setActiveFolder('All')}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${activeFolder === 'All' ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
            {folders.map(folder => (
              <div
                key={folder}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => handleFolderDrop(e, folder)}
              >
                <button
                  onClick={() => setActiveFolder(folder)}
                  className={`px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFolder === folder
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {folder}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* MAIN CONTENT AREA */}
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-[50vh]">

        {/* VIEW 1: FOLDER CARDS */}
        {viewMode === 'folders' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {/* 1. All Memories Card */}
            <div
              onClick={() => handleOpenFolder('All')}
              className="group relative aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-90 group-hover:scale-105 transition-transform duration-700">
                {getFolderPreviews('All').slice(0, 4).map((img, i) => (
                  <img key={img.id} src={getOptimizedImageUrl(img, 400)} className="w-full h-full object-cover" />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-2xl font-bold">All Memories</h3>
                <p className="text-white/80 text-sm">{getFolderCount('All')} photos</p>
              </div>
            </div>

            {/* 2. Dynamic Folders */}
            {folders.map(folder => {
              const previews = getFolderPreviews(folder);
              const count = getFolderCount(folder);

              return (
                <div
                  key={folder}
                  onClick={() => handleOpenFolder(folder)}
                  onDragOver={(e) => { e.preventDefault(); }} // Allow drop on folder card
                  onDrop={(e) => handleFolderDrop(e, folder)}
                  className="group relative aspect-[4/3] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100"
                >
                  {/* Folder Preview Grid (Collage) */}
                  {previews.length > 0 ? (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-90 group-hover:scale-105 transition-transform duration-700">
                      {previews.length >= 1 && <img src={getOptimizedImageUrl(previews[0], 400)} className={`w-full h-full object-cover ${previews.length === 1 ? 'col-span-2 row-span-2' : ''}`} />}
                      {previews.length >= 2 && <img src={getOptimizedImageUrl(previews[1], 400)} className="w-full h-full object-cover" />}
                      {previews.length >= 3 && <img src={getOptimizedImageUrl(previews[2], 400)} className="w-full h-full object-cover" />}
                      {previews.length >= 4 && <img src={getOptimizedImageUrl(previews[3], 400)} className="w-full h-full object-cover" />}
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-rose-50 flex items-center justify-center">
                      <span className="text-rose-200"><Upload size={48} /></span>
                    </div>
                  )}

                  {/* Label Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <div className="flex justify-between items-end">
                      <div className="flex-1 min-w-0 mr-2">
                        <h3 className="text-white text-2xl font-bold truncate">{folder}</h3>
                        <p className="text-white/80 text-sm">{count} photos</p>
                      </div>

                      {/* ADMIN ACTIONS */}
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleRenameFolder(folder, e)}
                            className="p-2 bg-white/20 hover:bg-blue-500/80 rounded-full text-white transition-colors backdrop-blur-sm"
                            title="Rename Folder"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder, e)}
                            className="p-2 bg-white/20 hover:bg-red-500/80 rounded-full text-white transition-colors backdrop-blur-sm"
                            title="Delete Folder"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}


          </div>
        )}

        {/* VIEW 2: IMAGE GRID (MASONRY) */}
        {viewMode === 'grid' && (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                draggable={isAdmin}
                onDragStart={(e) => handleImageDragStart(e, image.id)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => handleImageDrop(e, image.id)}
                className={isAdmin ? "cursor-move" : ""}
              >
                <GalleryItem
                  image={image}
                  index={index}
                  onClick={() => {
                    const globalIndex = galleryImages.findIndex(img => img.id === image.id);
                    setSelectedDisplayIndex(globalIndex);
                  }}
                  isAdmin={isAdmin}
                  onDelete={(e) => handleDelete(e, image.id)}
                  onMove={(e) => { e.stopPropagation(); setMovingItem(image); }}
                />
              </div>
            ))}
            {filteredImages.length === 0 && (
              <div className="text-center py-20 text-gray-400 col-span-full">
                <p>No photos in this folder yet.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* PORTALS FOR MODALS */}
      {/* Lightbox */}
      {selectedDisplayIndex !== null && createPortal(
        <AnimatePresence>
          <Lightbox
            image={galleryImages[selectedDisplayIndex]}
            onClose={() => setSelectedDisplayIndex(null)}
            onNext={() => navigateImage(1)}
            onPrev={() => navigateImage(-1)}
          />
        </AnimatePresence>,
        document.body
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isUploading && setIsUploadModalOpen(false)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-visible"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-script text-rose-600">
                  {uploadFiles.length > 1 ? `Add ${uploadFiles.length} Memories` : 'Add New Memory'}
                </h3>
                <button onClick={() => !isUploading && setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload To Folder</label>
                {!isNewFolder ? (
                  <div className="flex gap-2">
                    <select
                      value={uploadFolderName}
                      onChange={(e) => {
                        if (e.target.value === 'NEW') {
                          setIsNewFolder(true);
                          setUploadFolderName('');
                        } else {
                          setUploadFolderName(e.target.value);
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
                    >
                      <option value={'All'}>All (Uncategorized)</option>
                      {folders.map(f => <option key={f} value={f}>{f}</option>)}
                      <option value="NEW">+ Create New Folder</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Folder Name (e.g. Vacation)"
                      value={uploadFolderName}
                      onChange={(e) => setUploadFolderName(e.target.value.replace(/[^a-zA-Z0-9\-_ ]/g, ''))}
                      className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      autoFocus
                    />
                    <button onClick={() => { setIsNewFolder(false); setUploadFolderName('All'); }} className="text-gray-500 px-2">Cancel</button>
                  </div>
                )}
              </div>

              <div
                className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors ${uploadFiles.length > 0 ? 'border-rose-300 bg-rose-50' : 'border-gray-300 hover:border-rose-400 cursor-pointer'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {uploadFiles.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-60 custom-scrollbar p-1">
                    {uploadFiles.map((file, i) => (
                      <div key={`${file.name}-${file.size}-${i}`} className="relative group aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(i);
                          }}
                          className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-center border-2 border-dashed border-rose-200 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer aspect-square" title="Add more">
                      <Plus size={24} className="text-rose-400" />
                    </div>
                  </div>
                ) : (
                  <div className="py-6">
                    <Upload className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-gray-600 font-medium text-sm">Click or Drag & Drop (Multiple)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setIsUploadModalOpen(false)} disabled={isUploading} className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
                <button
                  onClick={handleUploadConfirm}
                  disabled={uploadFiles.length === 0 || isUploading || (isNewFolder && !uploadFolderName)}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl shadow-lg shadow-rose-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>{uploadProgress.current} / {uploadProgress.total}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      {uploadFiles.length > 0 ? `Post ${uploadFiles.length} Photos` : 'Post Memory'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Move Modal */}
      {movingItem && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setMovingItem(null)}
          >
            {/* MOVE MODAL CONTENT */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Move Photo</h3>
                <button onClick={() => setMovingItem(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">Select a destination:</p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => handleMoveConfirm('All')}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 border border-gray-100 flex items-center gap-3 transition-colors"
                >
                  <div className="bg-gray-100 p-2 rounded-full"><FolderInput size={18} className="text-gray-500" /></div>
                  <span className="font-medium text-gray-700">Main Gallery (Unsorted)</span>
                </button>
                {folders.map(folder => (
                  <button
                    key={folder}
                    onClick={() => handleMoveConfirm(folder)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-rose-50 border border-gray-100 flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-rose-100 p-2 rounded-full"><FolderInput size={18} className="text-rose-500" /></div>
                    <span className="font-medium text-gray-700">{folder}</span>
                  </button>
                ))}
              </div>

            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};

// ... Sub Components (GalleryItem, Lightbox) remain same, implied via overwrite ...
const GalleryItem: React.FC<{
  image: GalleryImage;
  index: number;
  onClick: () => void;
  isAdmin: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onMove: (e: React.MouseEvent) => void;
}> = ({ image, index, onClick, isAdmin, onDelete, onMove }) => {
  const thumbnailUrl = getOptimizedImageUrl(image, 500);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      transition={{ delay: 0.1 }}
      className="break-inside-avoid relative group cursor-zoom-in rounded-3xl overflow-hidden bg-gray-100 mb-6 shadow-sm hover:shadow-xl transition-all duration-300"
      onClick={onClick}
    >
      <img
        src={thumbnailUrl}
        alt={image.caption || 'Memory'}
        loading="lazy"
        className="w-full h-auto block object-cover transform transition-transform duration-700 group-hover:scale-105"
      />

      {/* Hover Overlay - Pinterest Style */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">

        {/* Top Right Actions (Admin) */}
        <div className="flex justify-end gap-2">
          {isAdmin && (
            <>
              <button onClick={onMove} className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-blue-500 hover:text-white transition-colors shadow-sm" title="Move to Folder">
                <FolderInput size={16} />
              </button>
              <button onClick={onDelete} className="p-2 bg-white/90 text-gray-700 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="Delete Memory">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>


      </div>
    </motion.div>
  );
};

const Lightbox: React.FC<{
  image: GalleryImage;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ image, onClose, onNext, onPrev }) => {
  const highResUrl = image.publicId
    ? getCloudinaryUrl(image.publicId, { width: 1600 })
    : getOptimizedImageUrl(image, 1600);

  const [isLoaded, setIsLoaded] = useState(false);

  // Swipe logic
  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) onNext();
      else onPrev();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10" onClick={onClose}><X size={32} /></button>
      <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full hover:bg-white/10 hidden md:block" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft size={48} /></button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full hover:bg-white/10 hidden md:block" onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight size={48} /></button>

      <img
        src={highResUrl}
        className={`max-w-full max-h-screen object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
      {!isLoaded && <Loader2 className="absolute animate-spin text-white" size={48} />}
    </motion.div>
  );
};

export default Gallery;