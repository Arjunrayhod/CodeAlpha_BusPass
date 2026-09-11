import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, PieChart, Users, Bus, IndianRupee, Award, ArrowUpRight } from 'lucide-react';
import api from '../api';

export default function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-medium">
        Loading transit analytics engine...
      </div>
    );
  }

  const dailyTrends = analytics?.daily_trends || [];
  const passBreakdown = analytics?.pass_breakdown || [];
  const routeOccupancy = analytics?.route_occupancy || [];

  const maxRevenue = Math.max(...dailyTrends.map(d => d.daily_revenue || 0), 1000);

  const passColors = {
    'single': { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', fill: '#3B82F6', label: 'Single Journey' },
    'daily': { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200', fill: '#6366F1', label: '1-Day Unlimited' },
    'student': { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', fill: '#F59E0B', label: 'Student Concession (50%)' },
    'monthly': { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', fill: '#10B981', label: 'Monthly Commuter' },
  };

  const totalPassCount = passBreakdown.reduce((sum, p) => sum + p.count, 0) || 1;

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/10">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pass Volume</span>
            <Award className="w-5 h-5 text-blue-200" />
          </div>
          <p className="text-3xl font-black">{totalPassCount}</p>
          <p className="text-xs text-blue-100 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
            <span>Digital Passes Issued</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-600/10">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fleet Utilization</span>
            <Bus className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-black">
            {routeOccupancy.length > 0 
              ? `${Math.round(routeOccupancy.reduce((acc, r) => acc + (r.occupancy_pct || 0), 0) / routeOccupancy.length)}%` 
              : '42%'}
          </p>
          <p className="text-xs text-emerald-100 mt-2">Average Route Occupancy</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-600/10">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Student Concession</span>
            <Users className="w-5 h-5 text-amber-200" />
          </div>
          <p className="text-3xl font-black">
            {passBreakdown.find(p => p.pass_type === 'student')?.count || 0}
          </p>
          <p className="text-xs text-amber-100 mt-2">Active Student Subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. 7-Day Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">7-Day Revenue Trends</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Live Bookings</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {dailyTrends.length > 0 ? (
              dailyTrends.map((d, i) => {
                const heightPct = Math.max(15, Math.round((d.daily_revenue / maxRevenue) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                      ₹{d.daily_revenue}
                    </div>
                    <div
                      className="w-full max-w-[36px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">
                      {d.booking_date?.slice(5)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center py-16 text-slate-400 text-xs">
                No booking trend data for the selected period.
              </div>
            )}
          </div>
        </div>

        {/* 2. Pass Category Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-sm">Pass Tier Distribution</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Category Share</span>
          </div>

          <div className="space-y-3 pt-2">
            {passBreakdown.map((p, i) => {
              const meta = passColors[p.pass_type] || passColors['single'];
              const pct = Math.round((p.count / totalPassCount) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${meta.bg}`}></span>
                      <span>{meta.label}</span>
                    </span>
                    <span className="font-bold text-slate-900">{p.count} passes ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${meta.bg}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Top Route Occupancy Matrix */}
        <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">Route Seat Occupancy & Revenue</h4>
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Top 6 Routes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {routeOccupancy.map((r, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800 text-xs">{r.route_name}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[10px]">
                    {r.occupancy_pct}% full
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, r.occupancy_pct * 2)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>{r.bookings} Bookings</span>
                  <span className="font-bold text-slate-700">₹{r.revenue || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
