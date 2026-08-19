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
import { rideApi, authApi } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useRideStore } from '@/stores/rideStore';
import { RideCard } from '@/components/ride/RideCard';
import { StatCardSkeleton, RideCardSkeleton } from '@/components/ui/Skeletons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function RiderDashboard() {
  const { user, updateUser } = useAuthStore();
  const { activeRide: storeRide, setDropoff, setPickup } = useRideStore();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);

  // Sync profile on mount
  useEffect(() => {
    authApi.getMe().then(res => {
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    }).catch(() => {});
  }, [updateUser]);

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
    <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 to-brand-900 p-8 md:p-10 shadow-lg border border-brand-800">
        <div className="absolute right-[-10%] top-[-20%] w-[300px] h-[300px] bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute left-[30%] bottom-[-40%] w-[250px] h-[250px] bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold text-white shadow-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Platform Premium Member
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white md:text-5xl tracking-tight">
              Hello, {user?.name?.split(' ')[0] || 'Rider'} 👋
            </h1>
            <p className="text-brand-100 text-sm md:text-base max-w-lg font-medium leading-relaxed">
              Your safety is our top priority. All active rides are verified with a 24/7 emergency dispatch SOS monitor.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Realtime Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all relative border border-white/20 backdrop-blur-sm shadow-sm"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white p-4 z-40 rounded-2xl border border-slate-200 shadow-xl animate-fade-in space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Alerts & Messages</p>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-slate-500 hover:text-slate-900 font-bold uppercase">Close</button>
                  </div>
                  <div className="space-y-2">
                    {dummyNotifications.map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <ShieldCheck className="w-4 h-4 text-brand-600" />}
                            {n.title}
                          </p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{n.time}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/rider/book">
              <Button size="lg" icon={<MapPin className="w-5 h-5" />} className="bg-white text-brand-900 hover:bg-slate-50 font-bold border border-transparent shadow-sm py-3.5 px-6">
                Book a Ride
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active ride banner */}
      {currentRide && (
        <div className="bg-white p-6 rounded-2xl shadow-card border border-brand-200 animate-slide-up relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-ping shadow-sm" />
              <p className="font-bold text-slate-900 text-base">Ongoing Trip Details</p>
            </div>
            <Badge label={currentRide.status} status={currentRide.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3 relative">
              <div className="absolute left-[9px] top-4 bottom-2 w-0.5 bg-slate-200 rounded-full" />
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-5 h-5 rounded-full bg-green-100 border-2 border-green-500 flex-shrink-0 flex items-center justify-center mt-0.5" />
                <p className="text-sm font-medium text-slate-700">{currentRide.pickupLocation?.address}</p>
              </div>
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-5 h-5 rounded-full bg-brand-100 border-2 border-brand-500 flex-shrink-0 flex items-center justify-center mt-0.5" />
                <p className="text-sm font-medium text-slate-700">{currentRide.dropoffLocation?.address}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fare</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">₹{currentRide.fare?.total?.toFixed(2)}</p>
              </div>
              <Link href="/rider/book">
                <Button size="lg" icon={<ArrowRight className="w-5 h-5" />} className="shadow-sm">
                  Track Live Map
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all duration-300">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">{value}</p>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Link href="/rider/book" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-card transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight">Request Ride</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Book now in 1 click</p>
          </div>
        </Link>
        <Link href="/rider/history" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-card transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight">Ride History</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Invoices & details</p>
          </div>
        </Link>
        <Link href="/rider/profile" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-card transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight">My Profile</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Manage preferences</p>
          </div>
        </Link>
        <button onClick={() => toast.success("Connecting with Live Support agent...")} className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-card transition-all duration-300 text-left group w-full">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 leading-tight">24/7 SOS Help</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Emergency assistance</p>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Recent rides list */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
              <Clock className="w-6 h-6 text-brand-600" /> Recent Trips
            </h2>
            <Link href="/rider/history" className="text-sm text-brand-600 hover:text-brand-800 flex items-center gap-1.5 font-bold transition-colors">
              View full logs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              <RideCardSkeleton />
              <RideCardSkeleton />
            </div>
          ) : recentRides.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-slate-200">
              <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-900 font-bold">No rides yet</p>
              <p className="text-sm text-slate-500 mt-1 font-medium">Book your first ride to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRides.map((ride: any) => (
                <div key={ride._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all">
                  <RideCard ride={ride} compact={false} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick actions, Live Radar, Spend Analytics, and favorite list */}
        <div className="space-y-6">
          {/* Live Surrounding Cabs Radar Tracker */}
          <div className="bg-white p-6 rounded-2xl shadow-card relative overflow-hidden border border-slate-200">
            <div className="absolute right-[-10%] top-[-25%] w-[200px] h-[200px] bg-brand-50 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-5 relative z-10">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-5 h-5 text-brand-600 animate-pulse" /> Live Area
              </h3>
              <Badge label="Active Matcher" status="searching" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Drivers</p>
                <p className="text-3xl font-black text-slate-900 mt-1.5">14 Cabs</p>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">🟢 Within 1.5 km</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pickup ETA</p>
                <p className="text-3xl font-black text-brand-600 mt-1.5">3 mins</p>
                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Indiranagar Sector</p>
              </div>
            </div>

            {/* Radar Visualizer */}
            <div className="h-32 rounded-xl bg-slate-50 border border-slate-200 relative flex items-center justify-center overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(15,23,42,0.03))] pointer-events-none" />
              <div className="absolute w-[200%] h-[200%] bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/10 origin-center animate-[spin_5s_linear_infinite]" />
              
              <div className="absolute w-28 h-28 rounded-full border border-slate-200" />
              <div className="absolute w-20 h-20 rounded-full border border-slate-200" />
              <div className="absolute w-12 h-12 rounded-full border border-slate-200" />
              
              <div className="absolute w-full h-px bg-slate-200" />
              <div className="absolute h-full w-px bg-slate-200" />

              <div className="absolute top-8 left-12 w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping pointer-events-none" />
              <div className="absolute top-8 left-12 w-2 h-2 rounded-full bg-brand-600 pointer-events-none shadow-sm" />
              
              <div className="absolute bottom-6 right-16 w-3 h-3 rounded-full bg-emerald-500 animate-ping pointer-events-none" />
              <div className="absolute bottom-6 right-16 w-2.5 h-2.5 rounded-full bg-emerald-500 pointer-events-none shadow-sm" />
              
              <div className="absolute top-14 right-8 w-2 h-2 rounded-full bg-brand-500 pointer-events-none animate-pulse shadow-sm" />
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center bg-white p-2.5 rounded-full border border-slate-200 shadow-sm z-10">
                <MapPin className="w-5 h-5 text-slate-900 animate-bounce" />
              </div>

              <span className="absolute bottom-2 left-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Local Range: 2km
              </span>
            </div>
          </div>

          {/* Quick preset locations */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-100" /> Saved Locations
            </h3>
            <div className="space-y-2">
              {FAVORITES.map(fav => (
                <button
                  key={fav.label}
                  onClick={() => handleFavoriteClick(fav)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all text-left group shadow-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:text-brand-600 group-hover:border-brand-200 transition-all shadow-sm">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{fav.label}</p>
                      <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{fav.address}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Spend Analytics summary */}
          <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Spend Analytics</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Expenditure trend in INR</p>
              </div>
              <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">
                Healthy
              </span>
            </div>

            <div className="h-40 w-full pt-2">
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
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} fontWeight={600} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="spend" name="Spend (₹)" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#spendGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Surge & Demand warning banner */}
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-bold text-orange-900 tracking-tight">Peak Rush Hour active</p>
              <p className="text-xs font-medium text-orange-800/80 leading-relaxed">
                Bengaluru traffic demand is currently high. Selected vehicle bookings may experience a minor surge multiplier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
