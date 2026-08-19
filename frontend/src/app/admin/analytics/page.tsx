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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
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
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-slate-900 font-bold" fill="#0f172a" fontSize="14" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="7">total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-xs font-bold text-slate-600 truncate">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-slate-900">{seg.value}</span>
              <span className="text-[10px] text-slate-400 font-medium">{((seg.value / total) * 100).toFixed(0)}%</span>
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
    { label: 'Total Rides',       value: '12,847',  change: '+18.4%', up: true,  icon: MapPin,      color: 'from-brand-600 to-brand-900',   data: slice(rideData)    },
    { label: 'Gross Revenue',     value: '₹9.84L',  change: '+23.1%', up: true,  icon: DollarSign,  color: 'from-green-600 to-emerald-800', data: slice(revenueData)  },
    { label: 'Active Users',      value: '2,847',   change: '+12.0%', up: true,  icon: Users,       color: 'from-violet-600 to-purple-800', data: slice(userGrowth)   },
    { label: 'Avg Fare',          value: '₹185.40', change: '+4.8%',  up: true,  icon: TrendingUp,  color: 'from-cyan-600 to-teal-800',     data: slice(rideData).map(v => v * 0.6) },
    { label: 'Cancellation Rate', value: '8.2%',    change: '-1.3%',  up: false, icon: TrendingDown,color: 'from-red-600 to-rose-800',      data: slice(rideData).map(v => v * 0.08)},
    { label: 'Avg Rating',        value: '4.78 ★',  change: '+0.06',  up: true,  icon: Star,        color: 'from-amber-600 to-orange-800',  data: slice(rideData).map(() => 4.7 + Math.random() * 0.2) },
  ];

  const vehicleSegments = [
    { label: 'Economy',  value: 6840, color: '#2563eb' },
    { label: 'Premium',  value: 3214, color: '#7c3aed' },
    { label: 'SUV',      value: 2102, color: '#d97706' },
    { label: 'XL',       value:  691, color: '#0891b2' },
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
    <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Deep platform insights and growth metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                period === p ? 'bg-brand-900 text-white shadow' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {kpis.map(({ label, value, change, up, icon: Icon, color, data }) => (
          <div key={label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all duration-300 overflow-hidden relative">
            {/* Mini sparkline bg */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <AreaChart data={data} color={up ? '#16a34a' : '#dc2626'} height={80} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border flex items-center gap-1 uppercase tracking-wider ${
                  up ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {change}
                </span>
              </div>
              <p className="text-3xl font-display font-extrabold text-slate-900">{value}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rides over time */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-lg">Ride Volume Over Time</p>
              <p className="text-xs font-medium text-slate-500">Daily dispatched trips — {period}</p>
            </div>
            <span className="text-xs text-green-700 font-bold px-2.5 py-1 bg-green-50 border border-green-200 rounded-md shadow-sm">+18.4%</span>
          </div>
          <div className="h-40">
            <AreaChart data={slice(rideData)} color="#2563eb" height={160} />
          </div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">
            <span>{period === '7D' ? '7 days ago' : period === '30D' ? '30 days ago' : '90 days ago'}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Vehicle type mix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <p className="font-bold text-slate-900 text-lg">Vehicle Type Mix</p>
            <p className="text-xs font-medium text-slate-500">Ride distribution by class</p>
          </div>
          <DonutChart segments={vehicleSegments} />
        </div>
      </div>

      {/* Revenue trend + Peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-lg">Revenue Trend</p>
              <p className="text-xs font-medium text-slate-500">Daily gross revenue (₹)</p>
            </div>
            <span className="text-xs text-green-700 font-bold px-2.5 py-1 bg-green-50 border border-green-200 rounded-md shadow-sm">+23.1%</span>
          </div>
          <div className="h-32">
            <AreaChart data={slice(revenueData)} color="#16a34a" height={128} />
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <p className="font-bold text-slate-900 text-lg">Peak Hour Distribution</p>
            <p className="text-xs font-medium text-slate-500">Average active rides per hour</p>
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
                      className={`w-full rounded-t transition-all duration-500 ${isPeak ? 'bg-gradient-to-t from-violet-600 to-violet-400' : 'bg-slate-100 group-hover:bg-slate-200'}`}
                    />
                  </div>
                  {i % 4 === 0 && <span className="text-[8px] font-bold text-slate-400">{i}h</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-violet-500" /><span className="text-slate-600">Peak</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-slate-200" /><span className="text-slate-500">Normal</span></div>
          </div>
        </div>
      </div>

      {/* Zone performance table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Zone Performance</h2>
            <p className="text-xs font-medium text-slate-500">Bengaluru pickup zones breakdown</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-6 py-3">Zone</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Rides</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Revenue</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Share</th>
                <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Surge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zoneData.map((z, i) => {
                const totalRides = zoneData.reduce((s, z) => s + z.rides, 0);
                const share = (z.rides / totalRides) * 100;
                return (
                  <tr key={z.zone} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3 flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono w-4 font-bold">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-900">{z.zone}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-black text-slate-900">{z.rides.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-bold hidden sm:table-cell">₹{(z.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: '80px' }}>
                          <div className="h-full bg-gradient-to-r from-brand-600 to-violet-600 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-8">{share.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm border uppercase tracking-wider ${
                        parseFloat(z.surge) >= 1.4 ? 'bg-red-50 text-red-700 border-red-200' :
                        parseFloat(z.surge) >= 1.2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-green-50 text-green-700 border-green-200'
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
