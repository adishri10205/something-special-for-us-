import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useEmotion } from '../context/EmotionContext';
import { AppState } from '../types';
import MPINGate from './MPINGate';

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center bg-rose-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
    </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appState } = useApp();
    const { currentUser, loading, isAdmin } = useAuth();
    const { hasAccess, loading: emotionLoading } = useEmotion();
    const location = useLocation();

    if (loading || emotionLoading) return <LoadingSpinner />;

    if (appState === AppState.INTRO) {
        return <Navigate to="/" replace />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Emotion-based access control
    // Allow access to Home, Profile, and AccessDenied pages always
    const allowedRoutes = ['/home', '/emotion-profile', '/access-denied'];
    const isAllowedRoute = allowedRoutes.includes(location.pathname);

    // If user doesn't have access and is not admin, redirect to access denied page
    if (!isAdmin && !hasAccess && !isAllowedRoute) {
        return <Navigate to="/access-denied" replace />;
    }

    return (
        <MPINGate>
            {children}
        </MPINGate>
    );
};

export default ProtectedRoute;
