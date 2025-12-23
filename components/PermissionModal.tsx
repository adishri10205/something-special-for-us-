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
    canEditTimeline: 'Edit Timeline',
    canEditGallery: 'Edit Gallery',
    canEditReels: 'Edit Reels',
    canEditMusic: 'Edit Music',
    canEditNotes: 'Edit Notes',
    canViewVault: 'Access Vault',
    canViewAdmin: 'Access Admin Panel',
    canViewMessages: 'View Messages'
};

const PermissionModal: React.FC<PermissionModalProps> = ({ user, isOpen, onClose, onUpdate }) => {
    const [permissions, setPermissions] = React.useState<UserPermissions>(user.customPermissions || {});
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Manage Permissions</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">User</p>
                        <p className="font-bold text-gray-800 text-lg">{user.displayName || user.email}</p>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                            const permKey = key as keyof UserPermissions;
                            const isEnabled = !!permissions[permKey];

                            return (
                                <label key={permKey} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <span className="text-gray-700 font-medium">{label}</span>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isEnabled}
                                            onChange={() => togglePermission(permKey)}
                                        />
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </div>
                                </label>
                            );
                        })}
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
