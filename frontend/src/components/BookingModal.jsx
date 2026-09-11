import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle, AlertCircle, ArrowRight, Download, QrCode, FileText, Bus, Sparkles, GraduationCap, Clock } from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { downloadTicketPdf } from '../utils/download';

export default function BookingModal({ route, onClose, onSuccess, onNavigateLogin }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Format today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [travelDate, setTravelDate] = useState(todayStr);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [passType, setPassType] = useState('single'); // 'single', 'daily', 'student', 'monthly'
  const [studentId, setStudentId] = useState('');
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookedTicket, setBookedTicket] = useState(null);

  // Calculate fare based on pass type
  let calculatedFare = route.price;
  if (passType === 'daily') calculatedFare = Math.round(route.price * 1.5);
  else if (passType === 'student') calculatedFare = Math.round(route.price * 8.0);
  else if (passType === 'monthly') calculatedFare = Math.round(route.price * 14.0);

  // Fetch occupied seats for chosen date & route
  useEffect(() => {
    if (!route || !travelDate) return;
    
    const fetchBookedSeats = async () => {
      setLoadingSeats(true);
      setError('');
      try {
        const res = await api.get(`/routes/${route.id}/booked-seats?date=${travelDate}`);
        setBookedSeats(res.data.booked_seats || []);
        if (selectedSeat && res.data.booked_seats.includes(selectedSeat)) {
          setSelectedSeat(null);
        }
      } catch (err) {
        console.error('Error fetching booked seats:', err);
      } finally {
        setLoadingSeats(false);
      }
    };

    fetchBookedSeats();
  }, [route, travelDate]);

  const handleBooking = async () => {
    if (!user) {
      onClose();
      onNavigateLogin();
      return;
    }

    if (!selectedSeat) {
      setError('Please select a seat number to proceed.');
      return;
    }

    if (passType === 'student' && !studentId.trim()) {
      setError('Please enter your Student ID Card number for concession verification.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/book', {
        route_id: route.id,
        travel_date: travelDate,
        seat_number: selectedSeat,
        pass_type: passType,
        student_id_number: studentId.trim()
      });

      const ticket = res.data.ticket;
      setBookedTicket(ticket);

      // Save to offline local storage cache
      try {
        const cached = JSON.parse(localStorage.getItem('cloudbus_offline_tickets') || '[]');
        const updated = [ticket, ...cached.filter(t => t.id !== ticket.id)];
        localStorage.setItem('cloudbus_offline_tickets', JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage caching failed', e);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[96vh] sm:max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Bus className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-snug">
                {bookedTicket ? 'Pass Booked Successfully!' : t('modal_title')}
              </h3>
              <p className="text-xs text-blue-200">
                {route.source} ➔ {route.destination} ({route.distance_km} km)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-5">
          
          {bookedTicket ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-slate-800">Booking Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your digital pass and QR code have been generated securely on the server.
                </p>
              </div>

              {/* Ticket Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ticket Reference:</span>
                  <span className="font-bold text-slate-800">#BP-{String(bookedTicket.id).padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Passenger:</span>
                  <span className="font-bold text-slate-800">{bookedTicket.user_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Pass Category:</span>
                  <span className="font-bold text-indigo-600 uppercase">{bookedTicket.pass_type || 'Single Journey'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Travel Date & Validity:</span>
                  <span className="font-bold text-blue-700">{bookedTicket.travel_date} to {bookedTicket.valid_until || bookedTicket.travel_date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Assigned Seat:</span>
                  <span className="font-bold text-emerald-700 text-sm">Seat #{bookedTicket.seat_number}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Total Paid:</span>
                  <span className="font-extrabold text-slate-800 text-sm">₹{bookedTicket.amount_paid || bookedTicket.price}</span>
                </div>
              </div>

              {/* Action Buttons for Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => downloadTicketPdf(bookedTicket.id)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF Pass
                </button>

                <a
                  href={`${API_BASE_URL}/api/ticket/qr/${bookedTicket.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  View QR Code
                </a>
              </div>
            </div>
          ) : (
            /* SEAT SELECTION & BOOKING VIEW */
            <>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Pass Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {t('modal_pass_type')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPassType('single')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      passType === 'single'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold">Single Journey</p>
                    <p className="text-[10px] text-slate-500">Standard 1-way (₹{route.price})</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassType('daily')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      passType === 'daily'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold">1-Day Unlimited</p>
                    <p className="text-[10px] text-slate-500">Unlimited 24h (₹{Math.round(route.price * 1.5)})</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassType('student')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      passType === 'student'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Student (50% Off)</span>
                    </p>
                    <p className="text-[10px] text-slate-500">30-Day Pass (₹{Math.round(route.price * 8.0)})</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassType('monthly')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      passType === 'monthly'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <p className="font-bold">Monthly Commuter</p>
                    <p className="text-[10px] text-slate-500">30-Day Pass (₹{Math.round(route.price * 14.0)})</p>
                  </button>
                </div>
              </div>

              {/* Student ID Card Input if Student Pass */}
              {passType === 'student' && (
                <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 space-y-2 animate-fadeIn">
                  <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                    {t('modal_student_id')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU-COLLEGE-2026-88"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                  <p className="text-[10px] text-amber-700">
                    * Present this student ID along with the digital pass during conductor boarding verification.
                  </p>
                </div>
              )}

              {/* Step 1: Select Travel Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  {t('modal_travel_date')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Step 2: Select Seat from 40-Seat Bus Layout */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {t('modal_select_seat')} ({selectedSeat ? `Seat #${selectedSeat}` : 'None chosen'})
                  </label>
                  {loadingSeats && (
                    <span className="text-[11px] text-blue-600 font-medium animate-pulse">
                      Checking availability...
                    </span>
                  )}
                </div>

                {/* Seat Legend */}
                <div className="flex items-center justify-center gap-4 py-2 text-[11px] text-slate-600 border-y border-slate-100 bg-slate-50/60 rounded-lg mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-white border border-slate-300"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-blue-600 text-white"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-red-200 border border-red-300"></div>
                    <span>Booked</span>
                  </div>
                </div>

                {/* Bus Layout Container */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-200 mb-3">
                    <span>Front / Driver</span>
                    <span>Entrance ➔</span>
                  </div>

                  {/* 40 Seats Grid (10 rows x 4 seats) */}
                  <div className="grid grid-cols-5 gap-2 max-h-52 overflow-y-auto custom-scrollbar p-1">
                    {Array.from({ length: 40 }, (_, idx) => {
                      const seatNum = idx + 1;
                      const isBooked = bookedSeats.includes(seatNum);
                      const isSelected = selectedSeat === seatNum;

                      return (
                        <React.Fragment key={seatNum}>
                          {idx % 4 === 2 && (
                            <div className="flex items-center justify-center text-[10px] text-slate-300 font-mono">
                              •
                            </div>
                          )}
                          <button
                            type="button"
                            disabled={isBooked}
                            onClick={() => setSelectedSeat(seatNum)}
                            className={`
                              h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer
                              ${isBooked
                                ? 'bg-red-100 text-red-400 border border-red-200 cursor-not-allowed'
                                : isSelected
                                ? 'bg-blue-600 text-white shadow-md scale-105 border-2 border-blue-800'
                                : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 hover:border-blue-300'}
                            `}
                            title={isBooked ? `Seat #${seatNum} is booked` : `Seat #${seatNum}`}
                          >
                            {seatNum}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Price Calculation & Checkout */}
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 block">{t('modal_total_fare')}:</span>
                  <span className="text-xl font-black text-blue-900">₹{calculatedFare}</span>
                </div>
                {!user ? (
                  <button
                    type="button"
                    onClick={() => { onClose(); onNavigateLogin(); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm"
                  >
                    Login to Book
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!selectedSeat || submitting}
                    onClick={handleBooking}
                    className={`
                      px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer
                      ${!selectedSeat || submitting
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20'}
                    `}
                  >
                    {submitting ? 'Generating Pass...' : t('modal_book_now')}
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
