import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AlertTriangle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import TrendingTracker from './pages/TrendingTracker';
import ScanHistory from './pages/ScanHistory';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import SpaceGlobe from './components/SpaceGlobe';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Authenticate user on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (jwtToken, userData) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center flex-col gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium tracking-wide">Securing connection to Veritas AI...</p>
      </div>
    );
  }

  // Helper route wrapper for logged-in users
  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/auth" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="min-h-screen text-slate-100 relative">
        {/* Three.js 3D Cosmic Neural Background Globe */}
        <SpaceGlobe />

        {/* Backdrop Underlay for Grid & Nebula Glows */}
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#11111b]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180, 190, 254, 0.04) 1.5px, transparent 0)',
            backgroundSize: '28px 28px'
          }} />
          <div className="nebula-glow nebula-glow-pink"></div>
          <div className="nebula-glow nebula-glow-teal"></div>
        </div>

        {/* Main Content Wrapper (stacked in front of canvas) */}
        <div className="relative z-10 min-h-screen flex flex-col pointer-events-auto">
          <Navbar user={user} logout={logout} />
          
          {user && !user.emailVerified && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Your email address is unverified. Please check your console log to retrieve the verification link.
              </span>
            </div>
          )}
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
            <Routes>
              <Route path="/" element={<Dashboard token={token} user={user} />} />
              <Route path="/trending" element={<TrendingTracker />} />
              <Route 
                path="/auth" 
                element={
                  (!token || new URLSearchParams(window.location.search).has('verifyToken') || new URLSearchParams(window.location.search).has('resetToken')) 
                    ? <Auth login={login} /> 
                    : <Navigate to="/" replace />
                } 
              />
              
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics token={token} />
                </ProtectedRoute>
              } />
              
              <Route path="/history" element={
                <ProtectedRoute>
                  <ScanHistory token={token} />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile token={token} user={user} updateProfile={updateProfile} />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          <footer className="py-6 border-t border-slate-900 bg-[#07080c]/60 backdrop-blur-xs text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Veritas AI - Explainable Fake News Detection Platform. Built for placements, hackathons, and portfolios.</p>
          </footer>
        </div>
      </div>
    </Router>
  );
}
