import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MyTickets from './pages/MyTickets';
import AdminDashboard from './pages/AdminDashboard';
import BookingModal from './components/BookingModal';
import QRScannerModal from './components/QRScannerModal';
import SupportChatModal from './components/SupportChatModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Bus, ShieldCheck, Github, Linkedin, Mail, Heart, MessageSquare } from 'lucide-react';

function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [bookingRoute, setBookingRoute] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === 'home' && (
          <Home 
            onSelectRoute={(route) => setBookingRoute(route)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentView === 'my-tickets' && (
          <MyTickets 
            onExploreRoutes={() => setCurrentView('home')} 
          />
        )}

        {currentView === 'admin' && (
          isAdmin ? (
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-md mx-auto">
              <ShieldCheck className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-slate-800">Admin Access Required</h2>
              <p className="text-xs text-slate-500 mt-1">Please login with an administrator account to view this section.</p>
              <button 
                onClick={() => setCurrentView('login')}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Go to Login
              </button>
            </div>
          )
        )}

        {currentView === 'login' && (
          <Login 
            onNavigateRegister={() => setCurrentView('register')}
            onSuccess={() => setCurrentView('home')}
          />
        )}

        {currentView === 'register' && (
          <Register 
            onNavigateLogin={() => setCurrentView('login')}
            onSuccess={() => setCurrentView('home')}
          />
        )}
      </main>

      {/* Booking Modal */}
      {bookingRoute && (
        <BookingModal
          route={bookingRoute}
          onClose={() => setBookingRoute(null)}
          onNavigateLogin={() => setCurrentView('login')}
          onSuccess={() => {}}
        />
      )}

      {/* Conductor QR Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal onClose={() => setIsScannerOpen(false)} />
      )}

      {/* Passenger Helpdesk & Support Modal */}
      {isSupportOpen && !isAdmin && (
        <SupportChatModal 
          onClose={() => setIsSupportOpen(false)}
          onNavigateLogin={() => setCurrentView('login')}
        />
      )}

      {/* Floating Support Button (Compact Circular Icon - Never blocks GitHub or footer links) */}
      {!isAdmin && (
        <button
          onClick={() => setIsSupportOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 group border-2 border-white/30 cursor-pointer"
          title="Need Help? Chat with Support"
          aria-label="Help & Support"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
        </button>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Bus className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-black text-slate-100 text-sm">CloudBus Transit</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-slate-400">Developed with <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-rose-500 mx-0.5" /> by <strong className="text-slate-200 font-semibold">Arjun Rathod</strong></span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a 
              href="https://www.linkedin.com/in/arjun-rathod-offical/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 border border-slate-700/60 rounded-xl transition font-medium text-slate-300"
            >
              <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              <span>LinkedIn</span>
            </a>
            <a 
              href="https://github.com/Arjunrayhod" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-xl transition font-medium text-slate-300"
            >
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span>GitHub</span>
            </a>
            <a 
              href="mailto:rathodarjun2513@gmail.com" 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 border border-slate-700/60 rounded-xl transition font-medium text-slate-300"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
