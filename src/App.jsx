import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import TranslateWrapper from './components/TranslateWrapper';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BoardListPage from './pages/BoardListPage';
import BoardPage from './pages/BoardPage';
import PostDetailPage from './pages/PostDetailPage';
import PostWritePage from './pages/PostWritePage';
import LoginPage from './pages/LoginPage';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-id.apps.googleusercontent.com';

function App() {
  const content = (
    <LanguageProvider>
      <AuthProvider>
        <TranslateWrapper />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="boards" element={<BoardListPage />} />
            <Route path="board/:boardKey" element={<BoardPage />} />
            <Route path="post/:id" element={<PostDetailPage />} />
            <Route path="post/new" element={<PostWritePage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}

export default App;
