import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AppState } from '../types';
import MPINGate from './MPINGate';

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center bg-rose-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
    </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { appState } = useApp();
    const { currentUser, loading } = useAuth();

    if (loading) return <LoadingSpinner />;

    if (appState === AppState.INTRO) {
        return <Navigate to="/" replace />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <MPINGate>
            {children}
        </MPINGate>
    );
};

export default ProtectedRoute;
