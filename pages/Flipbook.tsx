import React, { useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { FlipbookPage } from '../types';
import { getOptimizedImageUrl } from '../utils';

interface PageProps {
    children: React.ReactNode;
    number?: string | number;
}

const Page = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => {
    return (
        <div className="bg-white p-4 md:p-8 border border-gray-200 shadow-inner h-full flex flex-col items-center justify-center relative overflow-hidden" ref={ref}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none" />
            {props.children}
            <div className="absolute bottom-4 text-xs text-gray-400 font-mono">{props.number}</div>
        </div>
    );
});

// Extracted Component for smart media handling
const FlipbookMediaItem: React.FC<{ page: FlipbookPage }> = ({ page }) => {
    const [hasError, setHasError] = useState(false);
    const optimizedUrl = getOptimizedImageUrl(page.url);

    // 1. Direct Video File Check
    if (page.url.match(/\.(mp4|webm|ogg)$/i)) {
        return (
            <video
                src={page.url}
                controls
                className="w-full h-full object-contain"
            />
        );
    }

    // 2. If we encountered an error loading the image (e.g. Broken Drive Image Link), 
    // try to fallback to Google Drive Preview Iframe
    if (hasError) {
        // Attempt to extract Drive ID
        const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|drive\.google\.com\/uc\?.*id=)([-a-zA-Z0-9_]+)/;
        const match = page.url.match(driveRegex);

        if (match && match[1]) {
            return (
                <iframe
                    src={`https://drive.google.com/file/d/${match[1]}/preview`}
                    className="w-full h-full border-none object-contain pointer-events-auto"
                    title="Memory Fallback"
                    allow="autoplay"
                />
            );
        }

        // If not a drive link or fallback failed, show broken link placeholder
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
                <Trash2 size={24} className="mb-2" />
                <span className="text-xs">Broken Link</span>
            </div>
        );
    }

    // 3. Default: Try to load as Optimized Image
    return (
        <img
            src={optimizedUrl}
            alt="Memory"
            className="w-full h-full object-contain rounded-sm block"
            onError={() => setHasError(true)}
        />
    );
};

const Flipbook: React.FC = () => {
    const { flipbookPages, setFlipbookPages, isAdmin } = useData();
    const [newPageUrl, setNewPageUrl] = useState('');
    const [newPageCaption, setNewPageCaption] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editCaption, setEditCaption] = useState('');

    const bookRef = useRef<any>(null);

    const handleAddPage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPageUrl) return;

        const newPage: FlipbookPage = {
            id: Date.now().toString(),
            url: newPageUrl,
            caption: newPageCaption
        };
        setFlipbookPages([...flipbookPages, newPage]);
        setNewPageUrl('');
        setNewPageCaption('');
    };

    const handleDeletePage = (id: string) => {
        if (window.confirm("Delete this page?")) {
            setFlipbookPages(flipbookPages.filter(p => p.id !== id));
        }
    };

    const startEdit = (page: FlipbookPage) => {
        setEditingId(page.id);
        setEditUrl(page.url);
        setEditCaption(page.caption || '');
    };

    const saveEdit = () => {
        if (!editingId) return;
        setFlipbookPages(flipbookPages.map(p => p.id === editingId ? { ...p, url: editUrl, caption: editCaption } : p));
        setEditingId(null);
    };

    return (
        <div className="min-h-screen py-8 px-2 md:px-8 flex flex-col items-center justify-center bg-gray-100 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h2 className="font-script text-4xl md:text-6xl text-gray-800 flex items-center justify-center gap-4">
                    <BookOpen className="text-rose-500" /> Our Storybook
                </h2>
                <p className="text-gray-500 text-sm mt-2">Turn the pages of our memories...</p>
            </motion.div>

            {/* ADMIN CONTROLS: ADD NEW */}
            {isAdmin && (
                <div className="mb-8 w-full max-w-lg">
                    <form onSubmit={handleAddPage} className="flex flex-col gap-2 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase">Add New Page</h3>
                        <input
                            value={newPageUrl}
                            onChange={(e) => setNewPageUrl(e.target.value)}
                            placeholder="Image URL..."
                            className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                        />
                        <input
                            value={newPageCaption}
                            onChange={(e) => setNewPageCaption(e.target.value)}
                            placeholder="Caption (Handwritten)..."
                            className="p-2 bg-gray-50 rounded border border-gray-200 text-sm font-script text-lg"
                        />
                        <button type="submit" className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2 text-sm font-bold">
                            <Plus size={16} /> Add Page
                        </button>
                    </form>
                </div>
            )}

            {/* BOOK */}
            <div className="relative shadow-2xl rounded-sm">
                {flipbookPages.length === 0 ? (
                    <div className="w-[300px] h-[400px] md:w-[400px] md:h-[500px] bg-white flex items-center justify-center text-gray-400 flex-col gap-4 text-center p-8">
                        <p>The storybook is empty.</p>
                        {!isAdmin && <p className="text-sm">Ask the admin to add some memories!</p>}
                    </div>
                ) : (
                    <HTMLFlipBook
                        key={flipbookPages.map(p => p.id).join('-')}
                        width={350}
                        height={500}
                        size="fixed"
                        minWidth={300}
                        maxWidth={500}
                        minHeight={400}
                        maxHeight={600}
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        className="shadow-2xl"
                        style={{ margin: '0 auto' }}
                        ref={bookRef}
                    >
                        {/* COVER */}
                        <div className="bg-rose-600 text-white p-8 flex flex-col items-center justify-center text-center border-4 border-rose-800 relative">
                            <div className="absolute inset-2 border-2 border-rose-400/50" />
                            <h1 className="font-script text-6xl mb-4">Memories</h1>
                            <p className="text-xl font-light">A collection of moments</p>
                            <div className="absolute bottom-8 left-0 right-0 text-rose-200 text-sm">Tap corner to flip <span>↗</span></div>
                        </div>

                        {/* DYNAMIC PAGES */}
                        {flipbookPages.map((page, index) => (
                            <Page key={page.id} number={index + 1}>
                                {isAdmin && editingId === page.id ? (
                                    // EDIT MODE
                                    <div className="absolute inset-4 bg-white/90 backdrop-blur z-30 flex flex-col gap-2 justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg">
                                        <h4 className="text-center font-bold text-gray-700">Editing Page {index + 1}</h4>
                                        <input value={editUrl} onChange={e => setEditUrl(e.target.value)} className="p-2 border rounded text-xs" placeholder="URL" />
                                        <input value={editCaption} onChange={e => setEditCaption(e.target.value)} className="p-2 border rounded text-xs font-script text-lg" placeholder="Caption" />
                                        <div className="flex gap-2 justify-center mt-2">
                                            <button onClick={saveEdit} className="px-3 py-1 bg-green-500 text-white rounded text-xs font-bold">Save</button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-400 text-white rounded text-xs">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <>
                                        <div className="w-full h-auto max-h-[75%] flex-1 relative shadow-sm p-1 bg-white rotate-1 hover:rotate-0 transition-transform duration-500 mb-4 flex items-center justify-center overflow-hidden">
                                            <FlipbookMediaItem page={page} />
                                        </div>
                                        {page.caption && (
                                            <div className="text-center px-4">
                                                <p className="font-script text-3xl text-gray-700 leading-relaxed rotate-[-2deg] opacity-90">
                                                    {page.caption}
                                                </p>
                                            </div>
                                        )}

                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="absolute top-2 right-2 flex gap-1 z-20">
                                                <button
                                                    onClick={() => startEdit(page)}
                                                    className="bg-white text-blue-500 p-1 rounded-full shadow hover:bg-blue-50"
                                                >
                                                    <BookOpen size={14} /> {/* Edit Icon */}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePage(page.id)}
                                                    className="bg-white text-red-500 p-1 rounded-full shadow hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Page>
                        ))}

                        {/* BACK COVER */}
                        <div className="bg-rose-800 text-white p-8 flex items-center justify-center text-center">
                            <h2 className="font-script text-4xl">The End...<br />for now</h2>
                        </div>
                    </HTMLFlipBook>
                )}
            </div>

            <div className="mt-8 flex gap-4 text-gray-400 text-sm">
                <button
                    onClick={() => bookRef.current.pageFlip().flipPrev()}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                >
                    <ArrowLeft size={14} /> Previous
                </button>
                <span>|</span>
                <button
                    onClick={() => bookRef.current.pageFlip().flipNext()}
                    className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                >
                    Next <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default Flipbook;
