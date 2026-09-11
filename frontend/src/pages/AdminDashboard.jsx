import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Bus, Users, Ticket, IndianRupee, Plus, Edit2, Trash2, 
  X, Check, AlertCircle, RefreshCw, Download, QrCode, FileText, BarChart3, ScanLine,
  MessageSquare, Calendar, Clock, MapPin, User, ChevronRight
} from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import AnalyticsCharts from '../components/AnalyticsCharts';
import QRScannerModal from '../components/QRScannerModal';
import AdminSupportMessenger from '../components/AdminSupportMessenger';
import { useLanguage } from '../context/LanguageContext';
import { downloadTicketPdf, generateClientPassPdf } from '../utils/download';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total_users: 0, total_routes: 0, total_tickets: 0, total_revenue: 0 });
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [supportQueries, setSupportQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    source: '',
    destination: '',
    distance_km: '',
    price: '',
    departure_time: '08:00 AM'
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, routesRes, bookingsRes, usersRes, supportRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/routes'),
        api.get('/admin/bookings'),
        api.get('/admin/users'),
        api.get('/admin/support/all')
      ]);

      setStats(statsRes.data.stats);
      setRoutes(routesRes.data.routes || []);
      setBookings(bookingsRes.data.bookings || []);
      setUsersList(usersRes.data.users || []);
      setSupportQueries(supportRes.data.queries || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      source: '',
      destination: '',
      distance_km: '',
      price: '',
      departure_time: '08:00 AM'
    });
    setIsRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route) => {
    setEditingRoute(route);
    setRouteForm({
      source: route.source,
      destination: route.destination,
      distance_km: route.distance_km,
      price: route.price,
      departure_time: route.departure_time
    });
    setIsRouteModalOpen(true);
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingRoute) {
        await api.put(`/routes/${editingRoute.id}`, routeForm);
        setSuccessMsg('Route updated successfully');
      } else {
        await api.post('/routes', routeForm);
        setSuccessMsg('New route added successfully');
      }
      setIsRouteModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save route');
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route? Associated historical tickets will also be affected.')) {
      return;
    }
    try {
      await api.delete(`/routes/${routeId}`);
      setSuccessMsg('Route deleted successfully');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete route');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking #BP-${String(bookingId).padStart(6, '0')}? This will free the seat.`)) {
      return;
    }
    try {
      await api.delete(`/tickets/${bookingId}`);
      setSuccessMsg(`Booking #BP-${String(bookingId).padStart(6, '0')} cancelled successfully`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  return (
    <div className={`pb-12 ${activeTab === 'support' ? 'space-y-3.5' : 'space-y-5'}`}>
      
      {/* Responsive Header Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 ${
        activeTab === 'support' ? 'p-3.5 sm:p-5 rounded-2xl' : 'p-5 sm:p-7 rounded-3xl'
      } text-white shadow-xl border border-slate-800`}>
        <div className="flex items-center gap-3">
          <div className={`${activeTab === 'support' ? 'p-2' : 'p-2.5 sm:p-3'} bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0`}>
            <ShieldCheck className={activeTab === 'support' ? 'w-5 h-5' : 'w-6 h-6 sm:w-8 sm:h-8'} />
          </div>
          <div>
            <h1 className={`${activeTab === 'support' ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} font-black tracking-tight`}>{t('admin_title')}</h1>
            <p className="text-[11px] text-slate-300 line-clamp-1 sm:line-clamp-none">
              Fleet management, passenger bookings audit, live QR conductor scanner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan QR Pass</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Horizontally Scrollable Tab Navigation (Phone Friendly) */}
      <div className="flex border-b border-slate-200 space-x-1.5 sm:space-x-2 overflow-x-auto pb-2 custom-scrollbar text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'routes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Routes ({routes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Passes ({bookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users ({usersList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
            activeTab === 'support' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Helpdesk ({supportQueries.filter(q => q.status === 'OPEN').length})</span>
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          {/* 2x2 on Mobile, 4-col on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold uppercase">
                <span>Revenue</span>
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">₹{stats.total_revenue.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600 font-semibold hidden sm:block">From confirmed digital passes</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold uppercase">
                <span>Total Passes</span>
                <Ticket className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total_tickets}</div>
              <div className="text-[10px] text-blue-600 font-semibold hidden sm:block">Generated passes & QRs</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold uppercase">
                <span>Routes</span>
                <Bus className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total_routes}</div>
              <div className="text-[10px] text-indigo-600 font-semibold hidden sm:block">Active bus corridors</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-bold uppercase">
                <span>Passengers</span>
                <Users className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.total_users}</div>
              <div className="text-[10px] text-purple-600 font-semibold hidden sm:block">Registered accounts</div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-md space-y-3">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 h-5 text-emerald-400" />
              Cloud Infrastructure & Transit Engine Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white mb-0.5">Frontend Tier</div>
                <div className="text-[11px] text-slate-400">Vercel Edge Network (Auto-updated).</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white mb-0.5">Backend API Tier</div>
                <div className="text-[11px] text-slate-400">Python Flask on Render Cloud with JWT.</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="font-bold text-white mb-0.5">Pass Generator</div>
                <div className="text-[11px] text-slate-400">On-the-fly Dynamic QR + PDF Generator.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Visual Analytics Charts */}
      {activeTab === 'analytics' && (
        <div className="animate-fadeIn">
          <AnalyticsCharts />
        </div>
      )}

      {/* TAB 3: Routes */}
      {activeTab === 'routes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Bus Routes ({routes.length})</h2>
            <button
              onClick={handleOpenAddRoute}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Route</span>
            </button>
          </div>

          {/* Mobile View: Cards */}
          <div className="block md:hidden space-y-3">
            {routes.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{r.source}</span>
                    <span className="text-slate-400">➔</span>
                    <span>{r.destination}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-lg">
                    ₹{r.price}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-700">{r.departure_time}</span>
                  </div>
                  <span className="font-medium text-slate-500">{r.distance_km} km</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditRoute(r)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(r.id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Distance</th>
                    <th className="p-4">Fare (₹)</th>
                    <th className="p-4">Departure</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-400">#{r.id}</td>
                      <td className="p-4 font-bold text-slate-900">{r.source}</td>
                      <td className="p-4 font-bold text-slate-900">{r.destination}</td>
                      <td className="p-4">{r.distance_km} km</td>
                      <td className="p-4 font-bold text-emerald-700">₹{r.price}</td>
                      <td className="p-4 text-blue-700 font-semibold">{r.departure_time}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditRoute(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Route"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: All Bookings / Passes */}
      {activeTab === 'bookings' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">All Passenger Bookings ({bookings.length})</h2>
          
          {/* Mobile View: Cards */}
          <div className="block md:hidden space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-blue-600 text-xs">#BP-{String(b.id).padStart(6, '0')}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{b.user_name}</h4>
                    <p className="text-[10px] text-slate-400">{b.user_email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.is_boarded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.is_boarded ? 'BOARDED' : 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Route</p>
                    <p className="font-semibold text-slate-800">{b.source} ➔ {b.destination}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Seat & Date</p>
                    <p className="font-bold text-indigo-600">Seat #{b.seat_number} <span className="text-slate-500 font-normal">({b.travel_date})</span></p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded uppercase">
                      {b.pass_type || 'single'}
                    </span>
                    <span className="font-bold text-emerald-700 text-xs">₹{b.amount_paid || b.price}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateClientPassPdf(b)}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm cursor-pointer"
                      title="Download PDF Pass"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <a
                      href={`${API_BASE_URL}/api/ticket/qr/${b.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                      title="View QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    </a>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="p-1.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 cursor-pointer"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-4">Pass ID</th>
                    <th className="p-4">Passenger</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Travel Date</th>
                    <th className="p-4">Seat</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4">Boarded</th>
                    <th className="p-4 text-right">Pass Docs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-blue-700">#BP-{String(b.id).padStart(6, '0')}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{b.user_name}</div>
                        <div className="text-[10px] text-slate-400">{b.user_email}</div>
                      </td>
                      <td className="p-4 font-semibold">
                        {b.source} ➔ {b.destination}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                          {b.pass_type || 'single'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{b.travel_date}</td>
                      <td className="p-4 font-extrabold text-blue-600">Seat #{b.seat_number}</td>
                      <td className="p-4 font-bold text-emerald-700">₹{b.amount_paid || b.price}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.is_boarded ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.is_boarded ? 'BOARDED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <a
                          href={`${API_BASE_URL}/api/ticket/qr/${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                          title="View QR"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        </a>
                        <button
                          type="button"
                          onClick={() => generateClientPassPdf(b)}
                          className="inline-block p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                          title="Download PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="inline-block p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Cancel/Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Registered Users & Staff ({usersList.length})</h2>
          
          {/* Mobile View: Cards */}
          <div className="block md:hidden space-y-3">
            {usersList.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  <p className="text-[10px] text-slate-400">Registered: {u.created_at ? u.created_at.slice(0, 10) : 'N/A'}</p>
                </div>
                <span className="text-xs font-bold text-slate-400">#{u.id}</span>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-400">#{u.id}</td>
                      <td className="p-4 font-bold text-slate-900">{u.name}</td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{u.created_at ? u.created_at.slice(0, 16) : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Support Helpdesk */}
      {activeTab === 'support' && (
        <div className="animate-fadeIn">
          <AdminSupportMessenger 
            supportQueries={supportQueries} 
            onDataReload={loadData} 
          />
        </div>
      )}

      {/* Add / Edit Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                {editingRoute ? 'Edit Bus Route' : 'Add New Bus Route'}
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Origin / Source City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi"
                  value={routeForm.source}
                  onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaipur"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 280"
                    value={routeForm.distance_km}
                    onChange={(e) => setRouteForm({ ...routeForm, distance_km: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Fare (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 450"
                    value={routeForm.price}
                    onChange={(e) => setRouteForm({ ...routeForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departure Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 06:30 AM"
                  value={routeForm.departure_time}
                  onChange={(e) => setRouteForm({ ...routeForm, departure_time: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRouteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md cursor-pointer"
                >
                  {editingRoute ? 'Update Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal onClose={() => setIsScannerOpen(false)} />
      )}
    </div>
  );
}
