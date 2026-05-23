'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Users, Car, DollarSign, MapPin, Star, Clock } from 'lucide-react';

function AreaChart({ data, color = '#7c3aed', height = 80 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100 / (data.length - 1);
  const points = data.map((v, i) => `${i * w},${height - ((v - min) / range) * height}`).join(' ');
  const areaPoints = `0,${height} ${points} ${(data.length - 1) * w},${height}`;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, c) => s + c.value, 0);
  let cumulative = 0;
  const r = 40;
  const cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-28 h-28 flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const offset = cumulative;
          cumulative += pct * circumference;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={-(offset)}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-white" fill="white" fontSize="14" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="7">total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-slate-400 truncate">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-white">{seg.value}</span>
              <span className="text-[10px] text-slate-600">{((seg.value / total) * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PERIODS = ['7D', '30D', '90D', '1Y'] as const;

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<typeof PERIODS[number]>('30D');

  const rideData    = [88, 112, 97, 145, 178, 203, 312, 289, 334, 298, 411, 378, 420, 389, 445, 412, 467, 433, 489, 512, 478, 534, 501, 556, 523, 589, 567, 612, 578, 634];
  const revenueData = [12200, 15800, 14300, 19100, 23400, 31200, 48250, 43100, 52300, 46800, 64100, 59200, 65800, 60900, 69700, 64500, 73200, 67800, 76500, 80100, 74800, 83600, 78400, 87100, 81900, 92300, 88700, 95800, 90400, 99200];
  const userGrowth  = [1820, 1854, 1891, 1928, 1972, 2015, 2068, 2101, 2148, 2189, 2231, 2278, 2312, 2359, 2401, 2448, 2489, 2531, 2578, 2621, 2668, 2701, 2748, 2789, 2831, 2878, 2921, 2969, 3011, 2847];

  const slice = (arr: number[]) => {
    if (period === '7D')  return arr.slice(-7);
    if (period === '30D') return arr;
    if (period === '90D') return arr; // would normally have more
    return arr;
  };

  const kpis = [
    { label: 'Total Rides',       value: '12,847',  change: '+18.4%', up: true,  icon: MapPin,      color: 'from-brand-500 to-brand-700',   data: slice(rideData)    },
    { label: 'Gross Revenue',     value: '₹9.84L',  change: '+23.1%', up: true,  icon: DollarSign,  color: 'from-green-500 to-emerald-700', data: slice(revenueData)  },
    { label: 'Active Users',      value: '2,847',   change: '+12.0%', up: true,  icon: Users,       color: 'from-violet-500 to-purple-700', data: slice(userGrowth)   },
    { label: 'Avg Fare',          value: '₹185.40', change: '+4.8%',  up: true,  icon: TrendingUp,  color: 'from-cyan-500 to-teal-700',     data: slice(rideData).map(v => v * 0.6) },
    { label: 'Cancellation Rate', value: '8.2%',    change: '-1.3%',  up: false, icon: TrendingDown,color: 'from-red-500 to-rose-700',      data: slice(rideData).map(v => v * 0.08)},
    { label: 'Avg Rating',        value: '4.78 ★',  change: '+0.06',  up: true,  icon: Star,        color: 'from-amber-500 to-orange-700',  data: slice(rideData).map(() => 4.7 + Math.random() * 0.2) },
  ];

  const vehicleSegments = [
    { label: 'Economy',  value: 6840, color: '#4c63f6' },
    { label: 'Premium',  value: 3214, color: '#7c3aed' },
    { label: 'SUV',      value: 2102, color: '#f59e0b' },
    { label: 'XL',       value:  691, color: '#06b6d4' },
  ];

  const zoneData = [
    { zone: 'Koramangala',   rides: 2841, revenue: 527000, surge: '1.4x' },
    { zone: 'Indiranagar',   rides: 2314, revenue: 431000, surge: '1.3x' },
    { zone: 'Whitefield',    rides: 1987, revenue: 589000, surge: '1.2x' },
    { zone: 'MG Road',       rides: 1756, revenue: 312000, surge: '1.5x' },
    { zone: 'HSR Layout',    rides: 1432, revenue: 265000, surge: '1.1x' },
    { zone: 'JP Nagar',      rides: 1098, revenue: 198000, surge: '1.0x' },
    { zone: 'BLR Airport',   rides:  687, revenue: 412000, surge: '1.6x' },
  ];

  const peakHours = [2, 3, 2, 1, 2, 4, 8, 14, 22, 31, 40, 47, 43, 38, 29, 41, 53, 61, 58, 47, 39, 28, 18, 10];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Deep platform insights and growth metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p ? 'bg-violet-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map(({ label, value, change, up, icon: Icon, color, data }) => (
          <div key={label} className="glass-card p-5 hover:border-white/20 transition-all duration-300 overflow-hidden relative">
            {/* Mini sparkline bg */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <AreaChart data={data} color={up ? '#22c55e' : '#ef4444'} height={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                }`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {change}
                </span>
              </div>
              <p className="text-2xl font-display font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rides over time */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Ride Volume Over Time</p>
              <p className="text-xs text-slate-500">Daily dispatched trips — {period}</p>
            </div>
            <span className="text-xs text-green-400 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">+18.4%</span>
          </div>
          <div className="h-40">
            <AreaChart data={slice(rideData)} color="#4c63f6" height={160} />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>{period === '7D' ? '7 days ago' : period === '30D' ? '30 days ago' : '90 days ago'}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Vehicle type mix */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <p className="font-semibold text-white">Vehicle Type Mix</p>
            <p className="text-xs text-slate-500">Ride distribution by class</p>
          </div>
          <DonutChart segments={vehicleSegments} />
        </div>
      </div>

      {/* Revenue trend + Peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Revenue Trend</p>
              <p className="text-xs text-slate-500">Daily gross revenue (₹)</p>
            </div>
            <span className="text-xs text-green-400 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">+23.1%</span>
          </div>
          <div className="h-32">
            <AreaChart data={slice(revenueData)} color="#22c55e" height={128} />
          </div>
        </div>

        {/* Peak Hours */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <p className="font-semibold text-white">Peak Hour Distribution</p>
            <p className="text-xs text-slate-500">Average active rides per hour</p>
          </div>
          <div className="flex items-end gap-1 h-24">
            {peakHours.map((v, i) => {
              const max = Math.max(...peakHours);
              const pct = (v / max) * 100;
              const isPeak = v >= 40;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                  <div className="relative w-full h-20 flex items-end justify-center">
                    <div
                      style={{ height: `${pct}%` }}
                      className={`w-full rounded-t transition-all duration-500 ${isPeak ? 'bg-gradient-to-t from-violet-600 to-violet-400' : 'bg-white/10 group-hover:bg-white/20'}`}
                    />
                  </div>
                  {i % 4 === 0 && <span className="text-[8px] text-slate-600">{i}h</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-violet-500" /><span className="text-slate-400">Peak</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-white/10" /><span className="text-slate-400">Normal</span></div>
          </div>
        </div>
      </div>

      {/* Zone performance table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Zone Performance</h2>
            <p className="text-xs text-slate-500">Bengaluru pickup zones breakdown</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Zone</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Rides</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Revenue</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Share</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Surge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {zoneData.map((z, i) => {
                const totalRides = zoneData.reduce((s, z) => s + z.rides, 0);
                const share = (z.rides / totalRides) * 100;
                return (
                  <tr key={z.zone} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <span className="text-xs text-slate-600 font-mono w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-white">{z.zone}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{z.rides.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-400 font-semibold hidden sm:table-cell">₹{(z.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden" style={{ width: '80px' }}>
                          <div className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 w-8">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        parseFloat(z.surge) >= 1.4 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        parseFloat(z.surge) >= 1.2 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                      }`}>
                        {z.surge}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
