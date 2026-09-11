import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, MapPin, X, Navigation, Clock, ShieldCheck, Gauge, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Comprehensive City Coordinates for India
const KNOWN_CITIES = {
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'jaipur': [26.9124, 75.7873],
  'mumbai': [19.0760, 72.8777],
  'pune': [18.5204, 73.8567],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'mysore': [12.2958, 76.6394],
  'mysuru': [12.2958, 76.6394],
  'hyderabad': [17.3850, 78.4867],
  'vijayawada': [16.5062, 80.6480],
  'chennai': [13.0827, 80.2707],
  'pondicherry': [11.9416, 79.8083],
  'puducherry': [11.9416, 79.8083],
  'kolkata': [22.5726, 88.3639],
  'durgapur': [23.5204, 87.3119],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'chandigarh': [30.7333, 76.7794],
  'shimla': [31.1048, 77.1734],
  'agra': [27.1767, 78.0081],
  'lucknow': [26.8467, 80.9462],
  'varanasi': [25.3176, 82.9739],
  'kanpur': [26.4499, 80.3319],
  'patna': [25.5941, 85.1376],
  'bhopal': [23.2599, 77.4126],
  'indore': [22.7196, 75.8577],
  'nagpur': [21.1458, 79.0882],
  'goa': [15.2993, 74.1240],
  'panaji': [15.4909, 73.8278]
};

function getCityCoords(cityName, isDestination = false) {
  if (!cityName) return isDestination ? [26.9124, 75.7873] : [28.6139, 77.2090];
  const clean = cityName.toLowerCase().trim();
  if (KNOWN_CITIES[clean]) {
    return KNOWN_CITIES[clean];
  }
  // If city name contains any key
  for (const [key, coords] of Object.entries(KNOWN_CITIES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  // Default offset coordinate
  return isDestination ? [26.9124, 75.7873] : [28.6139, 77.2090];
}

export default function LiveRouteMap({ route, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);
  const { t } = useLanguage();
  const [progress, setProgress] = useState(38); // initial 38%
  const [mapError, setMapError] = useState(false);

  const sourceCoord = getCityCoords(route?.source, false);
  const destCoord = getCityCoords(route?.destination, true);

  useEffect(() => {
    if (!route || !mapContainerRef.current) return;

    let map = null;
    let timer = null;
    let animInterval = null;

    try {
      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map
      map = L.map(mapContainerRef.current, {
        center: sourceCoord,
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Custom div icons
      const sourceIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div style="background-color: #2563EB; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
                🟢 ${route.source}
               </div>`,
        iconSize: [90, 30],
        iconAnchor: [45, 15]
      });

      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="background-color: #DC2626; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white; white-space: nowrap;">
                🔴 ${route.destination}
               </div>`,
        iconSize: [90, 30],
        iconAnchor: [45, 15]
      });

      L.marker(sourceCoord, { icon: sourceIcon }).addTo(map)
        .bindPopup(`<b>Origin Station:</b> ${route.source}<br/>Departure: ${route.departure_time}`);

      L.marker(destCoord, { icon: destIcon }).addTo(map)
        .bindPopup(`<b>Destination:</b> ${route.destination}<br/>Total Distance: ${route.distance_km} km`);

      // Polyline route path
      const polyline = L.polyline([sourceCoord, destCoord], {
        color: '#2563EB',
        weight: 6,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      // Fit bounds safely
      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      // Bus moving marker
      const busLat = sourceCoord[0] + (destCoord[0] - sourceCoord[0]) * (progress / 100);
      const busLng = sourceCoord[1] + (destCoord[1] - sourceCoord[1]) * (progress / 100);

      const busIcon = L.divIcon({
        className: 'bus-moving-marker',
        html: `<div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 6px 12px; border-radius: 9999px; font-weight: 800; font-size: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.5); border: 2px solid white; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                <span>🚌 CloudBus Express</span>
               </div>`,
        iconSize: [140, 32],
        iconAnchor: [70, 16]
      });

      const busMarker = L.marker([busLat, busLng], { icon: busIcon }).addTo(map);
      busMarker.bindPopup(`<b>Bus #CB-${route.id}40</b><br/>Speed: 65 km/h<br/>Status: On Schedule`);
      busMarkerRef.current = busMarker;

      // Invalidate size once modal DOM renders
      timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [60, 60] });
        }
      }, 250);

      // Animate bus position
      animInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev >= 92 ? 8 : prev + 1.2;
          const nLat = sourceCoord[0] + (destCoord[0] - sourceCoord[0]) * (next / 100);
          const nLng = sourceCoord[1] + (destCoord[1] - sourceCoord[1]) * (next / 100);
          if (busMarkerRef.current) {
            busMarkerRef.current.setLatLng([nLat, nLng]);
          }
          return next;
        });
      }, 1500);

    } catch (err) {
      console.error('Leaflet initialization error:', err);
      setMapError(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (animInterval) clearInterval(animInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route]);

  const coveredKm = Math.round(((route?.distance_km || 200) * progress) / 100);
  const remainingKm = Math.round((route?.distance_km || 200) - coveredKm);

  if (!route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>{route.source}</span>
                <span className="text-blue-400 font-normal">➔</span>
                <span>{route.destination}</span>
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live GPS Tracking Corridor • AC Luxury Fleet</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Speed</p>
              <p className="font-bold text-slate-800 text-sm">65 km/h</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <Navigation className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Distance</p>
              <p className="font-bold text-slate-800 text-sm">{coveredKm} / {route.distance_km} km</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Est. Arrival</p>
              <p className="font-bold text-slate-800 text-sm">{Math.max(15, Math.round((remainingKm / 60) * 60))} mins</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Status</p>
              <p className="font-bold text-emerald-600 text-sm">On Time</p>
            </div>
          </div>
        </div>

        {/* Map Container View */}
        <div className="flex-1 w-full min-h-[360px] relative bg-slate-100">
          {mapError ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <h4 className="font-bold text-slate-800 text-sm">Transit Route Overview</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Direct corridor between {route.source} and {route.destination} ({route.distance_km} km).
              </p>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10" />
          )}
        </div>

        {/* Progress Bar & Footer */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>🟢 {route.source} (0 km)</span>
            <span className="text-blue-600 font-bold">{Math.round(progress)}% Transit Completed</span>
            <span>🔴 {route.destination} ({route.distance_km} km)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
}
