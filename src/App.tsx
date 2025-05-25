import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  const { setUser } = useAuthStore();
  const { mode } = useThemeStore();
  
  useEffect(() => {
    // Update the theme on the document
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        setUser(null);
      }
    });
    
    return () => unsubscribe();
  }, [setUser]);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="library" element={<Library />} />
          <Route path="upload" element={<Upload />} />
          <Route path="analysis/:songId" element={<Analysis />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;