import React, { useState, useEffect } from 'react';
import { Search, MapPin, Bus, Sparkles, Shield, Clock, Award, Navigation, GraduationCap, QrCode, Smartphone, Download, CheckCircle2, Github } from 'lucide-react';
import RouteCard from '../components/RouteCard';
import LiveRouteMap from '../components/LiveRouteMap';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function Home({ onSelectRoute, onOpenScanner }) {
  const { t } = useLanguage();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [mapRoute, setMapRoute] = useState(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/routes');
      setRoutes(res.data.routes || []);
    } catch (err) {
      setError('Unable to load routes. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const matchSource = !searchSource || r.source.toLowerCase().includes(searchSource.toLowerCase().trim());
    const matchDest = !searchDestination || r.destination.toLowerCase().includes(searchDestination.toLowerCase().trim());
    return matchSource && matchDest;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 sm:p-12 shadow-2xl border border-blue-800/40">
        <div className="relative z-10 max-w-3xl space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] sm:text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>{t('brand_name')} • Smart Transit Network</span>
            </div>

            <a
              href="/CloudBus.apk"
              download="CloudBus.apk"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-emerald-200 text-[11px] sm:text-xs font-bold transition shadow-sm"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Android App (.APK)</span>
            </a>
          </div>
          
          <h1 className="text-2xl sm:text-5xl font-black tracking-tight leading-tight">
            {t('hero_title')}
          </h1>
          
          <p className="text-slate-300 text-xs sm:text-base max-w-2xl leading-relaxed">
            {t('hero_sub')}
          </p>

          {/* Quick Search Card */}
          <div className="pt-2 sm:pt-4">
            <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="relative">
                <MapPin className="w-4 h-4 text-blue-300 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="From (e.g. Delhi)"
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="relative">
                <MapPin className="w-4 h-4 text-indigo-300 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="To (e.g. Jaipur)"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSearchSource(''); setSearchDestination(''); }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-400/20">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">QR Code Verified</div>
              <div className="text-[11px] text-slate-400">Live Conductor camera check</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-400/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">50% Student Concession</div>
              <div className="text-[11px] text-slate-400">30-day monthly student passes</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-300 border border-emerald-400/20">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Live Route Maps</div>
              <div className="text-[11px] text-slate-400">Simulated GPS bus tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Routes Listing */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Available Bus Transit Corridors</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredRoutes.length} active corridor{filteredRoutes.length === 1 ? '' : 's'} with real-time seat availability
            </p>
          </div>
          <button
            onClick={fetchRoutes}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition"
          >
            Refresh Routes
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 bg-slate-200/70 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 text-red-700 border border-red-200 rounded-2xl">
            <p className="font-medium text-sm">{error}</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl text-slate-500">
            <Bus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-sm">No bus routes found matching your filter criteria.</p>
            <button
              onClick={() => { setSearchSource(''); setSearchDestination(''); }}
              className="mt-3 text-xs text-blue-600 underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onBook={onSelectRoute}
                onTrackMap={(r) => setMapRoute(r)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Android Mobile App Showcase Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-600/30 border border-blue-400/40 p-2 shrink-0 shadow-lg flex items-center justify-center">
              <img src="/logo.png" alt="CloudBus Logo" className="w-full h-full object-contain rounded-2xl" onError={(e) => { e.target.style.display = 'none'; }} />
              <Smartphone className="w-8 h-8 text-blue-300" style={{ display: 'none' }} />
            </div>

            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                Official Android App v2.0
              </div>
              <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                Get CloudBus on Your Android Phone
              </h3>
              <p className="text-xs text-slate-300 max-w-md">
                Fast ticket booking, instant QR verification, offline passes & smooth travel experience.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <a
              href="/CloudBus.apk"
              download="CloudBus.apk"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download APK (Direct)</span>
            </a>

            <a
              href="https://github.com/Arjunrayhod/BusPass-Android"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-2xl border border-slate-700 transition cursor-pointer"
            >
              <Github className="w-4 h-4" />
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>
      </section>

      {/* Live Route Map Modal */}
      {mapRoute && (
        <LiveRouteMap route={mapRoute} onClose={() => setMapRoute(null)} />
      )}
    </div>
  );
}
