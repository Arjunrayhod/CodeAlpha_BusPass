// Multi-Tier Bulletproof Voice Assistant & Notifications Engine

let currentAudio = null;

export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      } catch (_) {}
    }, 120);
  } catch (e) {
    console.warn('Chime audio error:', e);
  }
};

export const isNativeAndroid = () => {
  return typeof window !== 'undefined' && !!window.AndroidBridge;
};

// Web Speech API fallback
const fallbackWebSpeech = (text, lang) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = lang.startsWith('hi') ? 'hi-IN' : 'en-US';

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matched = voices.find(v => v.lang.toLowerCase().startsWith(lang.substring(0, 2)));
      if (matched) utterance.voice = matched;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
};

// Main Speak Function with Online Natural TTS + Native Android Bridge + Web Speech API
export const speakNotification = (text, lang = 'hi-IN') => {
  if (!text) return;

  // Stop any currently playing audio TTS
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio = null;
    } catch (_) {}
  }

  // Tier 1: Native Android Bridge (for installed Android APK)
  if (isNativeAndroid() && window.AndroidBridge.speak) {
    try {
      window.AndroidBridge.speak(text, lang);
      return;
    } catch (e) {
      console.warn('Native speak failed:', e);
    }
  }

  // Tier 2: Google TTS Audio Stream (High Quality Natural Voice for Hindi & English)
  try {
    const langCode = lang.startsWith('hi') ? 'hi' : 'en';
    const cleanText = text.substring(0, 180);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn('Audio TTS autoplay prevented, trying WebSpeech API...', err);
        fallbackWebSpeech(text, lang);
      });
    }
    return;
  } catch (err) {
    console.warn('Audio element error:', err);
  }

  // Tier 3: Web Speech API Fallback
  fallbackWebSpeech(text, lang);
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

  const title = `🎟️ New Booking: ${passenger}`;
  const summary = `${source} ➔ ${dest} | ₹${fare} (${bookingId})`;

  const speechHindi = `ध्यान दें! नया टिकट बुक हुआ है। यात्री ${passenger}, रूट ${source} से ${dest}, किराया ${fare} रुपये।`;
  const speechEnglish = `Attention! New ticket booked by ${passenger}, route ${source} to ${dest}, amount ${fare} rupees.`;
  const speechText = lang.startsWith('hi') ? speechHindi : speechEnglish;

  playNotificationChime();
  sendSystemNotification(title, summary, `booking_${booking.id || Date.now()}`);

  if (voiceEnabled) {
    setTimeout(() => {
      speakNotification(speechText, lang);
    }, 450);
  }

  return { title, summary, speechText, time: new Date() };
};
