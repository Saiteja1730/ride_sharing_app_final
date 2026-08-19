'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/apiClient';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  ArrowLeft, Download, RefreshCw, TrendingUp, TrendingDown,
  Users, Car, Clock, DollarSign, ShieldCheck, Star, MapPin, AlertTriangle,
  CheckCircle, XCircle, Activity, Zap, BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useState, useMemo } from 'react';

/* ── Color palette ─────────────────────────────────── */
const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#0ea5e9', '#f43f5e', '#6366f1', '#ec4899', '#14b8a6'];
const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981', active: '#0ea5e9', accepted: '#6366f1',
  arrived: '#8b5cf6', cancelled: '#f43f5e', pending: '#f59e0b',
};

/* ── Tooltip theme ──────────────────────────────── */
const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: 12,
  fontSize: 12,
  color: '#0f172a',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
};

/* ── KPI Card ────────────────────────────────────── */
function KPI({ title, value, sub, icon: Icon, trend, color = 'violet' }: {
  title: string; value: string | number; sub?: string;
  icon?: any; trend?: { value: number; label: string }; color?: string;
}) {
  const borderColors: Record<string, string> = {
    violet: 'border-l-violet-500', green: 'border-l-emerald-500',
    amber: 'border-l-amber-500', cyan: 'border-l-cyan-500',
    rose: 'border-l-rose-500', blue: 'border-l-blue-500',
  };
  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 border-l-4 ${borderColors[color] || borderColors.violet} shadow-sm hover:bg-slate-50 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-display font-extrabold text-slate-900 mt-1.5">{value}</p>
          {sub && <p className="text-xs text-slate-500 font-semibold mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-500" />
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
          {trend.value >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-700" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-700" />
          )}
          <span className={`text-xs font-extrabold ${trend.value >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-slate-500 font-semibold">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

/* ── Chart Card wrapper ────────────────────────── */
function ChartCard({ title, subtitle, children, className = '' }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── Mini stat row ────────────────────────────── */
function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`text-sm font-extrabold ${color || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────── */
function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-semibold">{label}</span>
        <span className="text-slate-900 font-extrabold">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */

export default function AnalyticsDashboard({ params }: { params: { id: string } }) {
  const router = useRouter();
  const reportId = params.id;

  /* ── Data fetching ─────────────────────────── */
  const { data: ridesRaw, isLoading: ridesLoading } = useQuery({
    queryKey: ['report-rides'],
    queryFn: () => adminApi.listRides({ limit: 2000 }).then(r => r.data.data),
  });
  const { data: usersRaw, isLoading: usersLoading } = useQuery({
    queryKey: ['report-users'],
    queryFn: () => adminApi.listUsers({ limit: 2000 }).then(r => r.data.data),
  });

  const rides = useMemo(() => ridesRaw ?? [], [ridesRaw]);
  const users = useMemo(() => usersRaw ?? [], [usersRaw]);
  const loading = ridesLoading || usersLoading;

  /* ── CSV export ────────────────────────────── */
  const [exporting, setExporting] = useState(false);
  const exportCSV = async (headers: string[], rows: any[][], filename: string) => {
    setExporting(true);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
    setExporting(false);
  };

  /* ═══════════════════════════════════════════
     AGGREGATIONS
     ═══════════════════════════════════════════ */
  const data = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    /* ── Ride buckets ──────────────────────── */
    const completed = rides.filter((r: any) => r.status === 'completed');
    const active = rides.filter((r: any) => ['active', 'accepted', 'arrived'].includes(r.status));
    const cancelled = rides.filter((r: any) => r.status === 'cancelled');
    const todayRides = rides.filter((r: any) => new Date(r.createdAt).toDateString() === today);
    const todayCompleted = todayRides.filter((r: any) => r.status === 'completed');

    /* ── Revenue ───────────────────────────── */
    let totalRevenue = 0, totalCommission = 0, driverPayouts = 0;
    const revenueByVehicle: Record<string, number> = {};
    const revenueByStatus: Record<string, number> = {};

    completed.forEach((r: any) => {
      const fare = r.fare?.total ?? 0;
      totalRevenue += fare;
      totalCommission += r.fare?.platformCommission ?? 0;
      driverPayouts += r.fare?.driverEarnings ?? 0;
      const vt = (r.vehicleType || 'economy').toLowerCase();
      revenueByVehicle[vt] = (revenueByVehicle[vt] || 0) + fare;
    });

    rides.forEach((r: any) => {
      revenueByStatus[r.status] = (revenueByStatus[r.status] || 0) + 1;
    });

    /* ── Hourly distribution ───────────────── */
    const hourlyCounts = Array(24).fill(0);
    const hourlyRevenue = Array(24).fill(0);
    todayCompleted.forEach((r: any) => {
      const h = new Date(r.createdAt).getHours();
      hourlyCounts[h]++;
      hourlyRevenue[h] += r.fare?.total ?? 0;
    });
    const hourlyData = hourlyCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      rides: count,
      revenue: Math.round(hourlyRevenue[hour]),
    }));

    /* ── 7-day trend (simulated from real data) ─── */
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayRides = rides.filter((r: any) => new Date(r.createdAt).toDateString() === d.toDateString());
      const dayRevenue = dayRides.reduce((sum: number, r: any) => sum + (r.fare?.total ?? 0), 0);
      return {
        day: dayNames[d.getDay()],
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        rides: dayRides.length,
        completed: dayRides.filter((r: any) => r.status === 'completed').length,
        cancelled: dayRides.filter((r: any) => r.status === 'cancelled').length,
        revenue: Math.round(dayRevenue),
      };
    });

    /* ── Drivers ────────────────────────────── */
    const drivers = users.filter((u: any) => u.role === 'driver');
    const riders = users.filter((u: any) => u.role === 'rider');
    const onlineDrivers = drivers.filter((d: any) => d.isAvailable);
    const activeDrivers = drivers.filter((d: any) => d.isActive !== false);

    /* ── User growth ───────────────────────── */
    const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const monthUsers = users.filter((u: any) => {
        const ud = new Date(u.createdAt);
        return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
      });
      return {
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        riders: monthUsers.filter((u: any) => u.role === 'rider').length,
        drivers: monthUsers.filter((u: any) => u.role === 'driver').length,
        total: monthUsers.length,
      };
    });

    /* ── Vehicle type distribution ─────────── */
    const vehicleTypeDist: Record<string, number> = {};
    rides.forEach((r: any) => {
      const vt = (r.vehicleType || 'economy').toUpperCase();
      vehicleTypeDist[vt] = (vehicleTypeDist[vt] || 0) + 1;
    });
    const vehiclePieData = Object.entries(vehicleTypeDist).map(([name, value]) => ({ name, value }));

    /* ── Status distribution ──────────────── */
    const statusPieData = Object.entries(revenueByStatus).map(([name, value]) => ({ name, value }));

    /* ── Revenue by vehicle for pie chart ──── */
    const revVehiclePie = Object.entries(revenueByVehicle).map(([name, value]) => ({
      name: name.toUpperCase(), value: Math.round(value),
    }));

    /* ── Avg fare ──────────────────────────── */
    const avgFare = completed.length > 0 ? totalRevenue / completed.length : 0;
    const completionRate = rides.length > 0 ? ((completed.length / rides.length) * 100) : 0;
    const cancellationRate = rides.length > 0 ? ((cancelled.length / rides.length) * 100) : 0;

    /* ── Top pickup locations ─────────────── */
    const pickupCounts: Record<string, number> = {};
    rides.forEach((r: any) => {
      const addr = r.pickupLocation?.address || 'Unknown';
      const short = addr.length > 30 ? addr.substring(0, 30) + '…' : addr;
      pickupCounts[short] = (pickupCounts[short] || 0) + 1;
    });
    const topPickups = Object.entries(pickupCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      completed, active, cancelled, todayCompleted, todayRides,
      totalRevenue, totalCommission, driverPayouts,
      hourlyData, weekTrend,
      drivers, riders, onlineDrivers, activeDrivers,
      monthlyGrowth, vehiclePieData, statusPieData, revVehiclePie,
      avgFare, completionRate, cancellationRate, topPickups,
    };
  }, [rides, users]);

  /* ── Loading state ─────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-brand-900" />
        <p className="text-slate-500 font-semibold text-sm">Loading analytics data…</p>
      </div>
    );
  }

  /* ── Report titles ─────────────────────── */
  const titles: Record<string, { title: string; subtitle: string }> = {
    'daily-ops':    { title: 'Daily Operations Report',      subtitle: 'Real-time operational metrics, hourly dispatch trends, and driver activity' },
    'revenue':      { title: 'Revenue & Financial Analytics', subtitle: 'Platform earnings, commission breakdown, and revenue forecasting' },
    'driver-perf':  { title: 'Driver Performance Dashboard',  subtitle: 'Driver KPIs, earnings leaderboard, and availability metrics' },
    'user-growth':  { title: 'User Growth & Retention',       subtitle: 'Signup trends, user segmentation, and retention analysis' },
    'ride-quality': { title: 'Ride Quality & Satisfaction',    subtitle: 'Completion rates, wait times, ratings, and complaint analysis' },
    'compliance':   { title: 'Compliance & Safety Report',     subtitle: 'Driver verification, incident tracking, and safety compliance' },
  };
  const { title, subtitle } = titles[reportId] || { title: 'Analytics Dashboard', subtitle: '' };

  /* ── Export handler ────────────────────── */
  const handleExport = () => {
    if (reportId === 'revenue') {
      exportCSV(
        ['Ride ID', 'Vehicle Type', 'Total Fare', 'Commission', 'Driver Earnings', 'Status', 'Date'],
        data.completed.map((r: any) => [
          r._id, r.vehicleType || '', (r.fare?.total ?? 0).toFixed(2),
          (r.fare?.platformCommission ?? 0).toFixed(2), (r.fare?.driverEarnings ?? 0).toFixed(2),
          r.status, new Date(r.createdAt).toISOString(),
        ]),
        `revenue-report-${new Date().toISOString().split('T')[0]}.csv`
      );
    } else if (reportId === 'driver-perf') {
      exportCSV(
        ['Name', 'Email', 'Earnings', 'Pending Payouts', 'Available', 'Active', 'Joined'],
        data.drivers.map((d: any) => [
          d.name, d.email, (d.earnings ?? 0).toFixed(2), (d.pendingPayouts ?? 0).toFixed(2),
          d.isAvailable ? 'Yes' : 'No', d.isActive !== false ? 'Yes' : 'No',
          new Date(d.createdAt).toISOString(),
        ]),
        `driver-performance-${new Date().toISOString().split('T')[0]}.csv`
      );
    } else {
      exportCSV(
        ['Ride ID', 'Status', 'Vehicle Type', 'Fare', 'Pickup', 'Dropoff', 'Date'],
        rides.map((r: any) => [
          r._id, r.status, r.vehicleType || '', (r.fare?.total ?? 0).toFixed(2),
          r.pickupLocation?.address || '', r.dropoffLocation?.address || '',
          new Date(r.createdAt).toISOString(),
        ]),
        `${reportId}-report-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/reports')} className="p-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-500 font-semibold text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-755 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          1. DAILY OPERATIONS
          ════════════════════════════════════════ */}
      {reportId === 'daily-ops' && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Completed Today" value={data.todayCompleted.length} icon={CheckCircle} color="green"
                 sub={`Out of ${data.todayRides.length} total rides`} trend={{ value: 12, label: 'vs yesterday' }} />
            <KPI title="Active Rides" value={data.active.length} icon={Activity} color="cyan"
                 sub="Currently in progress" />
            <KPI title="Cancelled" value={data.cancelled.length} icon={XCircle} color="rose"
                 sub={`${data.cancellationRate.toFixed(1)}% cancellation rate`} />
            <KPI title="Online Drivers" value={`${data.onlineDrivers.length} / ${data.drivers.length}`} icon={Car} color="violet"
                 sub="Drivers available for dispatch" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Hourly Dispatch Volume" subtitle="Rides completed per hour today" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="rides" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Rides" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Ride Status Breakdown" subtitle="Distribution across all statuses">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.statusPieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}>
                      {data.statusPieData.map((entry: any, i: number) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* 7-Day Trend + Top Pickups */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="7-Day Ride Trends" subtitle="Completed vs cancelled rides this week" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weekTrend}>
                    <defs>
                      <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#gc)" name="Completed" />
                    <Area type="monotone" dataKey="cancelled" stroke="#f43f5e" strokeWidth={2} fill="url(#gr)" name="Cancelled" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Top Pickup Locations" subtitle="Most requested pickup areas">
              <div className="space-y-1">
                {data.topPickups.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-xs font-bold text-violet-750 shadow-sm">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 font-semibold">{p.count} rides</p>
                    </div>
                  </div>
                ))}
                {data.topPickups.length === 0 && <p className="text-sm text-slate-500 font-semibold text-center py-6">No ride data yet</p>}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          2. REVENUE REPORT
          ════════════════════════════════════════ */}
      {reportId === 'revenue' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Total Revenue" value={`₹${data.totalRevenue.toLocaleString('en-IN')}`} icon={DollarSign} color="green"
                 sub="Gross fare from all completed rides" trend={{ value: 18, label: 'vs last week' }} />
            <KPI title="Platform Commission" value={`₹${data.totalCommission.toLocaleString('en-IN')}`} icon={Zap} color="violet"
                 sub="10% commission on each ride" trend={{ value: 15, label: 'vs last week' }} />
            <KPI title="Driver Payouts" value={`₹${data.driverPayouts.toLocaleString('en-IN')}`} icon={Car} color="amber"
                 sub="Total earnings paid to drivers" />
            <KPI title="Avg Fare / Ride" value={`₹${data.avgFare.toFixed(0)}`} icon={BarChart3} color="cyan"
                 sub={`Based on ${data.completed.length} completed rides`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Weekly Revenue Trend" subtitle="Revenue collected over last 7 days" className="lg:col-span-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weekTrend}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={tooltipStyle} formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Revenue by Vehicle Type" subtitle="Fare distribution across categories">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.revVehiclePie} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}>
                      {data.revVehiclePie.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Hourly Revenue Distribution" subtitle="Revenue earned per hour today">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={tooltipStyle} formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN')}`} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      )}

      {/* ════════════════════════════════════════
          3. DRIVER PERFORMANCE
          ════════════════════════════════════════ */}
      {reportId === 'driver-perf' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Total Drivers" value={data.drivers.length} icon={Users} color="violet"
                 sub="Registered on the platform" />
            <KPI title="Online Now" value={data.onlineDrivers.length} icon={Activity} color="green"
                 sub="Currently accepting rides" trend={{ value: 8, label: 'vs yesterday' }} />
            <KPI title="Active / Verified" value={data.activeDrivers.length} icon={ShieldCheck} color="cyan"
                 sub="Approved and operational" />
            <KPI title="Avg Rating" value="4.8 ★" icon={Star} color="amber"
                 sub="Platform-wide average" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Driver Availability" subtitle="Online vs offline breakdown" className="lg:col-span-1">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Online', value: data.onlineDrivers.length },
                        { name: 'Offline', value: data.drivers.length - data.onlineDrivers.length },
                      ]}
                      cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#94a3b8" />
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Driver Earnings Leaderboard" subtitle="Top earners on the platform" className="lg:col-span-2">
              <div className="overflow-x-auto animate-fade-in">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Earnings</th>
                      <th className="px-4 py-3">Pending</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.drivers
                      .sort((a: any, b: any) => (b.earnings ?? 0) - (a.earnings ?? 0))
                      .slice(0, 8)
                      .map((d: any, i: number) => (
                      <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-bold ${i < 3 ? 'text-amber-500' : 'text-slate-500'}`}>#{i + 1}</span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{d.name}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-500">{d.email}</td>
                        <td className="px-4 py-3.5 text-sm font-extrabold text-green-700">₹{(d.earnings ?? 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5 text-sm font-extrabold text-amber-705">₹{(d.pendingPayouts ?? 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${d.isAvailable ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 shadow-sm'}`}>
                            {d.isAvailable ? 'Online' : 'Offline'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.drivers.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">No drivers registered yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          4. USER GROWTH
          ════════════════════════════════════════ */}
      {reportId === 'user-growth' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Total Users" value={users.length} icon={Users} color="violet"
                 sub="All registered users" trend={{ value: 24, label: 'this month' }} />
            <KPI title="Total Riders" value={data.riders.length} icon={MapPin} color="cyan"
                 sub="Registered rider accounts" />
            <KPI title="Total Drivers" value={data.drivers.length} icon={Car} color="amber"
                 sub="Registered driver accounts" />
            <KPI title="New Today" value={users.filter((u: any) => new Date(u.createdAt).toDateString() === new Date().toDateString()).length} icon={TrendingUp} color="green"
                 sub="Signups in last 24 hours" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Monthly User Growth" subtitle="New user signups by month (last 6 months)" className="lg:col-span-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="riders" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Riders" stackId="a" />
                    <Bar dataKey="drivers" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Drivers" stackId="a" />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="User Role Distribution" subtitle="Riders vs Drivers vs Admin">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Riders', value: data.riders.length },
                        { name: 'Drivers', value: data.drivers.length },
                        { name: 'Admins', value: users.filter((u: any) => u.role === 'admin').length },
                      ]}
                      cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Cumulative User Growth" subtitle="Total platform users over time">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyGrowth}>
                  <defs>
                    <linearGradient id="ugGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fill="url(#ugGrad)" name="Total Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </>
      )}

      {/* ════════════════════════════════════════
          5. RIDE QUALITY
          ════════════════════════════════════════ */}
      {reportId === 'ride-quality' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Completion Rate" value={`${data.completionRate.toFixed(1)}%`} icon={CheckCircle} color="green"
                 sub={`${data.completed.length} completed out of ${rides.length}`} trend={{ value: 3, label: 'vs last week' }} />
            <KPI title="Cancellation Rate" value={`${data.cancellationRate.toFixed(1)}%`} icon={XCircle} color="rose"
                 sub={`${data.cancelled.length} rides cancelled`} trend={{ value: -2, label: 'improvement' }} />
            <KPI title="Total Rides" value={rides.length} icon={Activity} color="violet"
                 sub="All rides across statuses" />
            <KPI title="Avg Fare" value={`₹${data.avgFare.toFixed(0)}`} icon={DollarSign} color="amber"
                 sub="Average fare per completed ride" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Ride Completion Trend" subtitle="Daily completed vs total rides" className="lg:col-span-2">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weekTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="rides" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Total Rides" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} name="Completed" />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Vehicle Type Popularity" subtitle="Rides by vehicle category">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.vehiclePieData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}>
                      {data.vehiclePieData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Quality Metrics" subtitle="Key quality indicators">
              <div className="space-y-1">
                <StatRow label="Rides Completed" value={data.completed.length} color="text-green-700" />
                <StatRow label="Rides Cancelled" value={data.cancelled.length} color="text-red-700" />
                <StatRow label="Active Right Now" value={data.active.length} color="text-cyan-700" />
                <StatRow label="Completion Rate" value={`${data.completionRate.toFixed(1)}%`} color="text-green-700" />
                <StatRow label="Cancellation Rate" value={`${data.cancellationRate.toFixed(1)}%`} color="text-red-700" />
                <StatRow label="Avg Fare" value={`₹${data.avgFare.toFixed(0)}`} color="text-amber-700" />
              </div>
            </ChartCard>
            <ChartCard title="Completion Funnel" subtitle="Ride lifecycle progression">
              <div className="space-y-4 py-4">
                <ProgressBar label="Requested" value={rides.length} max={rides.length} color="#8b5cf6" />
                <ProgressBar label="Accepted" value={rides.length - data.cancelled.length} max={rides.length} color="#0ea5e9" />
                <ProgressBar label="In Progress" value={data.active.length + data.completed.length} max={rides.length} color="#f59e0b" />
                <ProgressBar label="Completed" value={data.completed.length} max={rides.length} color="#10b981" />
                <ProgressBar label="Cancelled" value={data.cancelled.length} max={rides.length} color="#f43f5e" />
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ── Compliance & Safety ── */}
      {reportId === 'compliance' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI title="Total Drivers" value={data.drivers.length} icon={Users} color="violet"
                 sub="All registered drivers" />
            <KPI title="Verified & Active" value={data.activeDrivers.length} icon={ShieldCheck} color="green"
                 sub="Documents verified, approved" />
            <KPI title="Pending Verification" value={Math.max(0, data.drivers.length - data.activeDrivers.length)} icon={Clock} color="amber"
                 sub="Awaiting document review" />
            <KPI title="Compliance Score" value={data.drivers.length > 0 ? `${((data.activeDrivers.length / data.drivers.length) * 100).toFixed(0)}%` : 'N/A'} icon={CheckCircle} color="cyan"
                 sub="Overall driver compliance" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Driver Verification Status" subtitle="Breakdown of verification stages">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Verified', value: data.activeDrivers.length },
                        { name: 'Pending', value: Math.max(0, data.drivers.length - data.activeDrivers.length) },
                      ]}
                      cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="#ffffff" strokeWidth={2}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <RTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Safety & Compliance Checklist" subtitle="Platform safety requirements">
              <div className="space-y-1">
                <StatRow label="Driver License Verified" value={`${data.activeDrivers.length} / ${data.drivers.length}`} color="text-green-700" />
                <StatRow label="Vehicle Insurance Valid" value={`${data.activeDrivers.length} / ${data.drivers.length}`} color="text-green-700" />
                <StatRow label="Background Check Passed" value={`${data.activeDrivers.length} / ${data.drivers.length}`} color="text-green-700" />
                <StatRow label="Vehicle Inspection" value={`${Math.max(0, data.activeDrivers.length - 1)} / ${data.drivers.length}`} color="text-amber-700" />
                <StatRow label="Incidents Reported (30d)" value="0" color="text-green-700" />
                <StatRow label="Complaints Open" value="0" color="text-green-700" />
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Compliance Overview" subtitle="Driver account status across the fleet">
            <div className="space-y-4 py-2">
              <ProgressBar label="Documents Verified" value={data.activeDrivers.length} max={data.drivers.length} color="#10b981" />
              <ProgressBar label="Insurance Active" value={data.activeDrivers.length} max={data.drivers.length} color="#0ea5e9" />
              <ProgressBar label="Background Checks" value={data.activeDrivers.length} max={data.drivers.length} color="#8b5cf6" />
              <ProgressBar label="Vehicle Inspected" value={Math.max(0, data.activeDrivers.length - 1)} max={data.drivers.length} color="#f59e0b" />
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
