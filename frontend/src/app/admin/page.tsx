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
    <div className="glass-card p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBarChart({ data, color = 'bg-violet-500' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex items-end">
          <div
            className={`w-full rounded-sm ${color} opacity-70 hover:opacity-100 transition-opacity`}
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
    { label: 'Total Users',       value: s.totalUsers?.toLocaleString() ?? '—',  icon: Users,      color: 'from-brand-500 to-brand-700',     trend: 'up'   as const, trendValue: '+12%',  sub: `${s.totalRiders ?? 0} riders · ${s.totalDrivers ?? 0} drivers` },
    { label: 'Active Rides',      value: s.activeRides ?? '—',                   icon: MapPin,     color: 'from-violet-500 to-purple-700',   trend: 'up'   as const, trendValue: '+8%',   sub: 'Real-time dispatched trips' },
    { label: 'Total Revenue',     value: `₹${(s.totalRevenue ?? 0).toLocaleString()}`,icon: DollarSign, color: 'from-green-500 to-emerald-700',   trend: 'up'   as const, trendValue: '+23%',  sub: `Platform-wide completed fares` },
    { label: 'Platform Comm.',    value: `₹${(s.totalCommission ?? 0).toLocaleString()}`,icon: Activity,  color: 'from-amber-500 to-orange-700',    trend: 'up'   as const, trendValue: '+10%',  sub: `Total commission collected` },
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
          <h1 className="text-3xl font-display font-bold text-white">Admin Overview</h1>
          <p className="text-slate-400 mt-1">Real-time platform snapshot & management controls</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-400 font-semibold">Live Dashboard</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Rides */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">Weekly Rides</p>
              <p className="text-xs text-slate-500">Last 7 days dispatch count</p>
            </div>
            <span className="text-xs text-green-400 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">+18.4%</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-24 pt-2">
            {['M','T','W','T','F','S','S'].map((d, i) => {
              const pct = (weeklyRides[i] / 312) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full h-16 flex items-end justify-center bg-white/4 rounded overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t group-hover:from-brand-500 group-hover:to-brand-300 transition-all duration-500"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium">{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">Revenue (₹)</p>
              <p className="text-xs text-slate-500">7-day earnings trend</p>
            </div>
            <span className="text-xs text-green-400 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">+23.1%</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-24 pt-2">
            {weeklyRevenue.map((v, i) => {
              const pct = (v / 48250) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full h-16 flex items-end justify-center bg-white/4 rounded overflow-hidden">
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t group-hover:from-emerald-500 group-hover:to-green-300 transition-all duration-500"
                    />
                  </div>
                  <span className="text-[9px] text-slate-500">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-hour activity */}
        <div className="glass-card p-5 space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-200">24-Hour Activity</p>
            <p className="text-xs text-slate-500">Active rides per hour today</p>
          </div>
          <MiniBarChart data={hourlyActive} color="bg-violet-500" />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Users + System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Users</h2>
            <a href="/admin/users" className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">View all →</a>
          </div>
          {usersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 skeleton rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(recentUsers.length > 0 ? recentUsers : [
                { _id: '1', name: 'Priya Sharma',   email: 'priya@demo.com',   role: 'rider',  isActive: true,  rating: 4.9 },
                { _id: '2', name: 'Raj Kumar',       email: 'raj@demo.com',     role: 'driver', isActive: true,  rating: 4.7 },
                { _id: '3', name: 'Ananya Singh',    email: 'ananya@demo.com',  role: 'rider',  isActive: true,  rating: 4.8 },
                { _id: '4', name: 'Vikram Nair',     email: 'vikram@demo.com',  role: 'driver', isActive: false, rating: 4.5 },
                { _id: '5', name: 'Meera Pillai',    email: 'meera@demo.com',   role: 'rider',  isActive: true,  rating: 5.0 },
                { _id: '6', name: 'Arjun Mehta',     email: 'arjun@demo.com',   role: 'driver', isActive: true,  rating: 4.6 },
              ]).map((u: any) => (
                <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'driver' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    }`}>
                      {u.role}
                    </span>
                    <button
                      onClick={() => toggleMutation.mutate(u._id)}
                      className={`p-1 rounded-lg transition-colors ${
                        u.isActive ? 'text-green-400 hover:text-red-400 hover:bg-red-500/10' : 'text-red-400 hover:text-green-400 hover:bg-green-500/10'
                      }`}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">System Alerts</h2>
            <span className="text-xs text-slate-500">Auto-refreshes every 30s</span>
          </div>
          <div className="space-y-3">
            {systemAlerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                alert.type === 'success' ? 'bg-green-500/5 border-green-500/20' :
                alert.type === 'error'   ? 'bg-red-500/5 border-red-500/20' :
                                           'bg-brand-500/5 border-brand-500/20'
              }`}>
                {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />}
                {alert.type === 'success' && <CheckCircle   className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />}
                {alert.type === 'error'   && <XCircle       className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                {alert.type === 'info'    && <Shield        className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.msg}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Trigger Surge', color: 'amber' },
                { label: 'Broadcast Alert', color: 'brand' },
                { label: 'Fleet Report', color: 'green' },
                { label: 'Export Data', color: 'violet' },
              ].map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => toast.success(`${label} triggered`)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border
                    ${color === 'amber'  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' :
                      color === 'brand'  ? 'bg-brand-500/10 border-brand-500/20 text-brand-400 hover:bg-brand-500/20' :
                      color === 'green'  ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' :
                                           'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'
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
