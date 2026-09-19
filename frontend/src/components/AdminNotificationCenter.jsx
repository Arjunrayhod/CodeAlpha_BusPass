import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Volume2, VolumeX, Play, CheckCircle2, Ticket, 
  Trash2, X, AlertCircle, Smartphone, Radio, Sparkles, Zap
} from 'lucide-react';
import { 
  triggerAdminBookingAlert, 
  speakNotification, 
  isNativeAndroid, 
  sendSystemNotification, 
  playNotificationChime 
} from '../utils/voiceAssistant';

export default function AdminNotificationCenter({ bookings = [], onSelectBookingTab }) {
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('bus_voice_enabled') !== 'false';
  });
  const [voiceLang, setVoiceLang] = useState(() => {
    return localStorage.getItem('bus_voice_lang') || 'hi-IN';
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('bus_admin_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track initial bookings
  const knownBookingIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('bus_voice_enabled', voiceEnabled);
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('bus_voice_lang', voiceLang);
  }, [voiceLang]);

  useEffect(() => {
    try {
      localStorage.setItem('bus_admin_notifications', JSON.stringify(notifications.slice(0, 30)));
    } catch (_) {}
  }, [notifications]);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Populate initial recent bookings into notification list if list is empty
  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Record all existing bookings in known set
      bookings.forEach(b => knownBookingIdsRef.current.add(b.id));

      if (notifications.length === 0) {
        // Pre-fill with top 5 recent bookings so notifications tab is never empty!
        const initialList = bookings.slice(0, 5).map(b => ({
          id: `notif_init_${b.id}`,
          bookingId: b.id,
          title: `Ticket: ${b.user_name || b.name || 'Passenger'}`,
          summary: `${b.source} ➔ ${b.destination} | ₹${b.fare || b.price || 0}`,
          passenger: b.user_name || b.name || 'Passenger',
          source: b.source,
          destination: b.destination,
          fare: b.fare || b.price || 0,
          time: 'Recent',
          read: true
        }));
        setNotifications(initialList);
      }
      isFirstLoadRef.current = false;
    }
  }, [bookings]);

  // Detect newly booked tickets live
  useEffect(() => {
    if (!bookings || bookings.length === 0 || isFirstLoadRef.current) return;

    const newBookings = bookings.filter(b => !knownBookingIdsRef.current.has(b.id));

    if (newBookings.length > 0) {
      newBookings.forEach(booking => {
        knownBookingIdsRef.current.add(booking.id);

        const alertData = triggerAdminBookingAlert({
          booking,
          lang: voiceLang,
          voiceEnabled
        });

        const newNotif = {
          id: `notif_${Date.now()}_${booking.id}`,
          bookingId: booking.id,
          title: alertData.title,
          summary: alertData.summary,
          passenger: booking.user_name || booking.name || 'Passenger',
          source: booking.source,
          destination: booking.destination,
          fare: booking.fare || booking.price || 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false
        };

        setNotifications(prev => [newNotif, ...prev]);
        setActiveToast(newNotif);
        setTimeout(() => setActiveToast(null), 8000);
      });
    }
  }, [bookings, voiceLang, voiceEnabled]);

  const handleTestVoice = (e) => {
    if (e) e.stopPropagation();
    setIsSpeaking(true);
    playNotificationChime();
    
    const testText = voiceLang.startsWith('hi') 
      ? 'क्लाउड बस वॉइस असिस्टेंट एक्टिव है। नए टिकट बुक होने पर मैं ऐसे ही बोलकर बताऊँगा।'
      : 'Cloud Bus Voice Assistant is active. When a new ticket is booked, I will announce it like this.';
    
    sendSystemNotification('CloudBus Voice Assistant', testText, 'test_alert');
    
    setTimeout(() => {
      speakNotification(testText, voiceLang);
      setTimeout(() => setIsSpeaking(false), 4000);
    }, 300);
  };

  const handleSimulateBooking = (e) => {
    if (e) e.stopPropagation();
    const demoBooking = {
      id: Math.floor(1000 + Math.random() * 9000),
      user_name: 'Rahul Sharma',
      source: 'Indore',
      destination: 'Bhopal',
      fare: 250
    };

    const alertData = triggerAdminBookingAlert({
      booking: demoBooking,
      lang: voiceLang,
      voiceEnabled: true
    });

    const newNotif = {
      id: `notif_demo_${Date.now()}`,
      bookingId: demoBooking.id,
      title: alertData.title,
      summary: alertData.summary,
      passenger: demoBooking.user_name,
      source: demoBooking.source,
      destination: demoBooking.destination,
      fare: demoBooking.fare,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    setTimeout(() => setActiveToast(null), 8000);
  };

  const handleReplay = (notif, e) => {
    if (e) e.stopPropagation();
    setIsSpeaking(true);
    playNotificationChime();
    const text = voiceLang.startsWith('hi')
      ? `टिकट अलर्ट। यात्री ${notif.passenger}, रूट ${notif.source} से ${notif.destination}, किराया ${notif.fare} रुपये।`
      : `Ticket Alert. Passenger ${notif.passenger}, Route ${notif.source} to ${notif.destination}, Fare ${notif.fare} rupees.`;
    setTimeout(() => {
      speakNotification(text, voiceLang);
      setTimeout(() => setIsSpeaking(false), 3500);
    }, 300);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('bus_admin_notifications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Voice Assistant Controls */}
      <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1 shadow-inner text-xs">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            voiceEnabled 
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
              : 'text-slate-400 hover:text-white'
          }`}
          title={voiceEnabled ? 'Voice Assistant Active (Click to mute)' : 'Voice Assistant Muted (Click to enable)'}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-slate-950' : ''}`} />
              <span className="hidden sm:inline">Voice ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Muted</span>
            </>
          )}
        </button>

        {voiceEnabled && (
          <div className="flex items-center ml-1 space-x-1">
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="bg-slate-800 text-slate-200 border-none text-[11px] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-400"
            >
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="en-US">English</option>
            </select>

            <button
              onClick={handleTestVoice}
              className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              title="Test Voice Announcement"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Test AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications Bell Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
          }}
          className="relative p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-2xl transition shadow-md cursor-pointer"
          title="Notifications & Booking Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white shadow-lg animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Drawer */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-200 backdrop-blur-lg animate-fadeIn">
            {/* Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Notifications & Alerts</h3>
                  <p className="text-[10px] text-slate-400">
                    {isNativeAndroid() ? '📱 Android Phone Sync Active' : '💻 Live AI Voice Active'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateBooking}
                  className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Simulate a test ticket booking"
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>Demo Alert</span>
                </button>

                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold p-1 transition cursor-pointer"
                    title="Clear All"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">No Notifications Yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click "Demo Alert" above to test real-time voice and sound alerts!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3.5 hover:bg-slate-800/50 transition flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0 mt-0.5">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{notif.passenger}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {notif.source} ➔ {notif.destination}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          ₹{notif.fare}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleReplay(notif, e)}
                            className="px-2 py-1 bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 rounded-lg transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Speak Alert"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Speak</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AI Voice Announcer Active
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Real-Time Toast Banner on New Ticket */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-gradient-to-r from-slate-900 to-indigo-950 border border-emerald-500/40 text-white rounded-3xl shadow-2xl p-4 animate-bounce-short">
          <div className="flex items-start justify-between gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-lg shadow-emerald-500/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">New Ticket Booked!</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">{activeToast.passenger}</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeToast.source} ➔ {activeToast.destination} (₹{activeToast.fare})
              </p>
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
