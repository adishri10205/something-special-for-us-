import React from 'react';
import { UserProfile, UserPermissions } from '../types';
import { X, Check } from 'lucide-react';

interface PermissionModalProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (uid: string, permissions: UserPermissions) => Promise<void>;
}

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
    // View Access
    canViewJourney: 'View Journey',
    canViewGallery: 'View Gallery',
    canViewReels: 'View Reels',
    canViewVideos: 'View Videos',
    canViewMusic: 'View Music',
    canViewNotes: 'View Notes',
    canViewMessages: 'View Messages',
    canViewVault: 'Access Vault',
    canViewAdmin: 'Access Admin Panel',

    // Edit Access
    canEditTimeline: 'Edit Timeline',
    canEditGallery: 'Edit Gallery',
    canEditReels: 'Edit Reels',
    canAddReels: 'Add Reels',
    canDeleteReels: 'Delete Reels',
    canEditMusic: 'Edit Music',
    canEditNotes: 'Edit Notes',
};

const PermissionModal: React.FC<PermissionModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [permissions, setPermissions] = React.useState<UserPermissions>(user.customPermissions || {});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        console.log("PermissionModal mounted with user:", user.email);
        setPermissions(user.customPermissions || {});
    }, [user]);

    if (!isOpen) return null;

    const togglePermission = (key: keyof UserPermissions) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        await onUpdate(user.uid, permissions);
        setSaving(false);
        onClose();
    };

    return (
        <div key={user.uid} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-blue-800">Manage Permissions</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">User</p>
                        <p className="font-bold text-gray-800 text-lg">{user.displayName || user.email}</p>
                    </div>

                    <div className="space-y-6">
                        {/* View Permissions Section */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">View Access</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(PERMISSION_LABELS)
                                    .filter(([key]) => key.startsWith('canView'))
                                    .map(([key, label]) => {
                                        const permKey = key as keyof UserPermissions;
                                        const isEnabled = !!permissions[permKey];
                                        return (
                                            <label key={permKey} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${isEnabled ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                                                <span className={`text-sm font-medium ${isEnabled ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
                                                <div className={`w-10 h-5 rounded-full p-1 transition-colors relative ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isEnabled}
                                                        onChange={() => togglePermission(permKey)}
                                                    />
                                                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </div>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Edit Permissions Section */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 text-rose-500">Edit / Admin Access</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(PERMISSION_LABELS)
                                    .filter(([key]) => !key.startsWith('canView'))
                                    .map(([key, label]) => {
                                        const permKey = key as keyof UserPermissions;
                                        const isEnabled = !!permissions[permKey];
                                        return (
                                            <label key={permKey} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${isEnabled ? 'bg-rose-50 border-rose-200' : 'hover:bg-gray-50'}`}>
                                                <span className={`text-sm font-medium ${isEnabled ? 'text-rose-700' : 'text-gray-700'}`}>{label}</span>
                                                <div className={`w-10 h-5 rounded-full p-1 transition-colors relative ${isEnabled ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isEnabled}
                                                        onChange={() => togglePermission(permKey)}
                                                    />
                                                    <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </div>
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-gray-900 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;
