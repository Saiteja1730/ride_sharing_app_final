'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Clock, DollarSign, Filter, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';



const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border-green-200',
  ongoing:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  searching: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  accepted:  'bg-brand-50 text-brand-700 border-brand-200',
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
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Ride Management</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Monitor all trips, live and historical</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Rides',   value: stats.total,                              color: 'from-brand-600 to-brand-900',   icon: MapPin },
          { label: 'Completed',     value: stats.completed,                           color: 'from-green-600 to-emerald-700', icon: CheckCircle },
          { label: 'Live / Active', value: stats.ongoing,                             color: 'from-cyan-600 to-teal-700',    icon: Loader2 },
          { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(0)}`,           color: 'from-violet-600 to-purple-800', icon: DollarSign },
          { label: 'Commission',    value: `₹${stats.commission.toFixed(0)}`,        color: 'from-amber-600 to-orange-800',  icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-slate-900">{value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by rider, ride ID, or pickup…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all','completed','ongoing','searching','cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all capitalize shadow-sm border ${
                statusFilter === s
                  ? s === 'completed' ? 'bg-green-600 border-green-700 text-white'
                  : s === 'ongoing'   ? 'bg-cyan-600 border-cyan-700 text-white'
                  : s === 'cancelled' ? 'bg-red-600 border-red-700 text-white'
                  : s === 'searching' ? 'bg-amber-600 border-amber-700 text-white'
                  : 'bg-brand-900 border-brand-950 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-6 py-3.5">Ride ID</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Rider</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Driver</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Route</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Fare</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Type</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r: any) => (
                <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono font-bold text-brand-900">#{r._id.slice(-6)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                        {r.rider?.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{r.rider?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    {r.driver
                      ? <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                            {r.driver?.name?.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{r.driver?.name}</span>
                        </div>
                      : <span className="text-xs text-slate-400 font-medium">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell max-w-[200px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate" title={r.pickupLocation?.address}>{r.pickupLocation?.address?.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-slate-500 truncate" title={r.dropoffLocation?.address}>{r.dropoffLocation?.address?.split(',')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-extrabold text-slate-900">₹{r.fare?.total?.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-[9px] font-bold text-green-700 border border-green-200 bg-green-50 px-1.5 py-0.5 rounded shadow-sm">Dr: ₹{r.fare?.driverEarnings?.toFixed(0)}</p>
                      <p className="text-[9px] font-bold text-amber-700 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded shadow-sm">Cm: ₹{r.fare?.platformCommission?.toFixed(0)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs text-slate-600 font-semibold capitalize">{r.vehicleType}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border capitalize shadow-sm ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center"><Loader2 className="w-5 h-5 text-brand-900 animate-spin mx-auto" /></td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-500 font-medium">No rides match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">Showing {filtered.length} of {data?.data?.meta?.total || 0} rides</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-colors shadow-sm">← Prev</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-colors shadow-sm">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
