// Utility for Voice Assistant (TTS), Phone Push/Local Notifications, and Alert Chimes

export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (pleasant high chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second harmonic tone
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      } catch (_) {}
    }, 120);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};

export const isNativeAndroid = () => {
  return typeof window !== 'undefined' && !!window.AndroidBridge;
};

export const speakNotification = (text, lang = 'hi-IN') => {
  if (!text) return;

  // 1. If inside Android WebView with native bridge
  if (isNativeAndroid() && window.AndroidBridge.speak) {
    try {
      window.AndroidBridge.speak(text, lang);
      return;
    } catch (e) {
      console.warn('Native speak failed, falling back to Web Speech API', e);
    }
  }

  // 2. Web Speech API fallback for Desktop/Mobile Browsers
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = lang === 'hi-IN' || lang === 'hi' ? 'hi-IN' : 'en-US';

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchedVoice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
        if (matchedVoice) utterance.voice = matchedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Web Speech API error:', e);
    }
  }
};

export const sendSystemNotification = (title, message, tag = 'bus_alert') => {
  if (isNativeAndroid() && window.AndroidBridge.showNotification) {
    try {
      window.AndroidBridge.showNotification(title, message, tag);
      return;
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: tag
        });
      } catch (_) {}
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message, tag: tag });
        }
      });
    }
  }
};

export const triggerAdminBookingAlert = ({ booking, lang = 'hi-IN', voiceEnabled = true }) => {
  if (!booking) return;

  const passenger = booking.user_name || booking.name || 'यात्री';
  const source = booking.source || 'सोर्स';
  const dest = booking.destination || 'डेस्टिनेशन';
  const fare = booking.fare || booking.price || booking.amount || '';
  const bookingId = booking.id ? `#BP-${String(booking.id).padStart(6, '0')}` : '';

  const title = `🎟️ New Ticket Booked: ${passenger}`;
  const summary = `${source} ➔ ${dest} | ₹${fare} (${bookingId})`;

  const speechHindi = `ध्यान दें! नया टिकट बुक हुआ है। यात्री ${passenger}, रूट ${source} से ${dest}, किराया ${fare} रुपये।`;
  const speechEnglish = `Attention! New ticket booked by ${passenger}, route ${source} to ${dest}, amount ${fare} rupees.`;
  const speechText = lang.startsWith('hi') ? speechHindi : speechEnglish;

  playNotificationChime();
  sendSystemNotification(title, summary, `booking_${booking.id || Date.now()}`);

  if (voiceEnabled) {
    setTimeout(() => {
      speakNotification(speechText, lang);
    }, 400);
  }

  return { title, summary, speechText, time: new Date() };
};
