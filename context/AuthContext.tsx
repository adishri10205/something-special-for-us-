import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { auth, googleProvider, db, firebaseConfig } from '../src/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, UserCredential, getAuth } from 'firebase/auth';
import { ref, get, set, child, onValue, update, push } from 'firebase/database';
import { UserProfile } from '../types';
import { INITIAL_ADMIN_EMAILS, DEFAULT_MAX_ATTEMPTS } from '../constants';

interface AuthContextType {
    currentUser: UserProfile | null;
    loading: boolean;
    authError: string;
    loginWithGoogle: () => Promise<UserCredential>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string, name: string, role?: 'admin' | 'user', preventAutoLogin?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    viewAsUser: boolean;
    toggleViewMode: () => void;
    banCurrentDevice: (reason?: string) => Promise<void>;

    // MPIN
    isAppLocked: boolean;
    lockApp: () => void;
    unlockApp: (mpin: string) => Promise<boolean>;
    setupMpin: (mpin: string) => Promise<void>;
    requestMpinReset: () => Promise<void>;
    clearSecurityAlerts: (mpin: string) => Promise<boolean>;
    hasPermission: (permission: keyof import('../types').UserPermissions) => boolean;
    updateListeningStatus: (track: import('../types').Track | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewAsUser, setViewAsUser] = useState(false);
    const [authError, setAuthError] = useState<string>('');

    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState('');

    const hasPermission = (permission: keyof import('../types').UserPermissions) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true; // Admin has full access
        return !!currentUser.customPermissions?.[permission];
    };

    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

    useEffect(() => {
        let banUnsubscribe: (() => void) | undefined;
        const checkBanStatus = async () => {
            try {
                // simple local check first
                if (localStorage.getItem('device_banned')) {
                    setIsBanned(true);
                    setBanReason(localStorage.getItem('ban_reason') || 'Security Violation');
                }

                let ip = '';
                try {
                    const res = await fetch('https://api.ipify.org?format=json');
                    if (res.ok) ip = (await res.json()).ip;
                } catch {
                    try {
                        const res2 = await fetch('https://ipapi.co/json/');
                        if (res2.ok) ip = (await res2.json()).ip;
                    } catch { }
                }

                if (ip) {
                    const ipKey = ip.replace(/[\.\#\$\/\[\]\:]/g, '_');
                    const banRef = ref(db, `banned_ips/${ipKey}`);

                    banUnsubscribe = onValue(banRef, (snap) => {
                        if (snap.exists()) {
                            setIsBanned(true);
                            const r = snap.val().reason || 'IP Banned';
                            setBanReason(r);
                            localStorage.setItem('device_banned', 'true');
                            localStorage.setItem('ban_reason', r);
                        } else {
                            // Automatically Unban if removed from DB
                            if (localStorage.getItem('device_banned')) {
                                setIsBanned(false);
                                setBanReason('');
                                localStorage.removeItem('device_banned');
                                localStorage.removeItem('ban_reason');
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn("Could not verify IP ban status", e);
            }
        };
        checkBanStatus();

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            if (!user) {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            if (banUnsubscribe) banUnsubscribe();
        };
    }, []);

    // Real-time User Profile Sync
    useEffect(() => {
        let userUnsubscribe: (() => void) | undefined;

        const initUser = async () => {
            if (!firebaseUser) return;
            setLoading(true);

            // Fetch dynamic admin list
            let adminEmails = INITIAL_ADMIN_EMAILS;
            try {
                const adminListRef = ref(db, 'settings/adminEmails');
                const adminSnapshot = await get(adminListRef);
                if (adminSnapshot.exists()) {
                    adminEmails = adminSnapshot.val();
                }
            } catch (e) {
                console.error("Failed to fetch admin list", e);
            }

            const isAdminEmail = firebaseUser.email && (Array.isArray(adminEmails) ? adminEmails.includes(firebaseUser.email) : false);

            const baseProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                role: isAdminEmail ? 'admin' : 'user',
                status: 'online',
                lastSeen: new Date().toISOString()
            };

            const userRef = ref(db, `users/${firebaseUser.uid}`);

            // 1. Initial Sync/Write (ensure profile exists)
            try {
                const snap = await get(userRef);
                if (!snap.exists()) {
                    await set(userRef, baseProfile);
                } else {
                    // Update lastSeen and essential auth info, but preserve DB roles/permissions
                    const existing = snap.val();
                    const mergedProfile = { ...baseProfile, ...existing, lastSeen: new Date().toISOString() };
                    // Force admin if super-admin email
                    if (isAdminEmail) mergedProfile.role = 'admin';
                    await update(userRef, mergedProfile);
                }
            } catch (e) {
                console.error("Profile sync failed", e);
            }

            // 2. Real-time Listener for Permissions/Role changes
            userUnsubscribe = onValue(userRef, (snapshot) => {
                const val = snapshot.val();
                if (val) {
                    // Always re-merge with base to ensure we have latest fields if DB is partial? 
                    // Actually, DB should differ mostly in permissions.
                    // Important: If admin demotes user in DB, this listener catches it.

                    // Allow Email Check to override DB role if it's a super admin
                    if (isAdminEmail) val.role = 'admin';

                    setCurrentUser(val);
                } else {
                    setCurrentUser(baseProfile);
                }
                setLoading(false);
            }, (error) => {
                console.error("Realtime update failed", error);
                setLoading(false);
            });
        };

        if (firebaseUser) {
            initUser();
        } else {
            setLoading(false);
        }

        return () => {
            if (userUnsubscribe) userUnsubscribe();
        };
    }, [firebaseUser]);

    const banCurrentDevice = async (reason: string = 'Security Violation') => {
        try {
            // Local Ban (Immediate)
            localStorage.setItem('device_banned', 'true');
            localStorage.setItem('ban_reason', reason);
            setIsBanned(true);
            setBanReason(reason);

            // Cloud Ban Logic
            let ip = '';
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                if (!res.ok) throw new Error("IP Service 1 Failed");
                const data = await res.json();
                ip = data.ip;
            } catch (e) {
                try {
                    // Fallback Service
                    const res2 = await fetch('https://ipapi.co/json/');
                    if (!res2.ok) throw new Error("IP Service 2 Failed");
                    const data2 = await res2.json();
                    ip = data2.ip;
                } catch (e2) {
                    console.error("Could not resolve IP. Cloud ban skipped.", e2);
                }
            }

            if (ip) {
                // Replace all potential invalid key characters to ensure Write succeeds
                const ipKey = ip.replace(/[\.\#\$\/\[\]\:]/g, '_');

                await set(ref(db, `banned_ips/${ipKey}`), {
                    ip: ip,
                    reason: reason,
                    bannedAt: new Date().toISOString()
                });
            }

            // Delay sign out slightly to ensure write clears
            setTimeout(async () => {
                await signOut(auth);
            }, 500);
        } catch (e) {
            console.error("Failed to execute cloud ban", e);
        }
    };

    const loginWithGoogle = async () => {
        setAuthError('');
        try {
            return await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        setAuthError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error("Email Login failed", error);
            throw error;
        }
    };

    const signupWithEmail = async (email: string, password: string, name: string, role: 'admin' | 'user' = 'user', preventAutoLogin = false) => {
        setAuthError('');
        try {
            let targetAuth = auth;
            let secondaryApp: any = null;

            if (preventAutoLogin) {
                // Initialize secondary app to prevent overwriting current session
                secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
                targetAuth = getAuth(secondaryApp);
            }

            const userCredential = await createUserWithEmailAndPassword(targetAuth, email, password);
            if (userCredential.user) {
                if (name) {
                    await updateProfile(userCredential.user, { displayName: name });
                }
                // Initialize user profile in DB with selected role
                // Note: We use the Main DB instance (connected as Admin) to write the new user's profile
                const userRef = ref(db, `users/${userCredential.user.uid}`);
                const profile: UserProfile = {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    displayName: name || null,
                    photoURL: userCredential.user.photoURL,
                    role: role,
                    status: 'online',
                    lastSeen: new Date().toISOString()
                };
                await set(userRef, profile);
            }

            if (preventAutoLogin && secondaryApp) {
                await signOut(targetAuth);
            }
        } catch (error: any) {
            console.error("Sign Up failed", error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const toggleViewMode = () => {
        setViewAsUser(prev => !prev);
    };

    const [isAppLocked, setIsAppLocked] = useState(true);

    // Initial verifiction lock
    useEffect(() => {
        if (currentUser && currentUser.mpin) {
            setIsAppLocked(true);
        } else {
            setIsAppLocked(false);
        }
    }, [currentUser?.uid]);

    const lockApp = () => setIsAppLocked(true);

    const unlockApp = async (mpin: string): Promise<boolean> => {
        if (!currentUser?.mpin) return false;

        if (currentUser.mpin === mpin) {
            // Reset failure count on success
            if (currentUser.failedMpinAttempts && currentUser.failedMpinAttempts > 0) {
                await update(ref(db, `users/${currentUser.uid}`), {
                    failedMpinAttempts: 0,
                    lastFailedMpinAttempt: null
                });
                // Update local state immediately
                setCurrentUser(prev => prev ? { ...prev, failedMpinAttempts: 0, lastFailedMpinAttempt: undefined } : null);
            }

            setIsAppLocked(false);
            return true;
        } else {
            // Log failed attempt
            if (currentUser.uid) {
                const failedCount = (currentUser.failedMpinAttempts || 0) + 1;
                const failTime = new Date().toLocaleString();

                await update(ref(db, `users/${currentUser.uid}`), {
                    failedMpinAttempts: failedCount,
                    lastFailedMpinAttempt: failTime
                });
                // Update local state to show alert immediately
                setCurrentUser(prev => prev ? { ...prev, failedMpinAttempts: failedCount, lastFailedMpinAttempt: failTime } : null);

                // Check for Ban
                try {
                    const settingsSnap = await get(ref(db, 'settings/maxMpinAttempts'));
                    const maxAttempts = settingsSnap.exists() ? settingsSnap.val() : DEFAULT_MAX_ATTEMPTS;

                    if (failedCount >= maxAttempts) {
                        await banCurrentDevice("Maximum MPIN attempts exceeded.");
                    }
                } catch (e) {
                    console.error("Failed to check max attempts", e);
                }
            }
            return false;
        }
    };

    const setupMpin = async (mpin: string) => {
        if (!currentUser) return;
        await update(ref(db, `users/${currentUser.uid}`), {
            mpin: mpin,
            canChangeMpin: false, // Lock changes after setup
            mpinResetRequested: false
        });
        // Update local state immediately to reflect changes
        setCurrentUser(prev => prev ? { ...prev, mpin } : null);
        setIsAppLocked(false);
    };

    const requestMpinReset = async () => {
        if (!currentUser) return;
        await update(ref(db, `users/${currentUser.uid}`), {
            mpinResetRequested: true
        });
        alert("Reset request sent to Admin.");
    };

    const clearSecurityAlerts = async (mpin: string): Promise<boolean> => {
        if (!currentUser?.mpin || !currentUser.uid) return false;
        if (currentUser.mpin === mpin) {
            await update(ref(db, `users/${currentUser.uid}`), {
                failedMpinAttempts: 0,
                lastFailedMpinAttempt: null
            });
            // Update local state to remove alert immediately
            setCurrentUser(prev => prev ? { ...prev, failedMpinAttempts: 0, lastFailedMpinAttempt: undefined } : null);
            return true;
        }
        return false;
    };

    const updateListeningStatus = async (track: import('../types').Track | null) => {
        if (!currentUser?.uid) return;

        try {
            const updates: any = {
                listeningTo: track,
                listeningSince: track ? new Date().toISOString() : null
            };

            // Increment count & LOG HISTORY if starting a new track
            if (track) {
                // Check if it's a new track session (different from what's currently stored or just starting)
                // Note: currentUser.listeningTo might be stale if we just updated it locally but this function is called rapidly.
                // However, for typical music playback, this overhead is fine.
                if (currentUser.listeningTo?.id !== track.id) {
                    const currentCount = currentUser.totalPlayCount || 0;
                    updates.totalPlayCount = currentCount + 1;

                    // --- ADD LOG ENTRY ---
                    const historyRef = ref(db, 'music_logs');
                    await push(historyRef, {
                        userId: currentUser.uid,
                        userName: currentUser.displayName || 'Anonymous',
                        userPhoto: currentUser.photoURL || '',
                        trackId: track.id,
                        trackTitle: track.title,
                        trackArtist: track.artist,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            await update(ref(db, `users/${currentUser.uid}`), updates);

            // Local update strictly for speed
            setCurrentUser(prev => prev ? { ...prev, ...updates } : null);

        } catch (e) {
            console.error("Failed to update listening status", e);
        }
    };

    // Force loading to complete after 10 seconds to prevent white screen
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Auth loading timed out, forcing render");
                setLoading(false);
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [loading]);

    // Render banned screen if user is banned
    if (isBanned) {
        return (
            <div className="min-h-screen bg-red-900 flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">This device has been banned for security violations.</p>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm font-medium">
                        Reason: {banReason}
                    </div>
                </div>
            </div>
        );
    }

    // Simple Spinner for Auth Loading
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-rose-50">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            currentUser, loading, authError,
            loginWithGoogle, loginWithEmail, signupWithEmail, logout,
            isAdmin: currentUser?.role === 'admin' && !viewAsUser,
            viewAsUser, toggleViewMode, banCurrentDevice,
            isAppLocked, lockApp, unlockApp, setupMpin, requestMpinReset, clearSecurityAlerts, hasPermission,
            updateListeningStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};
