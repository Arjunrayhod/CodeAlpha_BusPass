import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Bus, Users, Ticket, IndianRupee, Plus, Edit2, Trash2, 
  X, Check, AlertCircle, RefreshCw, Download, QrCode, FileText, BarChart3, ScanLine,
  MessageSquare, Send, CheckCircle2, HelpCircle
} from 'lucide-react';
import api, { API_BASE_URL } from '../api';
import AnalyticsCharts from '../components/AnalyticsCharts';
import QRScannerModal from '../components/QRScannerModal';
import AdminSupportMessenger from '../components/AdminSupportMessenger';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total_users: 0, total_routes: 0, total_tickets: 0, total_revenue: 0 });
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [supportQueries, setSupportQueries] = useState([]);
  const [replyModalQuery, setReplyModalQuery] = useState(null);
  const [replyText, setReplyText] = useState('');
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

  const handleAdminReply = async (e) => {
    e.preventDefault();
    if (!replyModalQuery || !replyText.trim()) return;

    try {
      await api.post('/admin/support/reply', {
        user_id: replyModalQuery.user_id,
        subject: `Re: ${replyModalQuery.subject || 'Support Query'}`,
        message: replyText.trim()
      });
      setSuccessMsg(`Reply sent to passenger ${replyModalQuery.user_name}`);
      setReplyModalQuery(null);
      setReplyText('');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reply');
    }
  };

  const handleResolveQuery = async (queryId) => {
    try {
      await api.put(`/admin/support/${queryId}/resolve`);
      setSuccessMsg('Inquiry marked as resolved');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve inquiry');
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
    <div className={`pb-12 ${activeTab === 'support' ? 'space-y-3.5' : 'space-y-6'}`}>
      {/* Header Banner */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 ${
        activeTab === 'support' ? 'p-3.5 sm:p-4 rounded-2xl' : 'p-6 sm:p-8 rounded-3xl'
      } text-white shadow-xl border border-slate-800`}>
        <div className="flex items-center gap-3">
          <div className={`${activeTab === 'support' ? 'p-2' : 'p-3'} bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0`}>
            <ShieldCheck className={activeTab === 'support' ? 'w-5 h-5' : 'w-8 h-8'} />
          </div>
          <div>
            <h1 className={`${activeTab === 'support' ? 'text-lg' : 'text-2xl'} font-black`}>{t('admin_title')}</h1>
            <p className="text-[11px] text-slate-300">
              Fleet management, passenger bookings audit, analytics engine, and live conductor verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan QR Ticket</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {t('admin_tab_analytics')}
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'routes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bus className="w-4 h-4" />
          {t('admin_tab_routes')} ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'bookings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ticket className="w-4 h-4" />
          {t('admin_tab_bookings')} ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('admin_tab_users')} ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'support' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Passenger Helpdesk ({supportQueries.filter(q => q.status === 'OPEN').length} Open)
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{stats.total_revenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">From confirmed digital passes</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Total Tickets</span>
                <Ticket className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.total_tickets}</div>
              <div className="text-[11px] text-blue-600 font-semibold">Generated passes & QRs</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Active Routes</span>
                <Bus className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.total_routes}</div>
              <div className="text-[11px] text-indigo-600 font-semibold">Operating corridors</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                <span>Passengers</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.total_users}</div>
              <div className="text-[11px] text-purple-600 font-semibold">Registered user accounts</div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Cloud Infrastructure & Transit Engine Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2">
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <div className="font-bold text-white mb-1">Frontend Tier: Web Client</div>
                <div>High-speed static single-page application delivery.</div>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <div className="font-bold text-white mb-1">Backend Tier: Cloud API Server</div>
                <div>Flask API on Port 5000 with CORS & JWT Authentication.</div>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                <div className="font-bold text-white mb-1">Data & Artifacts: SQLite + Disk</div>
                <div>WAL-mode SQLite DB & on-disk QR/PDF pass generator.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Visual Analytics Charts */}
      {activeTab === 'analytics' && (
        <AnalyticsCharts />
      )}

      {/* TAB 3: Routes */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Bus Routes ({routes.length})</h2>
            <button
              onClick={handleOpenAddRoute}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Route</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
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
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Route"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* TAB 4: All Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">All Passenger Bookings ({bookings.length})</h2>
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
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
                        <a
                          href={`${API_BASE_URL}/api/ticket/pdf/${b.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                          title="Download PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
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
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Registered Users & Staff ({usersList.length})</h2>
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
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

      {/* TAB 6: Support Helpdesk (WhatsApp-style Live Messenger) */}
      {activeTab === 'support' && (
        <AdminSupportMessenger 
          supportQueries={supportQueries} 
          onDataReload={loadData} 
        />
      )}

      {/* Add / Edit Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingRoute ? 'Edit Bus Route' : 'Add New Bus Route'}
              </h3>
              <button
                onClick={() => setIsRouteModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
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
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md"
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
