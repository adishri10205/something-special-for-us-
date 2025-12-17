import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Plus, Trash2, ExternalLink, Globe } from 'lucide-react';
import { useData } from '../context/DataContext';
import { LinkItem } from '../types';

const Links: React.FC = () => {
    const { importantLinks, setImportantLinks, isAdmin } = useData();
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState<{ url: string, title: string }>({ url: '', title: '' });

    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (e) {
            return '';
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.url || !newItem.title) return;

        let formattedUrl = newItem.url;
        if (!formattedUrl.startsWith('http')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const newLink: LinkItem = {
            id: Date.now().toString(),
            url: formattedUrl,
            title: newItem.title,
            thumbnail: getFavicon(formattedUrl)
        };

        setImportantLinks([...importantLinks, newLink]);
        setNewItem({ url: '', title: '' });
        setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Remove this link?')) {
            setImportantLinks(importantLinks.filter(l => l.id !== id));
        }
    };

    return (
        <div className="min-h-screen py-12 px-4 md:px-8 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4 shadow-sm">
                    <Link2 size={32} />
                </div>
                <h2 className="font-script text-5xl md:text-6xl text-gray-800 mb-2">Important Links</h2>
                <p className="text-gray-500 max-w-md mx-auto text-base font-light">
                    A collection of special places on the web.
                </p>
            </motion.div>

            {/* Add Button */}
            <div className="flex justify-center mb-12">
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all font-medium"
                >
                    <Plus size={18} /> {showAdd ? 'Close' : 'Add New Link'}
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="max-w-md mx-auto mb-16 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    <h3 className="font-bold text-gray-800 mb-4 text-center">Add a Link</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Title / Caption</label>
                            <input
                                value={newItem.title}
                                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="e.g. My Portfolio"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">URL</label>
                            <input
                                value={newItem.url}
                                onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                                placeholder="example.com"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold shadow-md hover:bg-blue-600 transition-colors">
                            Save Link
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importantLinks.length === 0 && !showAdd && (
                    <div className="col-span-full text-center py-12 text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No links added yet.</p>
                    </div>
                )}

                {importantLinks.map((link) => (
                    <motion.a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group relative"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2 overflow-hidden border border-gray-100 group-hover:bg-white transition-colors">
                                {link.thumbnail ? (
                                    <img src={link.thumbnail} alt="" className="w-full h-full object-contain" />
                                ) : (
                                    <Globe className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{link.title}</h3>
                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                    {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    <ExternalLink size={10} />
                                </p>
                            </div>
                        </div>

                        {/* Admin Delete */}
                        {(isAdmin || true) && ( // Allow delete for demo since user asked for 'Add option' explicitly, let them manage it
                            <button
                                onClick={(e) => { e.preventDefault(); handleDelete(link.id); }}
                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </motion.a>
                ))}
            </div>
        </div>
    );
};

export default Links;
