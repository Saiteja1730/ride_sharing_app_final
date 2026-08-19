'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Car, TrendingUp, DollarSign, Activity, ArrowUp,
  ArrowDown, MapPin, Clock, Shield, CheckCircle, XCircle,
  AlertTriangle, Zap,
} from 'lucide-react';
import { adminApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

function StatCard({
  label, value, sub, icon: Icon, color, trend, trendValue,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: 'up' | 'down'; trendValue?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {trend === 'up' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBarChart({ data, color = 'bg-brand-900' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex items-end group">
          <div
            className={`w-full rounded-sm ${color} opacity-60 group-hover:opacity-100 transition-all duration-300`}
            style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-recent'],
    queryFn: () => adminApi.listUsers({ limit: 6 }).then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users-recent'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  // Fallback mock stats for display
  const s = stats ?? {
    totalUsers: 0, totalRiders: 0, totalDrivers: 0,
    activeRides: 0, totalRevenue: 0, totalCommission: 0, totalPendingPayouts: 0,
  };

  const statCards = [
    { label: 'Total Users',       value: s.totalUsers?.toLocaleString() ?? '—',  icon: Users,      color: 'from-brand-600 to-brand-900',     trend: 'up'   as const, trendValue: '+12%',  sub: `${s.totalRiders ?? 0} riders · ${s.totalDrivers ?? 0} drivers` },
    { label: 'Active Rides',      value: s.activeRides ?? '—',                   icon: MapPin,     color: 'from-violet-500 to-purple-700',   trend: 'up'   as const, trendValue: '+8%',   sub: 'Real-time dispatched trips' },
    { label: 'Total Revenue',     value: `₹${(s.totalRevenue ?? 0).toLocaleString()}`,icon: DollarSign, color: 'from-green-500 to-emerald-700',   trend: 'up'   as const, trendValue: '+23%',  sub: `Platform-wide completed fares` },
    { label: 'Platform Comm.',    value: `₹${(s.totalCommission ?? 0).toLocaleString()}`,icon: Activity,  color: 'from-amber-500 to-orange-600',    trend: 'up'   as const, trendValue: '+10%',  sub: `Total commission collected` },
    { label: 'Pending Payouts',   value: `₹${(s.totalPendingPayouts ?? 0).toLocaleString()}`,icon: DollarSign,  color: 'from-cyan-500 to-teal-700',       trend: 'down' as const, trendValue: '-4%',   sub: 'Unpaid driver earnings' },
  ];

  const weeklyRides   = [88, 112, 97, 145, 178, 203, 312];
  const weeklyRevenue = [12200, 15800, 14300, 19100, 23400, 31200, 48250];
  const hourlyActive  = [3, 5, 4, 8, 14, 22, 31, 40, 47, 43, 38, 29, 41, 53, 47, 36, 28, 33, 44, 61, 58, 47, 39, 22];

  const recentUsers = usersData?.users ?? [];

  const systemAlerts = [
    { type: 'warning', msg: '3 drivers have not updated location in 10+ min', time: '2 min ago' },
    { type: 'success', msg: 'Surge pricing activated for Koramangala zone', time: '8 min ago' },
    { type: 'info',    msg: 'New driver verified: Raj Kumar (KA-01-HX-5678)', time: '15 min ago' },
    { type: 'error',   msg: 'Payment gateway timeout on ride #R-3821', time: '22 min ago' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time platform snapshot & management controls</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-bold uppercase tracking-wide">Live Dashboard</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Rides */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-slate-900">Weekly Rides</p>
              <p className="text-xs font-medium text-slate-500">Last 7 days dispatch count</p>
            </div>
            <span className="text-xs text-green-700 font-bold px-2.5 py-1 bg-green-100 rounded-full">+18.4%</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-28 pt-2">
            {['M','T','W','T','F','S','S'].map((d, i) => {
              const pct = (weeklyRides[i] / 312) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full h-20 flex items-end justify-center bg-slate-100 rounded-md overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full bg-brand-900 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-slate-900">Revenue (₹)</p>
              <p className="text-xs font-medium text-slate-500">7-day earnings trend</p>
            </div>
            <span className="text-xs text-green-700 font-bold px-2.5 py-1 bg-green-100 rounded-full">+23.1%</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-28 pt-2">
            {weeklyRevenue.map((v, i) => {
              const pct = (v / 48250) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full h-20 flex items-end justify-center bg-slate-100 rounded-md overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full bg-green-600 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-hour activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <p className="text-base font-bold text-slate-900">24-Hour Activity</p>
            <p className="text-xs font-medium text-slate-500">Active rides per hour today</p>
          </div>
          <MiniBarChart data={hourlyActive} color="bg-indigo-500" />
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Users + System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">Recent Users</h2>
            <a href="/admin/users" className="text-sm text-brand-900 hover:text-brand-700 transition-colors font-bold">View all &rarr;</a>
          </div>
          {usersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(recentUsers.length > 0 ? recentUsers : [
                { _id: '1', name: 'Priya Sharma',   email: 'priya@demo.com',   role: 'rider',  isActive: true,  rating: 4.9 },
                { _id: '2', name: 'Raj Kumar',       email: 'raj@demo.com',     role: 'driver', isActive: true,  rating: 4.7 },
                { _id: '3', name: 'Ananya Singh',    email: 'ananya@demo.com',  role: 'rider',  isActive: true,  rating: 4.8 },
                { _id: '4', name: 'Vikram Nair',     email: 'vikram@demo.com',  role: 'driver', isActive: false, rating: 4.5 },
                { _id: '5', name: 'Meera Pillai',    email: 'meera@demo.com',   role: 'rider',  isActive: true,  rating: 5.0 },
                { _id: '6', name: 'Arjun Mehta',     email: 'arjun@demo.com',   role: 'driver', isActive: true,  rating: 4.6 },
              ]).map((u: any) => (
                <div key={u._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm font-bold flex-shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      u.role === 'driver' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate(u._id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        u.isActive ? 'text-green-600 hover:bg-red-50 hover:text-red-600' : 'text-red-600 hover:bg-green-50 hover:text-green-600'
                      }`}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-slate-900 tracking-tight">System Alerts</h2>
            <span className="text-xs font-medium text-slate-400">Auto-refreshes every 30s</span>
          </div>
          <div className="space-y-4 flex-1">
            {systemAlerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                alert.type === 'warning' ? 'bg-orange-50 border-orange-100' :
                alert.type === 'success' ? 'bg-green-50 border-green-100' :
                alert.type === 'error'   ? 'bg-red-50 border-red-100' :
                                           'bg-blue-50 border-blue-100'
              }`}>
                {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />}
                {alert.type === 'success' && <CheckCircle   className="w-5 h-5 text-green-600 flex-shrink-0" />}
                {alert.type === 'error'   && <XCircle       className="w-5 h-5 text-red-600 flex-shrink-0" />}
                {alert.type === 'info'    && <Shield        className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{alert.msg}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Trigger Surge', color: 'orange' },
                { label: 'Broadcast Alert', color: 'blue' },
                { label: 'Fleet Report', color: 'green' },
                { label: 'Export Data', color: 'indigo' },
              ].map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => toast.success(`${label} triggered`)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 border
                    ${color === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' :
                      color === 'blue'   ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' :
                      color === 'green'  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' :
                                           'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
