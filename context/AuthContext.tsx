import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../src/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get, set, child } from 'firebase/database';
import { UserProfile } from '../types';
import { INITIAL_ADMIN_EMAILS } from '../constants';

interface AuthContextType {
    currentUser: UserProfile | null;
    loading: boolean;
    authError: string;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    viewAsUser: boolean;
    toggleViewMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
    currentUser: null,
    loading: true,
    authError: '',
    loginWithGoogle: async () => { },
    loginWithEmail: async () => { },
    logout: async () => { },
    isAdmin: false,
    viewAsUser: false,
    toggleViewMode: () => { }
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewAsUser, setViewAsUser] = useState(false);
    const [authError, setAuthError] = useState<string>('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            setAuthError('');
            if (user) {
                // Fetch dynamic admin list
                const adminListRef = ref(db, 'settings/adminEmails');
                const adminSnapshot = await get(adminListRef);
                const adminEmails = adminSnapshot.exists() ? adminSnapshot.val() : INITIAL_ADMIN_EMAILS;

                // Fetch custom role from DB
                const userRef = ref(db, `users/${user.uid}`);
                const snapshot = await get(userRef);

                let role: 'admin' | 'user' = 'user';
                const isAdminEmail = user.email && (Array.isArray(adminEmails) ? adminEmails.includes(user.email) : false);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    role = userData.role;

                    // Force update if in admin list but role is not admin in DB
                    if (isAdminEmail && role !== 'admin') {
                        role = 'admin';
                        await set(child(userRef, 'role'), 'admin');
                    }

                    setCurrentUser({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        role: role
                    });
                } else {
                    // If first login (no DB record), strictly check if allowed (Admin)
                    // "New sign is not allowed" rule
                    if (isAdminEmail) {
                        role = 'admin';

                        await set(userRef, {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: role,
                            lastLogin: new Date().toISOString()
                        });

                        setCurrentUser({
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: role
                        });
                    } else {
                        // START BLOCK: Unauthorized User
                        console.warn(`Blocked unauthorized sign-up attempt: ${user.email}`);
                        await signOut(auth);
                        setCurrentUser(null);
                        setAuthError("Access Denied: This site is only accessible by some special persons. ✨");
                        setLoading(false);
                        return;
                        // END BLOCK
                    }
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setAuthError('');
        try {
            await signInWithPopup(auth, googleProvider);
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

    const logout = async () => {
        await signOut(auth);
    };

    const toggleViewMode = () => {
        setViewAsUser(prev => !prev);
    }

    const value = {
        currentUser,
        loading,
        authError,
        loginWithGoogle,
        loginWithEmail,
        logout,
        isAdmin: currentUser?.role === 'admin' && !viewAsUser,
        viewAsUser,
        toggleViewMode
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
