import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, BarChart3, TrendingUp, History, User, LogOut, Menu, X, KeyRound } from 'lucide-react';

export default function Navbar({ user, logout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Detector', path: '/', icon: ShieldAlert, protected: false },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, protected: true },
    { name: 'Trending Tracker', path: '/trending', icon: TrendingUp, protected: false },
    { name: 'Scan History', path: '/history', icon: History, protected: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-white/5 bg-[#0a0b10]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 transition-all">
                <ShieldAlert className="h-6 w-6 text-indigo-400 group-hover:scale-105 transition-transform" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                VERITAS AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              if (link.protected && !user) return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Authenticated User / Login Portal Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive('/profile')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <User className="h-4 w-4" />
                  {user.name.split(' ')[0]}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center justify-center p-2 rounded-xl border text-slate-450 hover:text-white transition-all duration-300"
                  style={{
                    borderColor: 'rgba(244, 63, 94, 0.4)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 63, 94, 0.6)';
                    e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.8)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
                  }}
                  title="Logout Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 bg-transparent text-white px-5 py-2 rounded-xl text-xs uppercase font-bold tracking-wider border-2 transition-all duration-300"
                style={{
                  borderColor: '#6366f1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px #6366f1, 0 0 30px #a855f7';
                  e.currentTarget.style.backgroundColor = '#6366f1';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 bg-[#0a0b10]/95 backdrop-blur-xl animate-in slide-in-from-top-5 duration-200">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              if (link.protected && !user) return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
            
            {/* Mobile Auth Button */}
            <div className="pt-4 border-t border-slate-900 mt-2 px-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-slate-300 font-medium">
                    <User className="h-5 w-5 text-indigo-400" />
                    <span>{user.name}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 text-center bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-medium"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl text-sm font-medium"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white w-full py-3 rounded-xl font-semibold text-center"
                >
                  <KeyRound className="h-5 w-5" />
                  Sign In to Portal
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
