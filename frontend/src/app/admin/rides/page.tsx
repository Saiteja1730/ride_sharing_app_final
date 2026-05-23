'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Clock, DollarSign, Filter, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';



const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  ongoing:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  searching: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  accepted:  'bg-brand-500/10 text-brand-400 border-brand-500/20',
};

export default function AdminRidesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['adminRides', statusFilter],
    queryFn: () => adminApi.listRides({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 100 }),
  });

  const rides: any[] = data?.data?.data || [];

  const filtered = rides.filter(r => {
    const q = search.toLowerCase();
    return !search || r.rider?.name?.toLowerCase().includes(q) || r._id.toLowerCase().includes(q) || r.pickupLocation?.address?.toLowerCase().includes(q);
  });

  const stats = {
    total:     data?.data?.meta?.total || rides.length,
    completed: rides.filter(r => r.status === 'completed').length,
    ongoing:   rides.filter(r => r.status === 'ongoing').length,
    cancelled: rides.filter(r => r.status === 'cancelled').length,
    revenue:   rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.fare?.total || 0), 0),
    commission: rides.filter(r => r.status === 'completed').reduce((s, r) => s + (r.fare?.platformCommission || 0), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Ride Management</h1>
        <p className="text-slate-400 mt-1">Monitor all trips, live and historical</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Rides',   value: stats.total,                              color: 'from-brand-500 to-brand-700',   icon: MapPin },
          { label: 'Completed',     value: stats.completed,                           color: 'from-green-500 to-emerald-700', icon: CheckCircle },
          { label: 'Live / Active', value: stats.ongoing,                             color: 'from-cyan-500 to-teal-700',    icon: Loader2 },
          { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(0)}`,           color: 'from-violet-500 to-purple-700', icon: DollarSign },
          { label: 'Commission',    value: `₹${stats.commission.toFixed(0)}`,        color: 'from-amber-500 to-orange-700',  icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by rider, ride ID, or pickup…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all','completed','ongoing','searching','cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                statusFilter === s
                  ? s === 'completed' ? 'bg-green-500 text-white'
                  : s === 'ongoing'   ? 'bg-cyan-500 text-white'
                  : s === 'cancelled' ? 'bg-red-500 text-white'
                  : s === 'searching' ? 'bg-amber-500 text-white'
                  : 'bg-violet-500 text-white'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Ride ID</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Rider</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Driver</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Route</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Fare</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r: any) => (
                <tr key={r._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-violet-400">#{r._id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {r.rider?.name?.charAt(0)}
                      </div>
                      <span className="text-sm text-white">{r.rider?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {r.driver
                      ? <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {r.driver?.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-white">{r.driver?.name}</span>
                        </div>
                      : <span className="text-xs text-slate-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell max-w-[200px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                        <span className="text-xs text-slate-300 truncate" title={r.pickupLocation?.address}>{r.pickupLocation?.address?.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                        <span className="text-xs text-slate-400 truncate" title={r.dropoffLocation?.address}>{r.dropoffLocation?.address?.split(',')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-bold text-white">₹{r.fare?.total?.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-green-400 border border-green-500/20 bg-green-500/10 px-1 rounded">Dr: ₹{r.fare?.driverEarnings?.toFixed(0)}</p>
                      <p className="text-[10px] text-amber-400 border border-amber-500/20 bg-amber-500/10 px-1 rounded">Cm: ₹{r.fare?.platformCommission?.toFixed(0)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-400 capitalize">{r.vehicleType}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center"><Loader2 className="w-5 h-5 text-brand-500 animate-spin mx-auto" /></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500">No rides match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {data?.data?.meta?.total || 0} rides</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 transition-colors">← Prev</button>
            <button className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
