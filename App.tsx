import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider, useData } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HeaderProvider } from './context/HeaderContext';
import Layout from './components/Layout';
import MPINGate from './components/MPINGate';
import InstallPrompt from './components/InstallPrompt';
import { AppState } from './types';

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

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-rose-50">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
  </div>
);

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();
  const { siteTitle } = useData();

  React.useEffect(() => {
    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [siteTitle]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Intro />} />
        {/* Redirect to home if already logged in */}
        <Route path="/login" element={<Login />} />

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
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
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
          <HeaderProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </HeaderProvider>
        </DataProvider>
      </AuthProvider>
    </AppProvider>
  );
};

export default App;
