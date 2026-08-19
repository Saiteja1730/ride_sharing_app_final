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
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Earnings Analytics</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Track and manage your platform revenues</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Available for Payout</p>
              <p className="text-base font-black text-slate-900">₹{pendingPayout.toFixed(2)}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleWithdraw} 
            loading={withdrawing}
            className="font-bold py-3.5 shadow-sm"
            icon={<Landmark className="w-5 h-5" />}
          >
            Instant Cashout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-sm">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">₹{todayEarnings.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Today&apos;s Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center mb-4 shadow-sm">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">₹{weeklyEarnings.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Weekly Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-sm">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">₹{monthlyEarnings.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Monthly Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-sm">
            <Award className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">₹{lifetimeEarnings.toFixed(2)}</p>
          <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Lifetime Revenue</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Area Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Weekly Earnings Trend</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Distribution over current billing cycles</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="earningsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="earnings" name="Earnings (₹)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#earningsGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rides per Day Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trips per Day</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Weekly ride density metrics</p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ridesPerDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '12px' }}
                  itemStyle={{ color: '#0ea5e9', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="rides" name="Trips" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                  {ridesPerDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#0ea5e9'} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak Earning Hours Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Peak Earning Hours</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Hours with highest demand</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} fontWeight={600} />
                <YAxis dataKey="hour" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} fontWeight={600} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="earnings" name="Revenue (₹)" fill="#f59e0b" fillOpacity={0.9} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout History logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Payout History</h3>
          <div className="space-y-3">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.method}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{p.date}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-slate-900">₹{p.amount.toFixed(2)}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Processed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ride-Wise Earnings Breakdowns */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Trip Revenue Breakdown</h3>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
            {rides.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-slate-500">
                No recent trips to display revenue breakdowns.
              </div>
            ) : (
              rides.slice(0, 4).map((ride: any) => {
                const total = ride.fare?.total ?? 0;
                const comm = Math.round(total * 0.10 * 100) / 100;
                const net = Math.round((total - comm) * 100) / 100;
                return (
                  <div key={ride._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-[10px] text-slate-500 capitalize font-bold uppercase tracking-wider">
                        🚕 {ride.vehicleType} • {(ride.distance ?? 4.2).toFixed(1)} km
                      </span>
                      <span className="text-sm font-black text-green-600">
                        +₹{net.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
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
