import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    brand_name: 'CloudBus Transit',
    brand_subtitle: 'CodeAlpha Internship Project',
    nav_routes: 'Explore Routes',
    nav_my_tickets: 'My Passes & Tickets',
    nav_admin: 'Admin Portal',
    nav_scanner: 'Conductor Scanner',
    nav_login: 'Sign In',
    nav_register: 'Register',
    nav_logout: 'Sign Out',
    
    // Hero
    hero_title: 'Smart Cloud Bus Pass & E-Ticketing',
    hero_sub: 'Book single journey tickets or student concession monthly passes with digital QR verification and instant printable PDF boarding passes.',
    hero_search_placeholder: 'Search by city, source, or destination...',
    hero_filter_all: 'All Routes',
    
    // Booking
    modal_title: 'Book Bus Pass / Ticket',
    modal_select_seat: 'Select Seat',
    modal_pass_type: 'Pass / Ticket Category',
    modal_single: 'Single Journey (1-Way)',
    modal_daily: '1-Day Unlimited Pass',
    modal_student: 'Student Concession Monthly Pass (50% OFF)',
    modal_monthly: 'Monthly Commuter Pass (30 Days)',
    modal_student_id: 'Student College / School ID Number',
    modal_travel_date: 'Travel Date',
    modal_book_now: 'Confirm & Generate Pass',
    modal_total_fare: 'Total Amount Payable',
    modal_assigned_seat: 'Selected Seat',
    
    // Tickets
    my_passes_title: 'My Passes & Digital Tickets',
    my_passes_sub: 'Access scannable QR passes, download printable PDF tickets, or cancel mistake bookings.',
    download_pdf: 'Download PDF',
    view_qr: 'View QR Code',
    cancel_pass: 'Cancel / Delete Pass',
    cancel_confirm: 'Are you sure you want to cancel this bus pass? Your seat will be freed up for others.',
    cancel_success: 'Pass successfully cancelled and seat released.',
    offline_badge: 'Cached for Offline Access',
    
    // Map & Tracker
    track_live_bus: 'Live GPS Bus Tracker',
    bus_on_route: 'Bus in Transit',
    stops_included: 'Stops & Route Corridor',
    simulated_live: 'Simulated Real-time GPS Position',
    
    // Scanner
    scanner_title: 'Conductor QR Scanner & Ticket Validator',
    scanner_sub: 'Scan passenger digital QR code or enter ticket ID manually to verify validity and board passenger.',
    scanner_manual_search: 'Enter Ticket ID (e.g. BP-000001 or 1)',
    scanner_valid: 'PASS VALID & ACTIVE',
    scanner_expired: 'PASS EXPIRED / INVALID',
    scanner_boarded: 'ALREADY BOARDED',
    scanner_mark_boarded: 'Mark Passenger as Boarded',
    
    // Admin
    admin_title: 'Transit Administration & Control Center',
    admin_tab_routes: 'Route Management',
    admin_tab_bookings: 'All Bookings Audit',
    admin_tab_analytics: 'Visual Analytics',
    admin_tab_users: 'User Directory',
  },
  hi: {
    brand_name: 'क्लाउडबस ट्रांजिट',
    brand_subtitle: 'कोडअल्फा इंटर्नशिप प्रोजेक्ट',
    nav_routes: 'रूट्स देखें',
    nav_my_tickets: 'मेरे पास और टिकट',
    nav_admin: 'एडमिन पोर्टल',
    nav_scanner: 'कंडक्टर स्कैनर',
    nav_login: 'लॉग इन करें',
    nav_register: 'रजिस्टर करें',
    nav_logout: 'लॉग आउट',
    
    // Hero
    hero_title: 'स्मार्ट क्लाउड बस पास और ई-टिकटिंग प्रणाली',
    hero_sub: 'सिंगल यात्रा टिकट या 50% छूट वाला छात्र मासिक पास बुक करें। डिजिटल क्यूआर वेरिफिकेशन और प्रिंटेबल पीडीएफ पास तुरंत प्राप्त करें।',
    hero_search_placeholder: 'शहर, प्रस्थान या गंतव्य खोजें...',
    hero_filter_all: 'सभी रूट्स',
    
    // Booking
    modal_title: 'बस पास / टिकट बुक करें',
    modal_select_seat: 'सीट चुनें',
    modal_pass_type: 'पास / टिकट श्रेणी',
    modal_single: 'सिंगल यात्रा (1-तरफा)',
    modal_daily: '1-दिवसीय असीमित पास',
    modal_student: 'छात्र रियायती मासिक पास (50% छूट)',
    modal_monthly: 'मासिक कम्यूटर पास (30 दिन)',
    modal_student_id: 'छात्र कॉलेज / स्कूल आईडी नंबर',
    modal_travel_date: 'यात्रा की तारीख',
    modal_book_now: 'कन्फर्म करें और पास बनाएं',
    modal_total_fare: 'कुल देय राशि',
    modal_assigned_seat: 'चुनी गई सीट',
    
    // Tickets
    my_passes_title: 'मेरे पास और डिजिटल टिकट',
    my_passes_sub: 'स्कैन करने योग्य क्यूआर पास देखें, पीडीएफ डाउनलोड करें या गलती से बुक हुआ पास रद्द करें।',
    download_pdf: 'पीडीएफ डाउनलोड करें',
    view_qr: 'क्यूआर कोड देखें',
    cancel_pass: 'पास रद्द / डिलीट करें',
    cancel_confirm: 'क्या आप वाकई इस बस पास को रद्द करना चाहते हैं? आपकी सीट दूसरों के लिए खाली हो जाएगी।',
    cancel_success: 'पास सफलतापूर्वक रद्द कर दिया गया और सीट खाली कर दी गई।',
    offline_badge: 'ऑफलाइन उपयोग के लिए सुरक्षित',
    
    // Map & Tracker
    track_live_bus: 'लाइव जीपीएस बस ट्रैकर',
    bus_on_route: 'मार्ग पर बस',
    stops_included: 'मार्ग और ठहराव',
    simulated_live: 'रीयल-टाइम जीपीएस स्थिति',
    
    // Scanner
    scanner_title: 'कंडक्टर क्यूआर स्कैनर और टिकट सत्यापन',
    scanner_sub: 'यात्री का क्यूआर कोड स्कैन करें या टिकट आईडी दर्ज करके सत्यापन करें।',
    scanner_manual_search: 'टिकट आईडी दर्ज करें (जैसे BP-000001 या 1)',
    scanner_valid: 'पास वैध और सक्रिय है',
    scanner_expired: 'पास अमान्य या समाप्त हो चुका है',
    scanner_boarded: 'यात्री पहले ही सवार हो चुका है',
    scanner_mark_boarded: 'यात्री को सवार (Boarded) मार्क करें',
    
    // Admin
    admin_title: 'ट्रांजिट प्रशासन और नियंत्रण केंद्र',
    admin_tab_routes: 'रूट प्रबंधन',
    admin_tab_bookings: 'सभी बुकिंग ऑडिट',
    admin_tab_analytics: 'दृश्य एनालिटिक्स',
    admin_tab_users: 'उपयोगकर्ता सूची',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('cloudbus_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cloudbus_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
