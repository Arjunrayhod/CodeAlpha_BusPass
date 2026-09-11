import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Search, CheckCircle2, XCircle, AlertTriangle, UserCheck, X, Sparkles, RefreshCw, Bus, Calendar, User } from 'lucide-react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function QRScannerModal({ onClose }) {
  const { t } = useLanguage();
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [scannerActive, setScannerActive] = useState(true);
  const [boardingSuccess, setBoardingSuccess] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    let scanner = null;
    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 220, height: 220 } },
        false
      );

      scanner.render(
        (decodedText) => {
          handleQRDecoded(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Error clearing scanner', err));
      }
    };
  }, [scannerActive]);

  const handleQRDecoded = async (decodedText) => {
    try {
      let ticketRef = decodedText;
      // If it's a JSON payload
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        const parsed = JSON.parse(decodedText);
        ticketRef = parsed.ticket_id || parsed.ticket_number || decodedText;
      }
      setScannerActive(false);
      verifyTicket(ticketRef);
    } catch (e) {
      verifyTicket(decodedText);
    }
  };

  const verifyTicket = async (ref) => {
    if (!ref) return;
    setLoading(true);
    setError('');
    setVerificationResult(null);
    setBoardingSuccess('');

    try {
      const res = await api.get(`/verify-ticket/${ref}`);
      setVerificationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ticket verification failed. Ticket not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    verifyTicket(ticketInput);
  };

  const handleMarkBoarded = async (ticketId) => {
    setLoading(true);
    try {
      const res = await api.post(`/tickets/${ticketId}/board`);
      setBoardingSuccess(res.data.message || 'Passenger marked as boarded!');
      // Update state
      setVerificationResult((prev) => ({
        ...prev,
        is_boarded: true
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark boarded. Please log in as admin or staff.');
    } finally {
      setLoading(false);
    }
  };

  const restartScanner = () => {
    setVerificationResult(null);
    setError('');
    setBoardingSuccess('');
    setScannerActive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t('scanner_title')}</h3>
              <p className="text-[11px] text-blue-200">{t('scanner_sub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-blue-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Manual Search Bar */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder={t('scanner_manual_search')}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={loading || !ticketInput}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
            >
              Verify
            </button>
          </form>

          {/* Camera Scanner View */}
          {scannerActive && !verificationResult && (
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Point Camera at Ticket QR
                </span>
              </div>
              <div id="qr-reader-container" className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner"></div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-6 space-y-2">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Validating pass against cloud database...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-center">
              <XCircle className="w-10 h-10 text-red-500 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-red-800">Verification Failed</h4>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={restartScanner}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
              >
                Scan Another Pass
              </button>
            </div>
          )}

          {/* Boarding Success Toast */}
          {boardingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{boardingSuccess}</span>
            </div>
          )}

          {/* Verification Result Card */}
          {verificationResult && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Status Header */}
              <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                verificationResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                {verificationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-1" />
                    <h4 className="font-black text-base uppercase tracking-wide">
                      {verificationResult.is_boarded ? 'PASS VALID • ALREADY BOARDED' : 'PASS VALID & ACTIVE'}
                    </h4>
                    <p className="text-xs text-emerald-700 font-medium">
                      Authentic ticket issued by CloudBus System
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-1" />
                    <h4 className="font-black text-base uppercase tracking-wide">
                      {verificationResult.is_expired ? 'PASS EXPIRED' : 'PASS INVALID / CANCELLED'}
                    </h4>
                    <p className="text-xs text-red-700">This pass is no longer valid for boarding.</p>
                  </>
                )}
              </div>

              {/* Ticket Details */}
              {verificationResult.ticket && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Ticket Reference</span>
                    <span className="font-mono font-bold text-blue-600 text-sm">#BP-{verificationResult.ticket.id.toString().padStart(6, '0')}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Passenger</p>
                      <p className="font-bold text-slate-800 text-sm">{verificationResult.ticket.user_name}</p>
                      <p className="text-slate-500 text-[11px]">{verificationResult.ticket.user_email}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Assigned Seat</p>
                      <p className="font-black text-indigo-600 text-base">Seat #{verificationResult.ticket.seat_number}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Route Corridor</p>
                      <p className="font-bold text-slate-800">{verificationResult.ticket.source} ➔ {verificationResult.ticket.destination}</p>
                      <p className="text-slate-500">{verificationResult.ticket.departure_time}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] font-bold uppercase">Pass Category</p>
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md uppercase text-[10px] mt-1">
                        {verificationResult.ticket.pass_type || 'Single Journey'}
                      </span>
                    </div>

                    {verificationResult.ticket.student_id_number && (
                      <div className="col-span-2 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <p className="text-amber-700 text-[10px] font-bold uppercase">Student ID Verification Required</p>
                        <p className="font-bold text-amber-900 text-xs">ID Number: {verificationResult.ticket.student_id_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!verificationResult.is_boarded && verificationResult.valid && (
                  <button
                    onClick={() => handleMarkBoarded(verificationResult.ticket.id)}
                    disabled={loading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t('scanner_mark_boarded')}</span>
                  </button>
                )}

                <button
                  onClick={restartScanner}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Next Passenger</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
