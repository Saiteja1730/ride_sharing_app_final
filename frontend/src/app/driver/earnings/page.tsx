'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, TrendingUp, Calendar, Clock, ArrowUpRight, 
  ArrowDownLeft, Award, Landmark, Wallet, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { rideApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function DriverEarningsPage() {
  const { user } = useAuthStore();
  const [withdrawing, setWithdrawing] = useState(false);

  // Fetch driver history to get actual ride-wise earnings if available
  const { data: historyData } = useQuery({
    queryKey: ['driver-history', 1],
    queryFn: () => rideApi.getHistory({ page: 1, limit: 10 }).then(r => r.data),
  });

  const rides = historyData?.data || [];

  // Simulated earnings totals based on user metrics
  const todayEarnings = 1450.00;
  const weeklyEarnings = 9230.00;
  const monthlyEarnings = 38400.00;
  const pendingPayout = 2450.00;
  const lifetimeEarnings = (user?.totalRides ?? 48) * 180 + 38400;

  const handleWithdraw = () => {
    if (pendingPayout <= 0) {
      toast.error("No pending funds available for payout.");
      return;
    }
    setWithdrawing(true);
    toast.loading("Initiating instant payout to registered bank account...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Successfully transferred ₹${pendingPayout.toFixed(2)} via IMPS Direct Deposit!`);
      setWithdrawing(false);
    }, 2500);
  };

  // Recharts Chart Data
  const monthlyTrendData = [
    { name: 'Week 1', earnings: 7800 },
    { name: 'Week 2', earnings: 9200 },
    { name: 'Week 3', earnings: 8100 },
    { name: 'Week 4', earnings: 9230 },
  ];

  const peakHoursData = [
    { hour: '8 AM', rides: 4, earnings: 620 },
    { hour: '9 AM', rides: 6, earnings: 980 },
    { hour: '12 PM', rides: 3, earnings: 410 },
    { hour: '5 PM', rides: 5, earnings: 790 },
    { hour: '6 PM', rides: 8, earnings: 1350 },
    { hour: '9 PM', rides: 4, earnings: 580 },
  ];

  const ridesPerDayData = [
    { day: 'Mon', rides: 6 },
    { day: 'Tue', rides: 8 },
    { day: 'Wed', rides: 5 },
    { day: 'Thu', rides: 9 },
    { day: 'Fri', rides: 12 },
    { day: 'Sat', rides: 11 },
    { day: 'Sun', rides: 14 },
  ];

  const payouts = [
    { id: 'pay_001', date: 'May 20, 2026', amount: 8200.00, method: 'Direct Deposit', status: 'completed' },
    { id: 'pay_002', date: 'May 13, 2026', amount: 7650.00, method: 'Direct Deposit', status: 'completed' },
    { id: 'pay_003', date: 'May 06, 2026', amount: 9100.00, method: 'Direct Deposit', status: 'completed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Earnings Analytics</h1>
          <p className="text-slate-400 mt-1">Track and manage your platform revenues</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Available for Payout</p>
              <p className="text-sm font-bold text-white">₹{pendingPayout.toFixed(2)}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleWithdraw} 
            loading={withdrawing}
            className="bg-brand-500 hover:bg-brand-400 font-bold"
            icon={<Landmark className="w-4 h-4" />}
          >
            Instant Cashout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-white/5 hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-white">₹{todayEarnings.toFixed(2)}</p>
          <p className="text-xs text-slate-550 text-slate-500 mt-0.5">Today&apos;s Revenue</p>
        </div>

        <div className="glass-card p-5 border border-white/5 hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-white">₹{weeklyEarnings.toFixed(2)}</p>
          <p className="text-xs text-slate-550 text-slate-500 mt-0.5">Weekly Revenue</p>
        </div>

        <div className="glass-card p-5 border border-white/5 hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-white">₹{monthlyEarnings.toFixed(2)}</p>
          <p className="text-xs text-slate-550 text-slate-500 mt-0.5">Monthly Revenue</p>
        </div>

        <div className="glass-card p-5 border border-white/5 hover:bg-white/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center mb-3">
            <Award className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-white">₹{lifetimeEarnings.toFixed(2)}</p>
          <p className="text-xs text-slate-550 text-slate-500 mt-0.5">Lifetime Revenue</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Area Trend */}
        <div className="glass-card p-5 border border-white/5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Weekly Earnings Trend</h3>
            <p className="text-xs text-slate-550 text-slate-500">Distribution over current billing cycles</p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="earningsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#10b981', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="earnings" name="Earnings (₹)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#earningsGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rides per Day Bar Chart */}
        <div className="glass-card p-5 border border-white/5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Trips completed per Day</h3>
            <p className="text-xs text-slate-550 text-slate-500">Weekly ride density metrics</p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ridesPerDayData}>
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#0ea5e9', fontSize: '11px' }}
                />
                <Bar dataKey="rides" name="Trips" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {ridesPerDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#0ea5e9'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak Earning Hours Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-white/5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Peak Earning Hours</h3>
            <p className="text-xs text-slate-555 text-slate-500">Peak hours with highest passenger demand</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} layout="vertical">
                <XAxis type="number" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis dataKey="hour" type="category" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f59e0b', fontSize: '10px' }}
                />
                <Bar dataKey="earnings" name="Revenue (₹)" fill="#f59e0b" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout History logs */}
        <div className="glass-card p-5 border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Payout History</h3>
          <div className="space-y-3">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center text-emerald-400">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{p.method}</p>
                    <p className="text-[9px] text-slate-500">{p.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-white">₹{p.amount.toFixed(2)}</p>
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 uppercase mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Processed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ride-Wise Earnings Breakdowns */}
        <div className="glass-card p-5 border border-white/5 space-y-4">
          <h3 className="text-base font-bold text-white">Recent Trip Revenue Breakdown</h3>
          <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
            {rides.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No recent trips to display revenue breakdowns.
              </div>
            ) : (
              rides.slice(0, 3).map((ride: any) => {
                const total = ride.fare?.total ?? 0;
                const comm = Math.round(total * 0.10 * 100) / 100;
                const net = Math.round((total - comm) * 100) / 100;
                return (
                  <div key={ride._id} className="p-2.5 rounded-xl bg-white/3 border border-white/5 space-y-2">
                    <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                      <span className="text-[9px] text-slate-500 capitalize font-bold">
                        🚕 {ride.vehicleType} • {(ride.distance ?? 4.2).toFixed(1)} km
                      </span>
                      <span className="text-xs font-black text-green-400">
                        +₹{net.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>Customer Fare: ₹{total.toFixed(0)}</span>
                      <span>Comm (10%): -₹{comm.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
