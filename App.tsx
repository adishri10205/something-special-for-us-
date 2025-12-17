import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Intro from './pages/Intro';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import Gallery from './pages/Gallery';
import Reels from './pages/Reels';
import MusicPage from './pages/Music';
import Message from './pages/Message';
import Notes from './pages/Notes';
import Vault from './pages/Vault';
import Links from './pages/Links';
import Admin from './pages/Admin';
import { AppState } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appState } = useApp();
  if (appState === AppState.INTRO) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Intro />} />

      <Route element={<Layout />}>
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/journey" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
        <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
        <Route path="/special" element={<ProtectedRoute><Message /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="/links" element={<ProtectedRoute><Links /></ProtectedRoute>} />
        <Route path="/admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <DataProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AppProvider>
  );
};

export default App;