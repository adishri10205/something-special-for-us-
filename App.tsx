import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { AppState } from './types';

// Lazy Load Pages for Performance Optimization
// Lazy Load Pages for Performance Optimization
const Intro = lazy(() => import('./pages/Intro'));
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Reels = lazy(() => import('./pages/Reels'));
const MusicPage = lazy(() => import('./pages/Music'));
const Message = lazy(() => import('./pages/Message'));
const Notes = lazy(() => import('./pages/Notes'));
const Vault = lazy(() => import('./pages/Vault'));
const Links = lazy(() => import('./pages/Links'));
const Flipbook = lazy(() => import('./pages/Flipbook'));
const Videos = lazy(() => import('./pages/Videos'));
const VoiceNotes = lazy(() => import('./pages/VoiceNotes'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appState } = useApp();
  const { currentUser, loading } = useAuth(); // removed loginWithGoogle usage

  if (loading) return <LoadingSpinner />;

  if (appState === AppState.INTRO) {
    return <Navigate to="/" replace />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-rose-50">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
  </div>
);

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Intro />} />
        {/* Redirect to home if already logged in */}
        <Route path="/login" element={currentUser ? <Navigate to="/home" replace /> : <Login />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
          <Route path="/voice-notes" element={<ProtectedRoute><VoiceNotes /></ProtectedRoute>} />
          <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
          <Route path="/special" element={<ProtectedRoute><Message /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
          <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
          <Route path="/flipbook" element={<ProtectedRoute><Flipbook /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <DataProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </DataProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;