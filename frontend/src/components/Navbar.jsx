import React, { useState } from 'react';
import { Bus, Ticket, ShieldCheck, LogIn, LogOut, Menu, X, Globe, ScanLine, Languages } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentView, setCurrentView, onOpenScanner }) {
  const { user, isAdmin, logout } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getNavItemClass = (viewName) => {
    const isActive = currentView === viewName;
    return `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-40 shadow-lg border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
                CloudBus
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider text-blue-300 uppercase bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800">
                Transit Network
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => setCurrentView('home')} 
              className={getNavItemClass('home')}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>{t('nav_routes')}</span>
            </button>

            {user && (
              <button 
                onClick={() => setCurrentView('my-tickets')} 
                className={getNavItemClass('my-tickets')}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>{t('nav_my_tickets')}</span>
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setCurrentView('admin')} 
                className={getNavItemClass('admin')}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('nav_admin')}</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            
            {/* Conductor Scanner Shortcut (Visible only to Admin/Conductors) */}
            {isAdmin && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Open QR Scanner"
              >
                <ScanLine className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('nav_scanner')}</span>
              </button>
            )}

            {/* Language Switcher Button (EN / हिन्दी) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700/80 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Toggle English / Hindi"
            >
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-800/80 py-1 px-3 rounded-2xl border border-slate-700">
                <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-xs text-left">
                  <div className="font-bold text-slate-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-blue-400 leading-tight capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t('nav_login')}</span>
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {t('nav_register')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold"
            >
              {lang === 'en' ? 'हिन्दी' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
          <button
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Bus className="w-4 h-4 text-blue-400" />
            <span>{t('nav_routes')}</span>
          </button>
          {user && (
            <button
              onClick={() => { setCurrentView('my-tickets'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-indigo-400" />
              <span>{t('nav_my_tickets')}</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { setCurrentView('admin'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-400 hover:bg-slate-800 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('nav_admin')}</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => { onOpenScanner(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-blue-300 hover:bg-slate-800 cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-blue-400" />
              <span>{t('nav_scanner')}</span>
            </button>
          )}
          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 text-xs font-bold text-red-400 bg-red-950/50 border border-red-900 rounded-xl cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => { setCurrentView('login'); setMobileMenuOpen(false); }}
                  className="py-2 text-center text-xs font-bold text-slate-200 bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t('nav_login')}
                </button>
                <button
                  onClick={() => { setCurrentView('register'); setMobileMenuOpen(false); }}
                  className="py-2 text-center text-xs font-bold text-white bg-blue-600 rounded-xl cursor-pointer"
                >
                  {t('nav_register')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}