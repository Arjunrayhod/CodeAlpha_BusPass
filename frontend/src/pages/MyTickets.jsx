import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, Download, QrCode, FileText, X, ArrowRight, Bus, WifiOff, Sparkles, GraduationCap, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function MyTickets({ onExploreRoutes }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [previewQrTicket, setPreviewQrTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    setIsOfflineMode(false);
    try {
      const res = await api.get('/my-tickets');
      const liveTickets = res.data.tickets || [];
      setTickets(liveTickets);
      // Update offline storage cache
      if (liveTickets.length > 0) {
        localStorage.setItem('cloudbus_offline_tickets', JSON.stringify(liveTickets));
      }
    } catch (err) {
      // Fallback to offline cached passes
      const cached = localStorage.getItem('cloudbus_offline_tickets');
      if (cached) {
        setTickets(JSON.parse(cached));
        setIsOfflineMode(true);
      } else {
        setError('Unable to load your bus passes. Please check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleCancelTicket = async (ticketId, seatNum) => {
    if (!window.confirm(t('cancel_confirm'))) {
      return;
    }

    setCancellingId(ticketId);
    setError('');
    setSuccessMsg('');

    try {
      await api.delete(`/tickets/${ticketId}`);
      // Remove from state
      const updated = tickets.filter((t) => t.id !== ticketId);
      setTickets(updated);
      localStorage.setItem('cloudbus_offline_tickets', JSON.stringify(updated));
      setSuccessMsg(`Pass #BP-${String(ticketId).padStart(6, '0')} has been cancelled. Seat #${seatNum} is now released.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel pass. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-blue-600" />
            <span>{t('my_passes_title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('my_passes_sub')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOfflineMode && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('offline_badge')}</span>
            </span>
          )}

          <button
            onClick={fetchTickets}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 transition"
          >
            Refresh Passes
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 bg-slate-200/70 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Bus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Bus Passes Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              You haven't booked any bus passes. Browse available routes and book your first seat now.
            </p>
          </div>
          <button
            onClick={onExploreRoutes}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            <span>Explore Routes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase text-blue-300">
                        Pass ID: #BP-{String(ticket.id).padStart(6, '0')}
                      </span>
                      {ticket.pass_type && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/30 text-blue-200 uppercase border border-blue-400/30">
                          {ticket.pass_type}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold flex items-center gap-2 mt-1">
                      <span>{ticket.source}</span>
                      <span className="text-blue-400 font-normal">➔</span>
                      <span>{ticket.destination}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {ticket.status}
                    </span>
                    <div className="text-xs font-bold text-slate-200 mt-1">₹{ticket.amount_paid || ticket.price}</div>
                  </div>
                </div>

                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" /> Start Date
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">{ticket.travel_date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> Valid Until
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">{ticket.valid_until || ticket.travel_date}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Seat Assigned</div>
                      <div className="font-black text-blue-600 mt-0.5 text-sm">#{ticket.seat_number}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
                      <div className="font-bold text-slate-800 mt-0.5">{ticket.distance_km} km</div>
                    </div>
                  </div>

                  {ticket.student_id_number && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs">
                      <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-900 font-medium">
                        Student ID: <b>{ticket.student_id_number}</b> (50% Concession)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Passenger: <b className="text-slate-700">{ticket.user_name}</b></span>
                    <span>Booked: {ticket.booked_at ? ticket.booked_at.slice(0, 10) : 'Recent'}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPreviewQrTicket(ticket)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('view_qr')}</span>
                  </button>

                  <a
                    href={`${API_BASE_URL}/api/ticket/pdf/${ticket.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>

                  <button
                    onClick={() => handleCancelTicket(ticket.id, ticket.seat_number)}
                    disabled={cancellingId === ticket.id}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                    title="Cancel pass and free up seat"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>{cancellingId === ticket.id ? '...' : 'Cancel'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Modal Preview */}
      {previewQrTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <h3 className="font-bold text-base text-slate-900">Digital QR Pass</h3>
                <p className="text-[11px] text-slate-500">#BP-{String(previewQrTicket.id).padStart(6, '0')}</p>
              </div>
              <button
                onClick={() => setPreviewQrTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`${API_BASE_URL}/api/ticket/qr/${previewQrTicket.id}`}
                alt="Ticket QR Code"
                className="w-48 h-48 mx-auto rounded-lg object-contain"
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">{previewQrTicket.source} ➔ {previewQrTicket.destination}</div>
              <div>Travel Date: <b className="text-blue-600">{previewQrTicket.travel_date}</b> | Seat: <b className="text-emerald-600">#{previewQrTicket.seat_number}</b></div>
              <p className="text-[10px] text-slate-400 pt-1">Show this QR code to the bus conductor for instant validation.</p>
            </div>

            <a
              href={`${API_BASE_URL}/api/ticket/qr/${previewQrTicket.id}`}
              download={`ticket_qr_${previewQrTicket.id}.png`}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Save QR Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
