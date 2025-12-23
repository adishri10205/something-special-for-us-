import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { UserProfile, UserPermissions } from '../types';

interface PermissionModalProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (uid: string, permissions: UserPermissions) => Promise<void>;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [permissions, setPermissions] = useState<UserPermissions>(user.customPermissions || {});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPermissions(user.customPermissions || {});
    }, [user]);

    const handleToggle = (key: keyof UserPermissions) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(user.uid, permissions);
            onClose();
        } catch (error) {
            console.error('Failed to update permissions:', error);
            alert('Failed to update permissions. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const permissionGroups = [
        {
            title: 'Edit Permissions',
            icon: Edit,
            color: 'blue',
            permissions: [
                { key: 'canEditTimeline', label: 'Edit Journey/Timeline' },
                { key: 'canEditGallery', label: 'Edit Gallery' },
                { key: 'canEditReels', label: 'Edit Reels' },
                { key: 'canEditMusic', label: 'Edit Music' },
                { key: 'canEditNotes', label: 'Edit Notes' },
                { key: 'canEditFlipbook', label: 'Edit Flipbook/Storybook' },
                { key: 'canEditVoiceNotes', label: 'Edit Voice Notes' },
            ]
        },
        {
            title: 'View Permissions',
            icon: Eye,
            color: 'green',
            permissions: [
                { key: 'canViewJourney', label: 'View Journey' },
                { key: 'canViewGallery', label: 'View Gallery' },
                { key: 'canViewReels', label: 'View Reels' },
                { key: 'canViewVideos', label: 'View Videos' },
                { key: 'canViewMusic', label: 'View Music' },
                { key: 'canViewNotes', label: 'View Notes' },
                { key: 'canViewFlipbook', label: 'View Flipbook/Storybook' },
                { key: 'canViewVoiceNotes', label: 'View Voice Notes' },
                { key: 'canViewVault', label: 'View Vault' },
                { key: 'canViewMessages', label: 'View Messages' },
                { key: 'canViewSecretMessage', label: 'View Secret Messages' },
            ]
        },
        {
            title: 'Special Permissions',
            icon: Shield,
            color: 'purple',
            permissions: [
                { key: 'canViewAdmin', label: 'Access Admin Panel' },
                { key: 'canAddReels', label: 'Add Reels' },
                { key: 'canDeleteReels', label: 'Delete Reels' },
                { key: 'canDeleteNotes', label: 'Delete Notes' },
            ]
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Shield size={28} />
                                        Manage Access & Roles
                                    </h2>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Configure permissions for <strong>{user.displayName || user.email}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {permissionGroups.map((group) => {
                                const Icon = group.icon;
                                const colorClasses = {
                                    blue: 'bg-blue-50 border-blue-200 text-blue-700',
                                    green: 'bg-green-50 border-green-200 text-green-700',
                                    purple: 'bg-purple-50 border-purple-200 text-purple-700',
                                };

                                return (
                                    <div key={group.title} className="space-y-3">
                                        <h3 className={`font-bold text-lg flex items-center gap-2 ${group.color === 'blue' ? 'text-blue-700' : group.color === 'green' ? 'text-green-700' : 'text-purple-700'}`}>
                                            <Icon size={20} />
                                            {group.title}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {group.permissions.map((perm) => (
                                                <label
                                                    key={perm.key}
                                                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${permissions[perm.key as keyof UserPermissions]
                                                        ? colorClasses[group.color as keyof typeof colorClasses]
                                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <span className="font-medium text-sm">{perm.label}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!permissions[perm.key as keyof UserPermissions]}
                                                        onChange={() => handleToggle(perm.key as keyof UserPermissions)}
                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PermissionModal;
