'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Clock, Star, TrendingUp, Car, ArrowRight,
  Bell, AlertTriangle, Navigation, ShieldCheck, Heart,
  Sparkles, CheckCircle2, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip } from 'recharts';
import { rideApi } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { RideCard } from '@/components/ride/RideCard';
import { StatCardSkeleton, RideCardSkeleton } from '@/components/ui/Skeletons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

export default function RiderDashboard() {
  const { user } = useAuthStore();
  const { activeRide: storeRide, setDropoff, setPickup } = useRideStore();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);

  // Active Ride Query
  const { data: activeRide } = useQuery({
    queryKey: ['active-ride'],
    queryFn: () => rideApi.getActiveRide().then(r => r.data.data),
    refetchInterval: 5000,
  });

  // Ride History Query
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['ride-history', 1],
    queryFn: () => rideApi.getHistory({ page: 1, limit: 3 }).then(r => r.data),
  });

  const currentRide = activeRide || storeRide;
  const recentRides = historyData?.data || [];

  // Calculate simulated money spent from history
  const totalMoneySpent = recentRides.reduce((sum: number, r: any) => sum + (r.fare?.total ?? 0), 0) * 1.5;

  const stats = [
    { label: 'Total Rides', value: user?.totalRides ?? 0, icon: Car, color: 'from-brand-500 to-brand-700' },
    { label: 'Avg Rating', value: `${user?.rating?.toFixed(1) ?? '5.0'} ★`, icon: Star, color: 'from-amber-500 to-orange-700' },
    { label: 'Money Spent', value: `₹${totalMoneySpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'from-green-500 to-emerald-700' },
    { label: 'Member Since', value: '2025', icon: Clock, color: 'from-violet-500 to-purple-700' },
  ];

  // Favorite presets
  const FAVORITES = [
    { label: 'Home', address: 'Koramangala 5th Block, Bengaluru, Karnataka, India', coords: { lat: 12.9348, lng: 77.6189 } },
    { label: 'Work', address: 'Embassy TechVillage, Bellandur, Bengaluru, Karnataka, India', coords: { lat: 12.9288, lng: 77.6917 } },
    { label: 'Airport', address: 'Kempegowda International Airport (BLR), Bengaluru, Karnataka, India', coords: { lat: 13.1986, lng: 77.7066 } },
  ];

  const handleFavoriteClick = (fav: typeof FAVORITES[0]) => {
    // Automatically pre-populate dropoff in our state store and redirect to map!
    const defaultPickup = {
      address: 'MG Road Metro Station, Bengaluru, Karnataka, India',
      coordinates: { lat: 12.9756, lng: 77.6068 }
    };
    setPickup(defaultPickup);
    setDropoff({
      address: fav.address,
      coordinates: fav.coords,
    });
    toast.success(`Destination prefilled to ${fav.label}!`);
    router.push('/rider/book');
  };

  const dummyNotifications = [
    { id: 1, title: 'Surge pricing active', desc: 'Demand is high in Indiranagar. Base multipliers at 1.3x.', time: '2 mins ago', type: 'warning' },
    { id: 2, title: 'Driver assigned successfully', desc: 'Driver Rajesh (KA-03-HA-1234) is on the way!', time: '1 hr ago', type: 'info' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-900 p-8 shadow-glow border border-brand-500/20">
        <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute left-[30%] bottom-[-40%] w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5" /> Platform Premium Member
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white md:text-4xl">
              Hello, {user?.name?.split(' ')[0] || 'Rider'} 👋
            </h1>
            <p className="text-slate-200 text-sm max-w-md">
              Your safety is our top priority. All active rides are verified with a 24/7 emergency dispatch SOS monitor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all relative border border-white/5"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-card p-4 z-40 border border-white/10 shadow-xl animate-fade-in space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Alerts & Messages</p>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-slate-500 hover:text-white">Close</button>
                  </div>
                  <div className="space-y-2">
                    {dummyNotifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-white/3 border border-white/5 space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-white flex items-center gap-1">
                            {n.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-400" /> : <ShieldCheck className="w-3 h-3 text-brand-400" />}
                            {n.title}
                          </p>
                          <span className="text-[9px] text-slate-500">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/rider/book">
              <Button size="lg" icon={<MapPin className="w-4 h-4" />} className="bg-white text-brand-950 hover:bg-slate-100 font-bold hover:shadow-glow-white border-0">
                Book a Ride
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active ride banner */}
      {currentRide && (
        <div className="glass-card p-5 border-brand-500/30 bg-brand-500/5 animate-slide-up relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
              <p className="font-bold text-white text-sm">Ongoing Trip Details</p>
            </div>
            <Badge label={currentRide.status} status={currentRide.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-slate-300 truncate">{currentRide.pickupLocation?.address}</p>
              </div>
              <div className="ml-1 w-px h-3 bg-slate-700" />
              <div className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-slate-300 truncate">{currentRide.dropoffLocation?.address}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
              <div className="text-right">
                <p className="text-xs text-slate-500">Total Fare</p>
                <p className="text-lg font-black text-white mt-0.5">₹{currentRide.fare?.total?.toFixed(2)}</p>
              </div>
              <Link href="/rider/book">
                <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />} className="bg-brand-500 hover:bg-brand-400">
                  Track Live Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-5 hover:bg-white/5 transition-all duration-300">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-md shadow-black/20`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-display font-extrabold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/rider/book" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-brand-500/10 hover:border-brand-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Request Ride</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Book now in 1 click</p>
          </div>
        </Link>
        <Link href="/rider/history" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Ride History</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Invoices & details</p>
          </div>
        </Link>
        <Link href="/rider/profile" className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">My Profile</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Manage preferences</p>
          </div>
        </Link>
        <button onClick={() => toast.success("Connecting with Live Support agent...")} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-300 text-left group w-full">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">24/7 SOS Help</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Emergency assistance</p>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Recent rides list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" /> Recent Trips
            </h2>
            <Link href="/rider/history" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold">
              View full logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              <RideCardSkeleton />
              <RideCardSkeleton />
            </div>
          ) : recentRides.length === 0 ? (
            <div className="glass-card p-10 text-center border border-white/5">
              <Car className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No rides yet</p>
              <p className="text-sm text-slate-600 mt-1">Book your first ride to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRides.map((ride: any) => (
                <RideCard key={ride._id} ride={ride} compact={false} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick actions, Live Radar, Spend Analytics, and favorite list */}
        <div className="space-y-6">
          {/* Live Surrounding Cabs Radar Tracker */}
          <div className="glass-card p-5 relative overflow-hidden border border-white/10 bg-white/5">
            <div className="absolute right-[-10%] top-[-25%] w-[180px] h-[180px] bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-400 animate-pulse" /> Live Surrounding Cabs
              </h3>
              <Badge label="Active Matcher" status="searching" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-center">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Active Drivers</p>
                <p className="text-2xl font-black text-white mt-1">14 Cabs</p>
                <p className="text-[10px] text-emerald-400 mt-0.5">🟢 Within 1.5 km</p>
              </div>
              <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-center">
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Pickup ETA</p>
                <p className="text-2xl font-black text-brand-400 mt-1">3 mins</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Indiranagar Sector</p>
              </div>
            </div>

            {/* Radar Visualizer */}
            <div className="h-28 rounded-xl bg-slate-950/80 border border-white/5 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,180,216,0.06))] pointer-events-none" />
              <div className="absolute w-[200%] h-[200%] bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/20 origin-center animate-[spin_5s_linear_infinite]" />
              
              <div className="absolute w-24 h-24 rounded-full border border-brand-500/10" />
              <div className="absolute w-16 h-16 rounded-full border border-brand-500/10" />
              <div className="absolute w-8 h-8 rounded-full border border-brand-500/15" />
              
              <div className="absolute w-full h-px bg-white/5" />
              <div className="absolute h-full w-px bg-white/5" />

              <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-brand-400 animate-ping pointer-events-none" />
              <div className="absolute top-8 left-12 w-1.5 h-1.5 rounded-full bg-brand-400 pointer-events-none" />
              
              <div className="absolute bottom-6 right-16 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping pointer-events-none" />
              <div className="absolute bottom-6 right-16 w-2 h-2 rounded-full bg-emerald-400 pointer-events-none" />
              
              <div className="absolute top-14 right-8 w-2 h-2 rounded-full bg-brand-400 pointer-events-none animate-pulse" />
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-brand-500/20 p-2 rounded-full border border-brand-500/40">
                <MapPin className="w-4 h-4 text-brand-300 animate-bounce" />
              </div>

              <span className="absolute bottom-2 left-3 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                Local Range: 2km
              </span>
            </div>
          </div>

          {/* Quick preset locations */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" /> Saved Locations
            </h3>
            <div className="space-y-2">
              {FAVORITES.map(fav => (
                <button
                  key={fav.label}
                  onClick={() => handleFavoriteClick(fav)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white">{fav.label}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{fav.address}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Spend Analytics summary */}
          <div className="glass-card p-5 border border-white/10 bg-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Spend Analytics</h3>
                <p className="text-[10px] text-slate-500">Expenditure trend in INR</p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Healthy
              </span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { month: 'Jan', spend: 850 },
                    { month: 'Feb', spend: 1200 },
                    { month: 'Mar', spend: 980 },
                    { month: 'Apr', spend: 1650 },
                    { month: 'May', spend: totalMoneySpent > 0 ? totalMoneySpent : 1400 },
                  ]}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="spendGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}
                    itemStyle={{ color: '#0ea5e9', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="spend" name="Spend (₹)" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#spendGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Surge & Demand warning banner */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Peak Rush Hour active</p>
              <p className="text-[10px] text-slate-400 leading-normal">
                Bengaluru traffic demand is currently high. Selected vehicle bookings may experience a minor surge multiplier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
