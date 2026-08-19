'use client';

import { useQuery } from '@tanstack/react-query';
import { Car, Star, MapPin, TrendingUp, CheckCircle, XCircle, Zap, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';



const VEHICLE_TYPE_COLORS: Record<string, string> = {
  economy: 'text-brand-700 bg-brand-50 border-brand-200',
  premium: 'text-amber-700 bg-amber-50 border-amber-200',
  suv:     'text-violet-700 bg-violet-50 border-violet-200',
  xl:      'text-cyan-700 bg-cyan-50 border-cyan-200',
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
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Fleet Management</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Track and manage all registered drivers & vehicles</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Online',    value: online,    color: 'from-green-600 to-emerald-700', dot: 'bg-green-400'  },
          { label: 'On a Trip', value: onTrip,    color: 'from-cyan-600 to-teal-700',     dot: 'bg-cyan-400'   },
          { label: 'Available', value: available, color: 'from-brand-600 to-brand-900',   dot: 'bg-brand-400'  },
          { label: 'Offline',   value: offline,   color: 'from-slate-600 to-slate-800',   dot: 'bg-slate-500'  },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 relative shadow-sm`}>
              <Car className="w-4 h-4 text-white" />
              <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${dot} border border-white`} />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle type breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Fleet Breakdown by Vehicle Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(typeBreakdown).map(([type, count]: any) => (
            <div key={type} className={`p-3 rounded-xl border shadow-sm ${VEHICLE_TYPE_COLORS[type] ?? 'text-slate-600 bg-slate-50 border-slate-200'}`}>
              <p className="text-2xl font-display font-bold">{count}</p>
              <p className="text-xs capitalize font-semibold mt-0.5 opacity-85">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-bold text-slate-900">All Drivers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3.5">Driver</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Vehicle</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Plate</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Type</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Rating</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Rides</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Earnings</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Pending Payout</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fleet.map((d: any) => (
                <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {d.name?.charAt(0)}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${d.isAvailable ? 'bg-green-400' : 'bg-slate-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">ID: {d._id.substring(d._id.length - 6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-900">{d.vehicleInfo?.make} {d.vehicleInfo?.model}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{d.vehicleInfo?.color}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs font-mono font-medium text-slate-700">{d.vehicleInfo?.plateNumber}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border capitalize shadow-sm ${VEHICLE_TYPE_COLORS[d.vehicleInfo?.type] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {d.vehicleInfo?.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm">{d.rating?.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-sm font-semibold text-slate-900">{d.totalRides}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-extrabold text-green-700">₹{d.earnings?.toLocaleString() || '0'}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-extrabold text-amber-700">₹{d.pendingPayouts?.toLocaleString() || '0'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border w-fit shadow-sm ${d.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {d.isAvailable ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {d.location !== '—'
                      ? <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium"><MapPin className="w-3 h-3 text-slate-400" />{d.location}</div>
                      : <span className="text-xs text-slate-400 font-medium">—</span>
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
