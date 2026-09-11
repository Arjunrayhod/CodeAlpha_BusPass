import React from 'react';
import { ArrowRight, Clock, MapPin, Gauge, Navigation } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RouteCard({ route, onBook, onTrackMap }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group hover:border-blue-300">
      <div>
        {/* Route Source -> Destination header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <span>{route.source}</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
            <span>{route.destination}</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Corridor
          </span>
        </div>

        {/* Route Metadata details */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Departure</div>
              <div className="font-semibold text-slate-700">{route.departure_time}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-indigo-500" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Distance</div>
              <div className="font-semibold text-slate-700">{route.distance_km} km</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing, Map Tracker & Booking action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold uppercase">From</span>
          <span className="text-xl font-black text-blue-700">
            ₹{route.price}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTrackMap(route)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
            title="View Live GPS Map & Stops"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Track Map</span>
          </button>

          <button
            type="button"
            onClick={() => onBook(route)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
          >
            <span>Book Pass</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
