'use client';

import { useQuery } from '@tanstack/react-query';
import { Car, Star, MapPin, TrendingUp, CheckCircle, XCircle, Zap, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';



const VEHICLE_TYPE_COLORS: Record<string, string> = {
  economy: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  premium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  suv:     'text-violet-400 bg-violet-500/10 border-violet-500/20',
  xl:      'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

export default function AdminFleetPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-fleet'],
    queryFn: () => adminApi.listUsers({ role: 'driver', limit: 100 }),
  });

  const fleet: any[] = data?.data?.data || [];
  // For approximation without sockets, consider isAvailable as online
  const online    = fleet.filter(d => d.isAvailable).length;
  const available = fleet.filter(d => d.isAvailable).length;
  const onTrip    = 0; // Requires active ride lookup per driver
  const offline   = fleet.filter(d => !d.isAvailable).length;

  const typeBreakdown = fleet.reduce((acc: any, d) => {
    const t = d.vehicleInfo?.type ?? 'economy';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Fleet Management</h1>
        <p className="text-slate-400 mt-1">Track and manage all registered drivers & vehicles</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Online',    value: online,    color: 'from-green-500 to-emerald-700', dot: 'bg-green-400'  },
          { label: 'On a Trip', value: onTrip,    color: 'from-cyan-500 to-teal-700',     dot: 'bg-cyan-400'   },
          { label: 'Available', value: available, color: 'from-brand-500 to-brand-700',   dot: 'bg-brand-400'  },
          { label: 'Offline',   value: offline,   color: 'from-slate-600 to-slate-800',   dot: 'bg-slate-500'  },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 relative`}>
              <Car className="w-4 h-4 text-white" />
              <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${dot} border border-surface`} />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle type breakdown */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Fleet Breakdown by Vehicle Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(typeBreakdown).map(([type, count]: any) => (
            <div key={type} className={`p-3 rounded-xl border ${VEHICLE_TYPE_COLORS[type] ?? 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
              <p className="text-2xl font-display font-bold">{count}</p>
              <p className="text-xs capitalize font-semibold mt-0.5 opacity-80">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white">All Drivers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Driver</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Vehicle</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Plate</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Rating</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Rides</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Earnings</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Pending Payout</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fleet.map((d: any) => (
                <tr key={d._id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                          {d.name?.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${d.isAvailable ? 'bg-green-400' : 'bg-slate-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{d.name}</p>
                        <p className="text-[10px] text-slate-500">ID: {d._id.substring(d._id.length - 6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white">{d.vehicleInfo?.make} {d.vehicleInfo?.model}</p>
                    <p className="text-[10px] text-slate-500">{d.vehicleInfo?.color}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs font-mono text-slate-300">{d.vehicleInfo?.plateNumber}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${VEHICLE_TYPE_COLORS[d.vehicleInfo?.type] ?? ''}`}>
                      {d.vehicleInfo?.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-white">{d.rating?.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-sm text-white">{d.totalRides}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-bold text-green-400">₹{d.earnings?.toLocaleString() || '0'}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-bold text-amber-400">₹{d.pendingPayouts?.toLocaleString() || '0'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${d.isAvailable ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                        {d.isAvailable ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {d.location !== '—'
                      ? <div className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="w-3 h-3" />{d.location}</div>
                      : <span className="text-xs text-slate-600">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
