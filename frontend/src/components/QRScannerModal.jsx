import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Search, CheckCircle2, XCircle, AlertTriangle, UserCheck, X, RefreshCw, Camera, Upload, SwitchCamera } from 'lucide-react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function QRScannerModal({ onClose }) {
  const { t } = useLanguage();
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file'
  const [boardingSuccess, setBoardingSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const startScanner = async () => {
    setCameraError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-camera-viewport");
      }
      
      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          handleQRDecoded(decodedText);
        },
        (errorMessage) => {
          // ignore transient frame decode errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn("Camera start failed, falling back to camera selection:", err);
      // Try getting available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          // Pick the back camera if possible, or first available
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || devices[0];
          await html5QrCodeRef.current.start(
            backCamera.id,
            { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
            (decodedText) => handleQRDecoded(decodedText),
            () => {}
          );
          setIsScanning(true);
          return;
        }
      } catch (deviceErr) {
        console.error("Camera listing error:", deviceErr);
      }

      setCameraError(
        'Camera permission was denied or camera is not available. Please allow camera access or use the "Upload QR Image" option below.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (activeTab === 'camera' && !verificationResult) {
      // Small timeout to ensure DOM container is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab, verificationResult]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleQRDecoded = async (decodedText) => {
    await stopScanner();
    try {
      let ticketRef = decodedText;
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        const parsed = JSON.parse(decodedText);
        ticketRef = parsed.ticket_id || parsed.ticket_number || decodedText;
      }
      verifyTicket(ticketRef);
    } catch (e) {
      verifyTicket(decodedText);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    try {
      let html5QrCode = html5QrCodeRef.current;
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-camera-viewport");
        html5QrCodeRef.current = html5QrCode;
      }
      const decodedText = await html5QrCode.scanFile(file, true);
      handleQRDecoded(decodedText);
    } catch (err) {
      setError('Could not read a valid QR code from the selected image. Please try another photo or scan live.');
    } finally {
      setLoading(false);
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
      setError(err.response?.data?.error || 'Ticket verification failed. Ticket not found or invalid.');
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
      setBoardingSuccess(res.data.message || 'Passenger successfully marked as boarded!');
      setVerificationResult((prev) => ({
        ...prev,
        is_boarded: true
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark boarded. Please log in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const restartScanner = () => {
    setVerificationResult(null);
    setError('');
    setCameraError('');
    setBoardingSuccess('');
    setActiveTab('camera');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
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
            className="p-1.5 hover:bg-white/10 rounded-full text-blue-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Manual Reference Search */}
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
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              Verify
            </button>
          </form>

          {/* Tab Switcher: Camera Scan vs Image File */}
          {!verificationResult && (
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'file'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image</span>
              </button>
            </div>
          )}

          {/* Camera Viewport Area */}
          {!verificationResult && activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square flex items-center justify-center border-2 border-slate-800 shadow-inner">
                {/* HTML5 QR Code Container */}
                <div id="qr-camera-viewport" className="w-full h-full flex items-center justify-center"></div>

                {/* Animated Scanner Laser Overlay when camera is active */}
                {isScanning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-blue-400/80 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br"></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_cyan] animate-bounce mt-24"></div>
                    </div>
                  </div>
                )}

                {/* Camera Permission / Error State */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-5 flex flex-col items-center justify-center text-center text-white space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">{cameraError}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={startScanner}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                      >
                        Grant & Retry Camera
                      </button>
                      <button
                        onClick={() => setActiveTab('file')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                      >
                        Upload Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Align QR code within frame</span>
                <button
                  type="button"
                  onClick={startScanner}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restart Camera
                </button>
              </div>
            </div>
          )}

          {/* File Upload Mode */}
          {!verificationResult && activeTab === 'file' && (
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Upload Ticket QR Screenshot / Photo</h4>
                <p className="text-xs text-slate-500 mt-1">Select any image from phone gallery or files</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                Choose Photo from Device
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-6 space-y-2">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Validating pass with backend database...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3 text-center animate-fadeIn">
              <XCircle className="w-8 h-8 text-red-500 mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-red-800">Verification Failed</h4>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={restartScanner}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition cursor-pointer"
              >
                Scan Another Pass
              </button>
            </div>
          )}

          {/* Boarding Success Toast */}
          {boardingSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
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
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{t('scanner_mark_boarded')}</span>
                  </button>
                )}

                <button
                  onClick={restartScanner}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
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

